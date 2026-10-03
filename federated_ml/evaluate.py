"""
FloraVeda — Global Model Evaluation
=====================================
Evaluates a trained global model on the test set.
Generates metrics, confusion matrix, and comparison plots.

Usage:
    python evaluate.py [--model checkpoints/fedscaffold_final.pt]
"""

import argparse
import json
import logging
import sys
from pathlib import Path

import torch
from torch.utils.data import random_split

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (
    PROCESSED_DATA_DIR, CHECKPOINT_DIR, LOG_DIR,
    BATCH_SIZE, RANDOM_SEED, TRAIN_RATIO, VAL_RATIO,
    ensure_dirs,
)
from preprocessing.transforms import get_eval_transform
from preprocessing.dataset import PlantDiseaseDataset, create_dataloader
from models.efficientnet import create_model
from evaluation.metrics import compute_metrics, per_class_metrics, format_metrics_table
from evaluation.plots import plot_confusion_matrix, plot_comparison

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("evaluate")


def evaluate_model(model_path: Path, dataset, test_indices, device, class_names):
    """Load a model checkpoint and evaluate on test data."""
    checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
    num_classes = checkpoint.get("num_classes", len(class_names))

    model = create_model(
        num_classes=num_classes,
        freeze_base=False,
        pretrained=False,
        device=device,
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    test_loader = create_dataloader(
        dataset, indices=test_indices,
        batch_size=BATCH_SIZE, shuffle=False,
    )

    all_preds = []
    all_targets = []

    with torch.no_grad():
        for batch_x, batch_y in test_loader:
            batch_x = batch_x.to(device)
            outputs = model(batch_x)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().tolist())
            all_targets.extend(batch_y.tolist())

    return all_targets, all_preds


def main():
    parser = argparse.ArgumentParser(description="Evaluate trained model")
    parser.add_argument(
        "--model", type=str, default=None,
        help="Path to model checkpoint (default: auto-detect)",
    )
    parser.add_argument("--data-dir", type=str, default=str(PROCESSED_DATA_DIR))
    parser.add_argument("--compare", action="store_true", help="Compare all available models")
    args = parser.parse_args()

    ensure_dirs()
    torch.manual_seed(RANDOM_SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load dataset
    dataset = PlantDiseaseDataset(
        args.data_dir, transform=get_eval_transform(), validate=False
    )
    class_names = dataset.classes
    num_classes = dataset.num_classes

    # Create test split (same seed as training to avoid data leakage)
    n = len(dataset)
    n_train = int(n * TRAIN_RATIO)
    n_val = int(n * VAL_RATIO)
    n_test = n - n_train - n_val

    generator = torch.Generator().manual_seed(RANDOM_SEED)
    _, _, test_subset = random_split(range(n), [n_train, n_val, n_test], generator=generator)
    test_indices = list(test_subset)

    logger.info(f"Test set: {len(test_indices)} samples, {num_classes} classes")

    if args.compare:
        # ── Compare all available models ───────────────────────────────────
        models_to_eval = {}
        for name in ["centralized_best", "centralized_final", "fedavg_final", "fedscaffold_final"]:
            path = CHECKPOINT_DIR / f"{name}.pt"
            if path.exists():
                models_to_eval[name] = path

        if not models_to_eval:
            logger.error("No trained models found in checkpoints/")
            sys.exit(1)

        all_results = {}
        for name, path in models_to_eval.items():
            logger.info(f"\nEvaluating: {name}")
            try:
                targets, preds = evaluate_model(
                    path, dataset, test_indices, device, class_names
                )
                metrics = compute_metrics(targets, preds, class_names)
                all_results[name] = metrics

                print(format_metrics_table(metrics, class_names))

                # Save confusion matrix
                plot_confusion_matrix(
                    metrics["confusion_matrix"],
                    class_names=class_names,
                    title=f"Confusion Matrix — {name}",
                    save_dir=LOG_DIR,
                    filename=f"confusion_matrix_{name}.png",
                )
            except Exception as e:
                logger.error(f"Failed to evaluate {name}: {e}")

        # Save comparison
        comparison = {
            name: {
                "accuracy": r["accuracy"],
                "precision": r["precision"],
                "recall": r["recall"],
                "f1_score": r["f1_score"],
            }
            for name, r in all_results.items()
        }
        with open(LOG_DIR / "comparison_results.json", "w", encoding="utf-8") as f:
            json.dump(comparison, f, indent=2)

        # Print comparison table
        print("\n" + "=" * 70)
        print("MODEL COMPARISON")
        print("=" * 70)
        print(f"  {'Model':<25s} {'Accuracy':>10s} {'Precision':>10s} {'Recall':>10s} {'F1':>10s}")
        print("-" * 70)
        for name, r in sorted(all_results.items()):
            print(
                f"  {name:<25s} "
                f"{r['accuracy']:>10.4f} "
                f"{r['precision']:>10.4f} "
                f"{r['recall']:>10.4f} "
                f"{r['f1_score']:>10.4f}"
            )
        print("=" * 70)

    else:
        # ── Evaluate single model ──────────────────────────────────────────
        if args.model:
            model_path = Path(args.model)
        else:
            # Auto-detect: prefer scaffold > fedavg > centralized
            for name in ["fedscaffold_final", "fedavg_final", "centralized_best", "global_final"]:
                path = CHECKPOINT_DIR / f"{name}.pt"
                if path.exists():
                    model_path = path
                    break
            else:
                logger.error("No trained model found. Train a model first.")
                sys.exit(1)

        logger.info(f"Evaluating: {model_path}")
        targets, preds = evaluate_model(
            model_path, dataset, test_indices, device, class_names
        )

        metrics = compute_metrics(targets, preds, class_names)
        per_cls = per_class_metrics(targets, preds, class_names)

        print(format_metrics_table(metrics, class_names))

        # Per-class details
        print("\nPER-CLASS METRICS:")
        print(f"  {'Class':<25s} {'Precision':>10s} {'Recall':>10s} {'F1':>10s} {'Support':>8s}")
        print("-" * 60)
        for c in per_cls:
            print(
                f"  {c['class_name']:<25s} "
                f"{c['precision']:>10.4f} "
                f"{c['recall']:>10.4f} "
                f"{c['f1_score']:>10.4f} "
                f"{c['support']:>8d}"
            )

        # Save results
        plot_confusion_matrix(
            metrics["confusion_matrix"],
            class_names=class_names,
            save_dir=LOG_DIR,
        )

        results_path = LOG_DIR / "evaluation_results.json"
        with open(results_path, "w", encoding="utf-8") as f:
            json.dump({
                "model": str(model_path),
                "metrics": metrics,
                "per_class": per_cls,
            }, f, indent=2)

        print(f"\n  Results saved: {results_path}")
        print(f"  Confusion matrix: {LOG_DIR / 'confusion_matrix.png'}")


if __name__ == "__main__":
    main()
