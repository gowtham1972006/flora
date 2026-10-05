"""
FloraVeda — Federated Server
==============================
Orchestrates the federated learning process:
- Manages the global model
- Dispatches to clients
- Aggregates updates (FedAvg or FedSCAFFOLD)
- Saves checkpoints
- Logs metrics

PRIVACY INVARIANT: The server NEVER receives or accesses:
- Raw images from clients
- Processed images
- Augmented images
- Image files
- Raw feature vectors

The server only receives:
- Model weight updates (deltas)
- Control variates (SCAFFOLD)
- Sample counts
- Training metrics
"""

import copy
import json
import logging
import time
from pathlib import Path
from typing import Callable, Dict, List, Optional

import torch

from .fedavg import fedavg_aggregate
from .fedscaffold import (
    ScaffoldState,
    initialize_scaffold_state,
    scaffold_aggregate,
    compute_scaffold_correction,
    update_client_control,
)

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import CHECKPOINT_DIR, LOG_DIR, checkpoint_path, final_checkpoint_path

logger = logging.getLogger(__name__)


class FederatedServer:
    """
    Central federated learning server.

    Manages the global model and coordinates training across
    simulated clients WITHOUT accessing their data.
    """

    def __init__(
        self,
        model_fn: Callable,
        num_clients: int,
        algorithm: str = "fedscaffold",
        device: Optional[torch.device] = None,
        class_names: Optional[List[str]] = None,
    ):
        """
        Args:
            model_fn: Callable that returns a fresh model instance.
            num_clients: Total number of federated clients.
            algorithm: "fedavg" or "fedscaffold".
            device: Torch device.
            class_names: List of class names (saved into every checkpoint).
        """
        self.model_fn = model_fn
        self.num_clients = num_clients
        self.algorithm = algorithm.lower()
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.class_names: List[str] = class_names or []

        # Initialize global model
        self.global_model = model_fn()
        self.global_model = self.global_model.to(self.device)
        self.global_state = {
            k: v.cpu().clone() for k, v in self.global_model.state_dict().items()
        }

        # Initialize SCAFFOLD state if needed
        self.scaffold_state: Optional[ScaffoldState] = None
        if self.algorithm == "fedscaffold":
            self.scaffold_state = initialize_scaffold_state(
                self.global_state, num_clients
            )

        # Metrics tracking
        self.round_metrics: List[Dict] = []
        self.current_round = 0

        logger.info(
            f"Federated Server initialized: algorithm={algorithm}, "
            f"clients={num_clients}, device={self.device}"
        )

    def get_global_state(self) -> Dict[str, torch.Tensor]:
        """Return a copy of the current global model state dict."""
        return copy.deepcopy(self.global_state)

    def get_scaffold_correction(self, client_id: int) -> Optional[Dict[str, torch.Tensor]]:
        """
        Get the SCAFFOLD correction term for a specific client.
        Returns (c - cᵢ) or None if not using SCAFFOLD.
        """
        if self.scaffold_state is None:
            return None

        return compute_scaffold_correction(
            self.scaffold_state.global_control,
            self.scaffold_state.client_controls[client_id],
        )

    def aggregate_round(
        self,
        client_updates: List[Dict],
        learning_rate: float,
    ) -> Dict:
        """
        Aggregate client updates for one federated round.

        Args:
            client_updates: List of update dicts from participating clients.
            learning_rate: Learning rate used by clients.

        Returns:
            Dict with round metrics.
        """
        self.current_round += 1
        round_start = time.time()

        if self.algorithm == "fedavg":
            self.global_state = fedavg_aggregate(
                self.global_state, client_updates
            )
        elif self.algorithm == "fedscaffold":
            # Compute SCAFFOLD-specific fields for each client update
            for update in client_updates:
                client_id = update["client_id"]

                # Calculate number of local steps
                num_local_steps = update.get("num_local_steps", 1)

                # Update client control variate
                new_control = update_client_control(
                    old_client_control=self.scaffold_state.client_controls[client_id],
                    global_control=self.scaffold_state.global_control,
                    global_model_state=self.global_state,
                    local_model_state=update["model_state"],
                    num_local_steps=num_local_steps,
                    learning_rate=learning_rate,
                )

                # Compute control delta
                old_control = self.scaffold_state.client_controls[client_id]
                control_delta = {
                    k: new_control[k] - old_control[k]
                    for k in new_control
                }

                update["new_client_control"] = new_control
                update["control_delta"] = control_delta

            self.global_state, self.scaffold_state = scaffold_aggregate(
                self.global_state,
                self.scaffold_state,
                client_updates,
                total_num_clients=self.num_clients,
                learning_rate=learning_rate,
            )
        else:
            raise ValueError(f"Unknown algorithm: {self.algorithm}")

        # Update global model
        self.global_model.load_state_dict(self.global_state)

        # Compute round metrics
        avg_loss = sum(u["metrics"]["loss"] for u in client_updates) / len(client_updates)
        avg_acc = sum(u["metrics"]["accuracy"] for u in client_updates) / len(client_updates)
        round_time = time.time() - round_start

        metrics = {
            "round": self.current_round,
            "algorithm": self.algorithm,
            "num_clients_participated": len(client_updates),
            "avg_client_loss": avg_loss,
            "avg_client_accuracy": avg_acc,
            "round_time_seconds": round_time,
            "client_metrics": [
                {
                    "client_id": u.get("client_id", i),
                    "loss": u["metrics"]["loss"],
                    "accuracy": u["metrics"]["accuracy"],
                    "num_samples": u["num_samples"],
                }
                for i, u in enumerate(client_updates)
            ],
        }

        self.round_metrics.append(metrics)

        logger.info(
            f"Round {self.current_round} [{self.algorithm.upper()}]: "
            f"avg_loss={avg_loss:.4f}, avg_acc={avg_acc:.4f}, "
            f"time={round_time:.1f}s"
        )

        return metrics

    def evaluate_global_model(
        self,
        eval_loader: torch.utils.data.DataLoader,
    ) -> Dict:
        """
        Evaluate the current global model on a held-out dataset.

        Args:
            eval_loader: DataLoader for the evaluation set.

        Returns:
            Dict with 'loss', 'accuracy', 'predictions', 'targets'.
        """
        self.global_model.eval()
        self.global_model.to(self.device)
        criterion = torch.nn.CrossEntropyLoss()

        total_loss = 0.0
        total_correct = 0
        total_samples = 0
        all_preds = []
        all_targets = []

        with torch.no_grad():
            for batch_x, batch_y in eval_loader:
                batch_x = batch_x.to(self.device)
                batch_y = batch_y.to(self.device)

                outputs = self.global_model(batch_x)
                loss = criterion(outputs, batch_y)

                total_loss += loss.item() * batch_x.size(0)
                _, preds = torch.max(outputs, 1)
                total_correct += (preds == batch_y).sum().item()
                total_samples += batch_x.size(0)

                all_preds.extend(preds.cpu().tolist())
                all_targets.extend(batch_y.cpu().tolist())

        avg_loss = total_loss / total_samples if total_samples > 0 else 0
        accuracy = total_correct / total_samples if total_samples > 0 else 0

        logger.info(
            f"Global model eval: loss={avg_loss:.4f}, accuracy={accuracy:.4f}, "
            f"samples={total_samples}"
        )

        return {
            "loss": avg_loss,
            "accuracy": accuracy,
            "predictions": all_preds,
            "targets": all_targets,
            "num_samples": total_samples,
        }

    def save_checkpoint(self, tag: Optional[str] = None):
        """Save model checkpoint and metrics."""
        CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

        if tag:
            path = CHECKPOINT_DIR / f"{tag}.pt"
        else:
            path = checkpoint_path(self.algorithm, self.current_round)

        checkpoint = {
            "round": self.current_round,
            "algorithm": self.algorithm,
            "model_state_dict": self.global_state,
            "num_clients": self.num_clients,
            "num_classes": len(self.class_names),
            "class_names": self.class_names,
        }

        if self.scaffold_state is not None:
            checkpoint["scaffold_global_control"] = self.scaffold_state.global_control
            checkpoint["scaffold_client_controls"] = self.scaffold_state.client_controls

        torch.save(checkpoint, path)
        logger.info(f"[ML CHECKPOINT] Saved: {path} (classes={self.class_names})")

    def save_final_model(self):
        """Save the final global model (with class info for inference)."""
        path = final_checkpoint_path(self.algorithm)
        CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

        payload = {
            "model_state_dict": self.global_state,
            "algorithm": self.algorithm,
            "round": self.current_round,
            "num_clients": self.num_clients,
            "num_classes": len(self.class_names),
            "class_names": self.class_names,
        }
        torch.save(payload, path)

        # Also save as the canonical "global_final.pt" (loaded by inference.py)
        canonical = CHECKPOINT_DIR / "global_final.pt"
        torch.save(payload, canonical)

        # Save human-readable class mapping JSON
        import json
        class_map = {name: i for i, name in enumerate(self.class_names)}
        class_map_path = CHECKPOINT_DIR / "class_to_index.json"
        with open(class_map_path, "w", encoding="utf-8") as f:
            json.dump(class_map, f, indent=2)

        logger.info(
            f"[ML CHECKPOINT] Final model saved: {path}\n"
            f"  canonical: {canonical}\n"
            f"  class map: {class_map_path}\n"
            f"  num_classes: {len(self.class_names)}\n"
            f"  class_names: {self.class_names}"
        )

    def save_metrics(self):
        """Save round metrics to JSON."""
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        metrics_path = LOG_DIR / f"{self.algorithm}_metrics.json"

        with open(metrics_path, "w", encoding="utf-8") as f:
            json.dump(self.round_metrics, f, indent=2)

        logger.info(f"Metrics saved: {metrics_path}")

    def load_checkpoint(self, path: Path):
        """Load a checkpoint and restore server state."""
        checkpoint = torch.load(path, map_location="cpu", weights_only=False)

        self.global_state = checkpoint["model_state_dict"]
        self.global_model.load_state_dict(self.global_state)
        self.current_round = checkpoint.get("round", 0)
        self.algorithm = checkpoint.get("algorithm", self.algorithm)

        if "scaffold_global_control" in checkpoint:
            self.scaffold_state = ScaffoldState(
                global_control=checkpoint["scaffold_global_control"],
                client_controls=checkpoint.get("scaffold_client_controls", {}),
            )

        logger.info(f"Loaded checkpoint from {path} (round {self.current_round})")
