"""
FloraVeda — Federated Training (FedAvg / FedSCAFFOLD)
======================================================
Main script for running federated training with simulated clients.

Usage:
    python train_federated.py --algorithm fedavg
    python train_federated.py --algorithm fedscaffold
    python train_federated.py --algorithm fedscaffold --rounds 30 --local-epochs 5

Architecture:
    LOCAL MACHINE
        Federated Server
            ├── Client 1 (local data, local training)
            ├── Client 2 (local data, local training)
            ├── Client 3 (local data, local training)
            └── Client 4 (local data, local training)

    The server NEVER accesses client image directories.
    Clients send ONLY model weight updates + control variates.
"""

import argparse
import json
import logging
import sys
import math
import time
from pathlib import Path
from functools import partial

import torch
from torch.utils.data import Subset

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (
    PROCESSED_DATA_DIR, CLIENT_DATA_DIR, CHECKPOINT_DIR, LOG_DIR,
    NUM_CLIENTS, DIRICHLET_ALPHA, RANDOM_SEED,
    BATCH_SIZE, LOCAL_EPOCHS, FEDERATED_ROUNDS, LEARNING_RATE,
    LEARNING_RATE_FINETUNE, WEIGHT_DECAY, DROPOUT_RATE,
    FREEZE_BASE, PROGRESSIVE_UNFREEZE, UNFREEZE_AFTER_ROUND,
    CLIENT_PARTICIPATION_RATE,
    ensure_dirs,
)
from preprocessing.augmentation import get_train_transform
from preprocessing.transforms import get_eval_transform
from preprocessing.dataset import PlantDiseaseDataset, create_dataloader
from models.efficientnet import create_model
from clients.client import FederatedClient
from clients.client_data import load_partition
from federated.server import FederatedServer
from evaluation.plots import plot_training_curves

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("train_federated")


