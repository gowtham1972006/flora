"""
FloraVeda — FedAvg (Federated Averaging)
==========================================
Baseline federated learning algorithm.

Reference:
    McMahan et al., "Communication-Efficient Learning of Deep Networks
    from Decentralized Data" (AISTATS 2017)

Algorithm:
    1. Server sends global model to selected clients
    2. Each client trains locally for E epochs
    3. Server aggregates via weighted average:
       w_global = Σ (nᵢ / N) · wᵢ
       where nᵢ = samples on client i, N = total samples
"""

import copy
import logging
from typing import Dict, List

import torch

logger = logging.getLogger(__name__)


def fedavg_aggregate(
    global_state: Dict[str, torch.Tensor],
    client_updates: List[Dict],
) -> Dict[str, torch.Tensor]:
    """
    Aggregate client model updates using Federated Averaging.

    The aggregation computes a weighted average of client models,
    weighted by each client's number of training samples:

        w_new = Σ (nᵢ / N) · wᵢ

    Args:
        global_state: Current global model state dict (used as reference).
        client_updates: List of dicts, each containing:
            - 'model_state': Client's trained model state dict
            - 'num_samples': Number of training samples on this client

    Returns:
        New global model state dict after aggregation.
    """
    if not client_updates:
        logger.warning("No client updates received. Returning global state unchanged.")
        return copy.deepcopy(global_state)

    # Compute total samples across all participating clients
    total_samples = sum(u["num_samples"] for u in client_updates)

    if total_samples == 0:
        logger.warning("Total samples is 0. Returning global state unchanged.")
        return copy.deepcopy(global_state)

    # Initialize new state with zeros
    new_state = {}
    for key in global_state:
        new_state[key] = torch.zeros_like(global_state[key], dtype=torch.float32)

    # Weighted average of client models
    for update in client_updates:
        weight = update["num_samples"] / total_samples
        client_state = update["model_state"]

        for key in new_state:
            new_state[key] += weight * client_state[key].float()

    # Cast back to original dtypes
    for key in new_state:
        new_state[key] = new_state[key].to(global_state[key].dtype)

    logger.info(
        f"FedAvg aggregation: {len(client_updates)} clients, "
        f"{total_samples} total samples"
    )

    return new_state
