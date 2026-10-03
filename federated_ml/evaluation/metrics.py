"""
FloraVeda — Evaluation Metrics
================================
Compute classification metrics for trained models.
"""

import logging
from typing import Dict, List, Optional

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

logger = logging.getLogger(__name__)


def compute_metrics(
    y_true: List[int],
    y_pred: List[int],
    class_names: Optional[List[str]] = None,
    average: str = "weighted",
) -> Dict:
    """
    Compute comprehensive classification metrics.

    Args:
        y_true: Ground truth labels.
        y_pred: Predicted labels.
        class_names: Optional list of class names for the report.
        average: Averaging method for precision/recall/F1 ('weighted', 'macro', 'micro').

    Returns:
        Dictionary with all metrics.
    """
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average=average, zero_division=0)
    recall = recall_score(y_true, y_pred, average=average, zero_division=0)
    f1 = f1_score(y_true, y_pred, average=average, zero_division=0)
    cm = confusion_matrix(y_true, y_pred)

    report = classification_report(
        y_true, y_pred,
        target_names=class_names,
        zero_division=0,
        output_dict=True,
    )

    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "confusion_matrix": cm.tolist(),
        "classification_report": report,
    }

    logger.info(
        f"Metrics: accuracy={accuracy:.4f}, precision={precision:.4f}, "
        f"recall={recall:.4f}, f1={f1:.4f}"
    )

    return metrics


def per_class_metrics(
    y_true: List[int],
    y_pred: List[int],
    class_names: Optional[List[str]] = None,
) -> List[Dict]:
    """
    Compute per-class precision, recall, and F1.

    Returns:
        List of dicts, one per class.
    """
    precision_per = precision_score(y_true, y_pred, average=None, zero_division=0)
    recall_per = recall_score(y_true, y_pred, average=None, zero_division=0)
    f1_per = f1_score(y_true, y_pred, average=None, zero_division=0)

    num_classes = len(precision_per)
    results = []

    for i in range(num_classes):
        name = class_names[i] if class_names and i < len(class_names) else f"Class {i}"
        support = sum(1 for y in y_true if y == i)
        results.append({
            "class_name": name,
            "class_index": i,
            "precision": float(precision_per[i]),
            "recall": float(recall_per[i]),
            "f1_score": float(f1_per[i]),
            "support": support,
        })

    return results


def format_metrics_table(metrics: Dict, class_names: Optional[List[str]] = None) -> str:
    """Format metrics as a readable text table."""
    lines = [
        "=" * 60,
        "EVALUATION RESULTS",
        "=" * 60,
        f"  Accuracy:   {metrics['accuracy']:.4f}",
        f"  Precision:  {metrics['precision']:.4f} (weighted)",
        f"  Recall:     {metrics['recall']:.4f} (weighted)",
        f"  F1-Score:   {metrics['f1_score']:.4f} (weighted)",
        "",
        "Confusion Matrix:",
    ]

    cm = np.array(metrics["confusion_matrix"])
    n = cm.shape[0]

    # Header
    if class_names:
        header = "        " + "  ".join(f"{c[:8]:>8s}" for c in class_names)
    else:
        header = "        " + "  ".join(f"{'C' + str(i):>8s}" for i in range(n))
    lines.append(header)

    # Rows
    for i in range(n):
        row_name = class_names[i][:8] if class_names else f"C{i}"
        row_vals = "  ".join(f"{cm[i, j]:>8d}" for j in range(n))
        lines.append(f"  {row_name:>6s}  {row_vals}")

    lines.append("=" * 60)
    return "\n".join(lines)
