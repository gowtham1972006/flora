"""
FloraVeda — Create Federated Client Partitions
================================================
Splits the processed dataset into N non-IID client partitions
using Dirichlet distribution.

Usage:
    python create_clients.py [--num-clients 4] [--alpha 0.3]
"""

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (
    PROCESSED_DATA_DIR, CLIENT_DATA_DIR, LOG_DIR,
    NUM_CLIENTS, DIRICHLET_ALPHA, RANDOM_SEED,
    ensure_dirs,
)
from preprocessing.dataset import PlantDiseaseDataset
from clients.client_data import (
    partition_data_dirichlet,
    compute_client_class_distribution,
    log_partition_summary,
    save_partition,
)
from evaluation.plots import plot_client_distribution

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("create_clients")


def main():
    parser = argparse.ArgumentParser(description="Create non-IID client partitions")
    parser.add_argument("--num-clients", type=int, default=NUM_CLIENTS)
    parser.add_argument("--alpha", type=float, default=DIRICHLET_ALPHA)
    parser.add_argument("--seed", type=int, default=RANDOM_SEED)
    parser.add_argument("--data-dir", type=str, default=str(PROCESSED_DATA_DIR))
    args = parser.parse_args()

    ensure_dirs()

    data_dir = Path(args.data_dir)
    if not data_dir.exists() or not any(data_dir.iterdir()):
        logger.error(f"No processed data found at {data_dir}")
        logger.info("Run 'python prepare_data.py' first.")
        sys.exit(1)

    # Load dataset (just to get labels — no transforms needed here)
    dataset = PlantDiseaseDataset(data_dir, transform=None, validate=False)

    if dataset.num_classes == 0:
        logger.error("No classes found in the dataset!")
        sys.exit(1)

    logger.info(
        f"Dataset: {len(dataset)} samples, {dataset.num_classes} classes"
    )

    # Partition using Dirichlet
    targets = dataset.get_targets()
    client_indices = partition_data_dirichlet(
        targets=targets,
        num_clients=args.num_clients,
        alpha=args.alpha,
        seed=args.seed,
    )

    # Log summary
    summary = log_partition_summary(
        client_indices, targets, dataset.classes
    )

    # Save partition
    partition_path = CLIENT_DATA_DIR / "partition.json"
    save_partition(client_indices, partition_path)

    # Compute distributions for plotting
    distributions = compute_client_class_distribution(
        client_indices, targets, dataset.classes
    )

    # Save distribution plot
    plot_client_distribution(distributions, save_dir=LOG_DIR)

    # Save summary text
    summary_path = LOG_DIR / "partition_summary.txt"
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(summary)
    logger.info(f"Summary saved: {summary_path}")

    print(f"\n✅ Created {args.num_clients} client partitions (α={args.alpha})")
    print(f"   Partition file: {partition_path}")
    print(f"   Distribution plot: {LOG_DIR / 'client_distribution.png'}")
    print(f"   Summary: {summary_path}")


if __name__ == "__main__":
    main()
