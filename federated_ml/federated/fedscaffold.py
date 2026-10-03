"""
FloraVeda — FedSCAFFOLD (Stochastic Controlled Averaging)
==========================================================
Primary federated learning algorithm addressing client drift in non-IID settings.

Reference:
    Karimireddy et al., "SCAFFOLD: Stochastic Controlled Averaging for
    Federated Learning" (ICML 2020)

Key idea:
    Each client maintains a control variate cᵢ that estimates the local
    gradient direction. The server maintains a global control variate c.
    During local training, gradients are corrected by (c - cᵢ) to reduce
    the drift caused by heterogeneous data distributions.

Algorithm per round:
    1. Server sends (w, c) to selected clients
    2. Each client i:
       a. Initializes local model yᵢ = w
       b. For each local step:
          - Compute mini-batch gradient gᵢ
          - Correct: gᵢ_corrected = gᵢ + (c - cᵢ)
          - Update: yᵢ ← yᵢ - η · gᵢ_corrected
       c. Compute new control variate:
          cᵢ_new = cᵢ - c + (w - yᵢ) / (K · η)
          where K = number of local steps, η = learning rate
       d. Send (Δyᵢ = yᵢ - w, Δcᵢ = cᵢ_new - cᵢ) to server
    3. Server aggregates:
       w_new = w + (1/S) Σ Δyᵢ
       c_new = c + (1/N) Σ Δcᵢ
       where S = number of selected clients, N = total clients
"""

import copy
import logging
from typing import Dict, List, Optional, NamedTuple

import torch

logger = logging.getLogger(__name__)


class ScaffoldState(NamedTuple):
    """Encapsulates all SCAFFOLD-specific state."""
    global_control: Dict[str, torch.Tensor]           # c (server)
    client_controls: Dict[int, Dict[str, torch.Tensor]]  # cᵢ per client


def initialize_scaffold_state(
    model_state: Dict[str, torch.Tensor],
    num_clients: int,
) -> ScaffoldState:
    """
    Initialize SCAFFOLD control variates to zero.

    Both the global control variate c and all client control variates cᵢ
    start at zero. They are updated each round based on training dynamics.

    Args:
        model_state: The global model state dict (used to determine shapes).
        num_clients: Total number of clients.

    Returns:
        ScaffoldState with zeroed control variates.
    """
    global_control = {
        key: torch.zeros_like(val, dtype=torch.float32)
        for key, val in model_state.items()
    }

    client_controls = {}
    for i in range(num_clients):
        client_controls[i] = {
            key: torch.zeros_like(val, dtype=torch.float32)
            for key, val in model_state.items()
        }

    logger.info(f"Initialized SCAFFOLD state for {num_clients} clients")
    return ScaffoldState(global_control=global_control, client_controls=client_controls)


def compute_scaffold_correction(
    global_control: Dict[str, torch.Tensor],
    client_control: Dict[str, torch.Tensor],
) -> Dict[str, torch.Tensor]:
    """
    Compute the SCAFFOLD correction term: (c - cᵢ)

    This correction is added to the gradient during local training
    to counteract the client drift caused by non-IID data.

    Args:
        global_control: Server control variate c.
        client_control: This client's control variate cᵢ.

    Returns:
        Correction dict: {param_name: (c - cᵢ)} for each parameter.
    """
    correction = {}
    for key in global_control:
        correction[key] = global_control[key] - client_control[key]
    return correction