def main():
    parser = argparse.ArgumentParser(description="Federated training")
    parser.add_argument(
        "--algorithm", type=str, default="fedscaffold",
        choices=["fedavg", "fedscaffold"],
        help="Federated algorithm (default: fedscaffold)",
    )
    parser.add_argument("--rounds", type=int, default=FEDERATED_ROUNDS)
    parser.add_argument("--local-epochs", type=int, default=LOCAL_EPOCHS)
    parser.add_argument("--lr", type=float, default=LEARNING_RATE)
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--num-clients", type=int, default=NUM_CLIENTS)
    parser.add_argument("--participation", type=float, default=CLIENT_PARTICIPATION_RATE)
    parser.add_argument("--data-dir", type=str, default=str(PROCESSED_DATA_DIR))
    parser.add_argument("--checkpoint-every", type=int, default=5)
    args = parser.parse_args()

    ensure_dirs()
    torch.manual_seed(RANDOM_SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")
    logger.info(f"Algorithm: {args.algorithm.upper()}")

    # ── Load dataset ──────────────────────────────────────────────────────────
    train_dataset = PlantDiseaseDataset(
        args.data_dir, transform=get_train_transform(), validate=False
    )
    eval_dataset = PlantDiseaseDataset(
        args.data_dir, transform=get_eval_transform(), validate=False
    )

    num_classes = train_dataset.num_classes
    class_names = train_dataset.classes
    logger.info(f"Classes ({num_classes}): {class_names}")

    # ── Load client partition ──────────────────────────────────────────────────
    partition_path = CLIENT_DATA_DIR / "partition.json"
    if not partition_path.exists():
        logger.error(f"No partition found at {partition_path}")
        logger.info("Run 'python create_clients.py' first.")
        sys.exit(1)

    client_indices = load_partition(partition_path)
    logger.info(f"Loaded partition: {len(client_indices)} clients")

    # ── Create validation set (global, not per-client) ─────────────────────────
    # Use indices not assigned to any client for validation
    all_client_idxs = set()
    for idxs in client_indices.values():
        all_client_idxs.update(idxs)
    val_indices = [i for i in range(len(eval_dataset)) if i not in all_client_idxs]

    # If all indices are assigned, use a small sample from each client
    if len(val_indices) < 10:
        logger.warning("No separate validation indices. Using 10% from each client.")
        val_indices = []
        for cid, idxs in client_indices.items():
            n_val = max(1, len(idxs) // 10)
            val_indices.extend(idxs[-n_val:])
            client_indices[cid] = idxs[:-n_val]

    val_loader = create_dataloader(
        eval_dataset, indices=val_indices,
        batch_size=args.batch_size, shuffle=False,
    )
    logger.info(f"Validation set: {len(val_indices)} samples")

    # ── Model factory ──────────────────────────────────────────────────────────
    def model_fn():
        return create_model(
            num_classes=num_classes,
            dropout_rate=DROPOUT_RATE,
            freeze_base=FREEZE_BASE,
            device=torch.device("cpu"),  # clients train on their device
        )

    # ── Create federated server ────────────────────────────────────────────────
    server = FederatedServer(
        model_fn=model_fn,
        num_clients=args.num_clients,
        algorithm=args.algorithm,
        device=device,
    )

    # ── Create client dataloaders ──────────────────────────────────────────────
    client_loaders = {}
    for cid in range(args.num_clients):
        idxs = client_indices.get(cid, client_indices.get(str(cid), []))
        loader = create_dataloader(
            train_dataset, indices=idxs,
            batch_size=args.batch_size, shuffle=True,
        )
        client_loaders[cid] = loader
        logger.info(f"Client {cid}: {len(idxs)} samples")

    # Save initial checkpoint
    server.save_checkpoint(tag=f"{args.algorithm}_initial")

    # ── Federated training loop ────────────────────────────────────────────────
    total_start = time.time()
    current_lr = args.lr

    for round_num in range(1, args.rounds + 1):
        round_start = time.time()
        logger.info(f"\n{'='*60}")
        logger.info(f"ROUND {round_num}/{args.rounds} [{args.algorithm.upper()}]")
        logger.info(f"{'='*60}")

        # Progressive unfreezing
        if PROGRESSIVE_UNFREEZE and round_num == UNFREEZE_AFTER_ROUND:
            logger.info("🔓 Progressive unfreeze activated!")
            current_lr = LEARNING_RATE_FINETUNE

        # Select participating clients
        num_participate = max(1, int(args.num_clients * args.participation))
        if num_participate < args.num_clients:
            rng = torch.Generator().manual_seed(RANDOM_SEED + round_num)
            selected = torch.randperm(args.num_clients, generator=rng)[:num_participate].tolist()
        else:
            selected = list(range(args.num_clients))

        # ── Local training on each selected client ─────────────────────────
        client_updates = []
        for cid in selected:
            logger.info(f"  Training Client {cid}...")
            client = FederatedClient(
                client_id=cid,
                dataloader=client_loaders[cid],
                device=device,
            )

            # Get SCAFFOLD correction if applicable
            correction = server.get_scaffold_correction(cid)

            # Get current global model state
            global_state = server.get_global_state()

            # Handle progressive unfreezing for clients
            def client_model_fn():
                m = model_fn()
                if PROGRESSIVE_UNFREEZE and round_num >= UNFREEZE_AFTER_ROUND:
                    m.unfreeze_backbone(num_blocks_from_end=3)
                return m

            # Local training
            update = client.train_local(
                global_model_state=global_state,
                model_fn=client_model_fn,
                local_epochs=args.local_epochs,
                learning_rate=current_lr,
                weight_decay=WEIGHT_DECAY,
                scaffold_correction=correction,
            )

            # Add client metadata
            update["client_id"] = cid
            # Compute number of local steps for SCAFFOLD
            num_batches = len(client_loaders[cid])
            update["num_local_steps"] = args.local_epochs * num_batches

            client_updates.append(update)

        # ── Server aggregation ─────────────────────────────────────────────
        round_metrics = server.aggregate_round(client_updates, current_lr)

        # ── Evaluate global model ──────────────────────────────────────────
        eval_result = server.evaluate_global_model(val_loader)
        round_metrics["val_loss"] = eval_result["loss"]
        round_metrics["val_accuracy"] = eval_result["accuracy"]

        logger.info(
            f"  Global val: loss={eval_result['loss']:.4f}, "
            f"acc={eval_result['accuracy']:.4f}"
        )

        # ── Save checkpoint periodically ───────────────────────────────────
        if round_num % args.checkpoint_every == 0:
            server.save_checkpoint()

    # ── Save final model and metrics ──────────────────────────────────────────
    server.save_final_model()
    server.save_metrics()

    # Generate training curves
    plot_training_curves(server.round_metrics, args.algorithm, save_dir=LOG_DIR)

    total_time = time.time() - total_start

    print("\n" + "=" * 60)
    print(f"FEDERATED TRAINING COMPLETE — {args.algorithm.upper()}")
    print("=" * 60)
    print(f"  Rounds:          {args.rounds}")
    print(f"  Clients:         {args.num_clients}")
    print(f"  Local epochs:    {args.local_epochs}")
    print(f"  Total time:      {total_time:.1f}s")

    if server.round_metrics:
        final = server.round_metrics[-1]
        print(f"  Final avg loss:  {final['avg_client_loss']:.4f}")
        print(f"  Final avg acc:   {final['avg_client_accuracy']:.4f}")
        if "val_accuracy" in final:
            print(f"  Final val acc:   {final['val_accuracy']:.4f}")

    print(f"\n  Model: {CHECKPOINT_DIR / f'{args.algorithm}_final.pt'}")
    print(f"  Metrics: {LOG_DIR / f'{args.algorithm}_metrics.json'}")
    print(f"  Curves: {LOG_DIR / f'{args.algorithm}_training_curves.png'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
