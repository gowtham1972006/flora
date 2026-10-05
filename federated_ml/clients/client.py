"""
FloraVeda — Federated Client
==============================
Simulates a federated learning client that:
1. Receives the global model
2. Loads ONLY its own local data
3. Trains locally
4. Produces a model update (never sends raw images)

PRIVACY INVARIANT: This client never exposes its raw images,
processed images, or local feature vectors to the server.
Only model weight deltas and control variates are communicated.
"""

import copy
import logging
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

logger = logging.getLogger(__name__)


class FederatedClient:
    """
    A simulated federated learning client.

    Each client:
    - Owns a subset of the training data (indices into the global dataset)
    - Trains a local copy of the global model
    - Returns only model updates (weight deltas) and metrics

    The client NEVER sends its data, images, or features to the server.
    """

    def __init__(
        self,
        client_id: int,
        dataloader: DataLoader,
        device: torch.device,
    ):
        """
        Args:
            client_id: Unique identifier for this client.
            dataloader: DataLoader containing ONLY this client's local data.
            device: Torch device (cpu/cuda).
        """
        self.client_id = client_id
        self.dataloader = dataloader
        self.device = device
        self.num_samples = len(dataloader.dataset)

        logger.info(
            f"Client {client_id}: {self.num_samples} local samples, "
            f"device={device}"
        )

    def train_local(
        self,
        global_model_state: Dict[str, torch.Tensor],
        model_fn,
        local_epochs: int,
        learning_rate: float,
        weight_decay: float = 1e-4,
        scaffold_correction: Optional[Dict[str, torch.Tensor]] = None,
    ) -> Dict:
        """
        Train the model locally on this client's data.

        Args:
            global_model_state: State dict of the current global model.
            model_fn: Callable that creates a new model instance.
            local_epochs: Number of local training epochs.
            learning_rate: Learning rate for local SGD.
            weight_decay: L2 regularization.
            scaffold_correction: Optional SCAFFOLD correction term (c - cᵢ).
                When provided, the gradient is corrected as:
                    g_corrected = g + (c - cᵢ)

        Returns:
            Dictionary containing:
            - 'model_delta': Weight delta (w_global - w_local_after)
            - 'num_samples': Number of training samples
            - 'metrics': Dict with 'loss' and 'accuracy'
            - 'model_state': The trained local model state dict
        """
        # Create a fresh local model and load global weights
        model = model_fn()
        model.load_state_dict(global_model_state)
        model = model.to(self.device)
        model.train()

        # Store the initial global weights for computing delta
        global_weights = {
            k: v.clone().detach()
            for k, v in global_model_state.items()
        }

        # Log initial weight norm for verification
        init_norm = sum(v.float().norm().item() for v in global_weights.values())
        logger.info(f"[ML CLIENT] Client {self.client_id} — weight norm BEFORE training: {init_norm:.4f}")

        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.SGD(
            model.parameters(),
            lr=learning_rate,
            momentum=0.9,
            weight_decay=weight_decay,
        )

        total_loss = 0.0
        total_correct = 0
        total_samples = 0

        for epoch in range(local_epochs):
            epoch_loss = 0.0
            epoch_correct = 0
            epoch_total = 0

            for batch_x, batch_y in self.dataloader:
                batch_x = batch_x.to(self.device)
                batch_y = batch_y.to(self.device)

                optimizer.zero_grad()
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()

                # SCAFFOLD correction: adjust gradients
                if scaffold_correction is not None:
                    with torch.no_grad():
                        for name, param in model.named_parameters():
                            if param.grad is not None and name in scaffold_correction:
                                param.grad.add_(scaffold_correction[name].to(self.device))

                optimizer.step()

                # Track metrics
                epoch_loss += loss.item() * batch_x.size(0)
                _, preds = torch.max(outputs, 1)
                epoch_correct += (preds == batch_y).sum().item()
                epoch_total += batch_x.size(0)

            total_loss += epoch_loss
            total_correct += epoch_correct
            total_samples += epoch_total

        # Compute average metrics across all epochs
        avg_loss = total_loss / total_samples if total_samples > 0 else 0
        avg_accuracy = total_correct / total_samples if total_samples > 0 else 0

        # Log weight norm AFTER training — must differ from before to confirm training works
        local_state = model.state_dict()
        post_norm = sum(v.float().norm().item() for v in local_state.values())
        logger.info(
            f"[ML CLIENT] Client {self.client_id} — weight norm AFTER training: {post_norm:.4f} "
            f"(delta norm = {abs(post_norm - init_norm):.4f})"
        )
        if abs(post_norm - init_norm) < 1e-6:
            logger.warning(
                f"[ML CLIENT] WARNING: Client {self.client_id} weights did NOT change! "
                f"Check learning rate / data / gradient flow."
            )
        model_delta = {}
        for key in global_weights:
            model_delta[key] = (
                global_weights[key].cpu() - local_state[key].cpu()
            )

        logger.info(
            f"Client {self.client_id}: "
            f"loss={avg_loss:.4f}, acc={avg_accuracy:.4f}, "
            f"samples={self.num_samples}"
        )

        return {
            "model_delta": model_delta,
            "num_samples": self.num_samples,
            "metrics": {
                "loss": avg_loss,
                "accuracy": avg_accuracy,
            },
            "model_state": {k: v.cpu() for k, v in local_state.items()},
        }