def update_client_control(
    old_client_control: Dict[str, torch.Tensor],
    global_control: Dict[str, torch.Tensor],
    global_model_state: Dict[str, torch.Tensor],
    local_model_state: Dict[str, torch.Tensor],
    num_local_steps: int,
    learning_rate: float,
) -> Dict[str, torch.Tensor]:
    """
    Update the client control variate after local training (Option II from paper).

    Formula:
        cᵢ_new = cᵢ - c + (w_global - w_local) / (K · η)

    where:
        cᵢ = old client control variate
        c  = global control variate
        w_global = global model weights before local training
        w_local  = local model weights after training
        K  = total number of local SGD steps
        η  = learning rate

    Args:
        old_client_control: Current client control variate cᵢ.
        global_control: Server control variate c.
        global_model_state: Global model state before local training.
        local_model_state: Local model state after training.
        num_local_steps: Total number of local optimization steps (epochs × batches).
        learning_rate: Learning rate used during local training.

    Returns:
        Updated client control variate cᵢ_new.
    """
    denominator = max(num_local_steps * learning_rate, 1e-10)

    new_control = {}
    for key in old_client_control:
        # cᵢ_new = cᵢ - c + (w_global - w_local) / (K · η)
        new_control[key] = (
            old_client_control[key]
            - global_control[key]
            + (global_model_state[key].float() - local_model_state[key].float()) / denominator
        )

    return new_control


def scaffold_aggregate(
    global_state: Dict[str, torch.Tensor],
    scaffold_state: ScaffoldState,
    client_updates: List[Dict],
    total_num_clients: int,
    learning_rate: float,
) -> tuple:
    """
    Aggregate client updates using the SCAFFOLD algorithm.

    Server update rules:
        w_new = w + (1/S) · Σ (wᵢ - w)
              = w + (1/S) · Σ Δyᵢ

        c_new = c + (1/N) · Σ Δcᵢ

    where S = number of participating clients this round,
          N = total number of clients.

    Args:
        global_state: Current global model state dict.
        scaffold_state: Current SCAFFOLD state (global + client controls).
        client_updates: List of dicts from clients, each containing:
            - 'model_state': Trained local model state dict
            - 'model_delta': w_global - w_local
            - 'num_samples': Number of local samples
            - 'client_id': Client identifier
            - 'new_client_control': Updated cᵢ_new
            - 'control_delta': Δcᵢ = cᵢ_new - cᵢ_old
        total_num_clients: Total number of clients (N), including non-participating.
        learning_rate: Learning rate used during local training.

    Returns:
        Tuple of (new_global_state, new_scaffold_state).
    """
    if not client_updates:
        logger.warning("No client updates. Returning state unchanged.")
        return copy.deepcopy(global_state), scaffold_state

    num_participating = len(client_updates)

    # ── Aggregate model: w_new = w + (1/S) · Σ (wᵢ - w) ──────────────────
    new_global_state = copy.deepcopy(global_state)
    for key in new_global_state:
        delta_sum = torch.zeros_like(new_global_state[key], dtype=torch.float32)
        for update in client_updates:
            # Δyᵢ = wᵢ - w  (note: model_delta stores w - wᵢ, so negate)
            delta_sum -= update["model_delta"][key].float()
        new_global_state[key] = (
            global_state[key].float() + delta_sum / num_participating
        ).to(global_state[key].dtype)

    # ── Aggregate control variates: c_new = c + (1/N) · Σ Δcᵢ ─────────────
    new_global_control = copy.deepcopy(scaffold_state.global_control)
    for key in new_global_control:
        control_delta_sum = torch.zeros_like(new_global_control[key])
        for update in client_updates:
            if "control_delta" in update:
                control_delta_sum += update["control_delta"][key]
        new_global_control[key] += control_delta_sum / total_num_clients

    # ── Update per-client controls ──────────────────────────────────────────
    new_client_controls = copy.deepcopy(scaffold_state.client_controls)
    for update in client_updates:
        client_id = update["client_id"]
        if "new_client_control" in update:
            new_client_controls[client_id] = update["new_client_control"]

    new_scaffold_state = ScaffoldState(
        global_control=new_global_control,
        client_controls=new_client_controls,
    )

    logger.info(
        f"SCAFFOLD aggregation: {num_participating}/{total_num_clients} clients"
    )

    return new_global_state, new_scaffold_state
