"""
FloraVeda — Centralized Training Baseline
===========================================
Trains EfficientNetB0 on the entire dataset (no federation).
Used as a comparison baseline against FedAvg and FedSCAFFOLD.

Usage:
    python train_centralized.py [--epochs 20] [--lr 0.001]
"""

import argparse
import json
import logging
import sys
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (
    PROCESSED_DATA_DIR, CHECKPOINT_DIR, LOG_DIR,
    IMAGE_SIZE, BATCH_SIZE, LEARNING_RATE, WEIGHT_DECAY,
    DROPOUT_RATE, RANDOM_SEED, TRAIN_RATIO, VAL_RATIO,
    ensure_dirs,
)
from preprocessing.augmentation import get_train_transform
from preprocessing.transforms import get_eval_transform
from preprocessing.dataset import PlantDiseaseDataset
from models.efficientnet import create_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("train_centralized")


def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss, correct, total = 0, 0, 0

    for batch_x, batch_y in loader:
        batch_x, batch_y = batch_x.to(device), batch_y.to(device)
        optimizer.zero_grad()
        outputs = model(batch_x)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()

        total_loss += loss.item() * batch_x.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == batch_y).sum().item()
        total += batch_x.size(0)

    return total_loss / total, correct / total


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0, 0, 0

    with torch.no_grad():
        for batch_x, batch_y in loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            total_loss += loss.item() * batch_x.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == batch_y).sum().item()
            total += batch_x.size(0)

    return total_loss / total, correct / total


def main():
    parser = argparse.ArgumentParser(description="Centralized training baseline")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--lr", type=float, default=LEARNING_RATE)
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--data-dir", type=str, default=str(PROCESSED_DATA_DIR))
    args = parser.parse_args()

    ensure_dirs()
    torch.manual_seed(RANDOM_SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")

    # Load dataset
    train_dataset = PlantDiseaseDataset(
        args.data_dir, transform=get_train_transform(), validate=False
    )
    eval_dataset = PlantDiseaseDataset(
        args.data_dir, transform=get_eval_transform(), validate=False
    )

    num_classes = train_dataset.num_classes
    logger.info(f"Classes: {num_classes} — {train_dataset.classes}")

    # Split
    n = len(train_dataset)
    n_train = int(n * TRAIN_RATIO)
    n_val = int(n * VAL_RATIO)
    n_test = n - n_train - n_val

    generator = torch.Generator().manual_seed(RANDOM_SEED)
    train_idx, val_idx, test_idx = random_split(
        range(n), [n_train, n_val, n_test], generator=generator
    )

    train_loader = DataLoader(
        torch.utils.data.Subset(train_dataset, train_idx),
        batch_size=args.batch_size, shuffle=True, num_workers=0,
    )
    val_loader = DataLoader(
        torch.utils.data.Subset(eval_dataset, val_idx),
        batch_size=args.batch_size, shuffle=False, num_workers=0,
    )

    # Create model
    model = create_model(
        num_classes=num_classes,
        dropout_rate=DROPOUT_RATE,
        freeze_base=True,
        device=device,
    )

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr, weight_decay=WEIGHT_DECAY,
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", patience=3, factor=0.5,
    )

    # Training loop
    history = []
    best_val_acc = 0

    for epoch in range(1, args.epochs + 1):
        start = time.time()
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device
        )
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - start

        scheduler.step(val_loss)

        history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "train_accuracy": train_acc,
            "val_loss": val_loss,
            "val_accuracy": val_acc,
            "time": elapsed,
        })

        logger.info(
            f"Epoch {epoch}/{args.epochs}: "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} | "
            f"time={elapsed:.1f}s"
        )

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
            torch.save({
                "model_state_dict": model.state_dict(),
                "epoch": epoch,
                "val_accuracy": val_acc,
                "num_classes": num_classes,
                "class_names": train_dataset.classes,
            }, CHECKPOINT_DIR / "centralized_best.pt")
            logger.info(f"  ✓ New best model saved (val_acc={val_acc:.4f})")

    # Save final model
    torch.save({
        "model_state_dict": model.state_dict(),
        "epoch": args.epochs,
        "num_classes": num_classes,
        "class_names": train_dataset.classes,
    }, CHECKPOINT_DIR / "centralized_final.pt")

    # Save history
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_DIR / "centralized_history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    print("\n" + "=" * 60)
    print("CENTRALIZED TRAINING COMPLETE")
    print("=" * 60)
    print(f"  Best val accuracy: {best_val_acc:.4f}")
    print(f"  Model saved: {CHECKPOINT_DIR / 'centralized_best.pt'}")
    print(f"  History: {LOG_DIR / 'centralized_history.json'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
