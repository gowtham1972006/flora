"""
FloraVeda — Non-IID Client Data Partitioning
==============================================
Splits a dataset across N federated clients using Dirichlet distribution
to simulate realistic non-IID (heterogeneous) data distribution.

Each client ends up with a different class distribution, controlled by
the alpha parameter:
    - alpha → 0   : extremely non-IID (each client has mostly one class)
    - alpha → ∞   : IID (uniform distribution across clients)
    - alpha = 0.3 : moderately non-IID (realistic for federated setting)
"""

import logging
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


def partition_data_dirichlet(
    targets: List[int],
    num_clients: int,
    alpha: float,
    seed: int = 42,
    min_samples_per_client: int = 10,
) -> Dict[int, List[int]]:
    """
    Partition dataset indices into N clients using Dirichlet distribution.

    The Dirichlet distribution over classes determines what fraction of each
    class goes to each client. This produces heterogeneous (non-IID) splits.

    Args:
        targets: List of class labels for all samples (e.g., [0, 1, 2, 0, 1, ...]).
        num_clients: Number of federated clients (K).
        alpha: Dirichlet concentration parameter. Lower = more heterogeneous.
        seed: Random seed for reproducibility.
        min_samples_per_client: Minimum samples each client must receive.

    Returns:
        Dictionary mapping client_id → list of sample indices.
    """
    rng = np.random.default_rng(seed)
    targets_array = np.array(targets)
    num_classes = len(np.unique(targets_array))
    num_samples = len(targets_array)

    # Group sample indices by class
    class_indices: Dict[int, List[int]] = defaultdict(list)
    for idx, label in enumerate(targets_array):
        class_indices[int(label)].append(idx)

    # Initialize client partitions
    client_indices: Dict[int, List[int]] = {i: [] for i in range(num_clients)}

    # For each class, draw a Dirichlet distribution over clients
    for cls in range(num_classes):
        cls_idxs = np.array(class_indices[cls])
        rng.shuffle(cls_idxs)

        # Draw proportions for this class across clients
        proportions = rng.dirichlet(np.repeat(alpha, num_clients))

        # Convert proportions to actual counts
        # Use multinomial-like assignment to respect proportions
        proportions = proportions / proportions.sum()  # normalize (already done by dirichlet)
        counts = (proportions * len(cls_idxs)).astype(int)

        # Distribute remainder to the clients with largest fractional parts
        remainder = len(cls_idxs) - counts.sum()
        fractional = (proportions * len(cls_idxs)) - counts
        top_clients = np.argsort(fractional)[-remainder:] if remainder > 0 else []
        for c in top_clients:
            counts[c] += 1

        # Assign indices to clients
        start = 0
        for client_id in range(num_clients):
            end = start + counts[client_id]
            client_indices[client_id].extend(cls_idxs[start:end].tolist())
            start = end

    # Ensure minimum samples per client (redistribute from largest if needed)
    for client_id in range(num_clients):
        while len(client_indices[client_id]) < min_samples_per_client:
            # Find the client with the most samples
            largest = max(client_indices, key=lambda c: len(client_indices[c]))
            if len(client_indices[largest]) <= min_samples_per_client:
                break  # Can't redistribute further
            # Move one sample
            sample = client_indices[largest].pop()
            client_indices[client_id].append(sample)

    # Shuffle each client's indices
    for client_id in client_indices:
        rng.shuffle(client_indices[client_id])

    # Log distribution
    total_assigned = sum(len(v) for v in client_indices.values())
    logger.info(
        f"Partitioned {total_assigned}/{num_samples} samples across "
        f"{num_clients} clients (α={alpha})"
    )

    return client_indices


def compute_client_class_distribution(
    client_indices: Dict[int, List[int]],
    targets: List[int],
    class_names: Optional[List[str]] = None,
) -> Dict[int, Dict[str, int]]:
    """
    Compute the class distribution for each client.

    Returns:
        Dict[client_id, Dict[class_name, count]]
    """
    targets_array = np.array(targets)
    distributions = {}

    for client_id, indices in client_indices.items():
        if len(indices) == 0:
            distributions[client_id] = {}
            continue

        labels = targets_array[indices]
        unique, counts = np.unique(labels, return_counts=True)
        dist = {}
        for cls_idx, count in zip(unique, counts):
            name = class_names[cls_idx] if class_names else str(cls_idx)
            dist[name] = int(count)
        distributions[client_id] = dist

    return distributions


def log_partition_summary(
    client_indices: Dict[int, List[int]],
    targets: List[int],
    class_names: Optional[List[str]] = None,
) -> str:
    """
    Generate a human-readable summary of the client partition.
    Returns the summary string and also logs it.
    """
    distributions = compute_client_class_distribution(
        client_indices, targets, class_names
    )

    lines = ["=" * 60, "CLIENT DATA DISTRIBUTION (Non-IID)", "=" * 60]

    for client_id in sorted(distributions.keys()):
        dist = distributions[client_id]
        total = sum(dist.values())
        lines.append(f"\nClient {client_id} — {total} samples:")
        for cls_name, count in sorted(dist.items()):
            pct = (count / total * 100) if total > 0 else 0
            bar = "█" * int(pct / 2)
            lines.append(f"  {cls_name:20s}: {count:5d} ({pct:5.1f}%) {bar}")

    lines.append("\n" + "=" * 60)
    summary = "\n".join(lines)
    logger.info(summary)
    return summary


def save_partition(
    client_indices: Dict[int, List[int]],
    save_path: Path,
) -> None:
    """Save the partition mapping to a JSON file for reproducibility."""
    serializable = {str(k): v for k, v in client_indices.items()}
    save_path.parent.mkdir(parents=True, exist_ok=True)
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(serializable, f, indent=2)
    logger.info(f"Partition saved to {save_path}")


def load_partition(load_path: Path) -> Dict[int, List[int]]:
    """Load a previously saved partition mapping."""
    with open(load_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {int(k): v for k, v in data.items()}
