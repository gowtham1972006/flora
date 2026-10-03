"""
FloraVeda — Evaluation Plots
==============================
Generate publication-quality plots for the final-year project report.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import LOG_DIR

logger = logging.getLogger(__name__)

# ── Style ────────────────────────────────────────────────────────────────────────
plt.rcParams.update({
    "figure.figsize": (10, 6),
    "figure.dpi": 150,
    "axes.grid": True,
    "grid.alpha": 0.3,
    "font.size": 11,
})

COLORS = {
    "fedavg": "#e74c3c",
    "fedscaffold": "#2ecc71",
    "centralized": "#3498db",
}


def plot_training_curves(
    metrics_list: List[Dict],
    algorithm: str,
    save_dir: Optional[Path] = None,
) -> Path:
    """
    Plot training loss and accuracy curves over federated rounds.

    Args:
        metrics_list: List of per-round metric dicts.
        algorithm: Algorithm name for title and filename.
        save_dir: Directory to save the plot.

    Returns:
        Path to the saved plot file.
    """
    save_dir = save_dir or LOG_DIR
    save_dir.mkdir(parents=True, exist_ok=True)

    rounds = [m["round"] for m in metrics_list]
    losses = [m["avg_client_loss"] for m in metrics_list]
    accs = [m["avg_client_accuracy"] for m in metrics_list]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    color = COLORS.get(algorithm.lower(), "#333333")

    # Loss
    ax1.plot(rounds, losses, color=color, linewidth=2, marker="o", markersize=4)
    ax1.set_xlabel("Federated Round")
    ax1.set_ylabel("Average Client Loss")
    ax1.set_title(f"{algorithm.upper()} — Training Loss")
    ax1.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))

    # Accuracy
    ax2.plot(rounds, accs, color=color, linewidth=2, marker="o", markersize=4)
    ax2.set_xlabel("Federated Round")
    ax2.set_ylabel("Average Client Accuracy")
    ax2.set_title(f"{algorithm.upper()} — Training Accuracy")
    ax2.set_ylim(0, 1.05)
    ax2.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))

    plt.tight_layout()
    path = save_dir / f"{algorithm}_training_curves.png"
    plt.savefig(path, bbox_inches="tight")
    plt.close()

    logger.info(f"Training curves saved: {path}")
    return path


def plot_comparison(
    results: Dict[str, List[Dict]],
    metric_key: str = "avg_client_accuracy",
    ylabel: str = "Accuracy",
    title: str = "FedAvg vs FedSCAFFOLD",
    save_dir: Optional[Path] = None,
) -> Path:
    """
    Plot comparison curves for multiple algorithms.

    Args:
        results: Dict mapping algorithm name → list of per-round metrics.
        metric_key: Which metric to plot.
        ylabel: Y-axis label.
        title: Plot title.
        save_dir: Save directory.

    Returns:
        Path to saved plot.
    """
    save_dir = save_dir or LOG_DIR
    save_dir.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(10, 6))

    for algo_name, metrics_list in results.items():
        rounds = [m["round"] for m in metrics_list]
        values = [m[metric_key] for m in metrics_list]
        color = COLORS.get(algo_name.lower(), "#333333")
        ax.plot(rounds, values, color=color, linewidth=2.5,
                marker="o", markersize=4, label=algo_name.upper())

    ax.set_xlabel("Federated Round")
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.legend(fontsize=12)
    ax.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))

    if "accuracy" in metric_key.lower():
        ax.set_ylim(0, 1.05)

    plt.tight_layout()
    path = save_dir / "comparison.png"
    plt.savefig(path, bbox_inches="tight")
    plt.close()

    logger.info(f"Comparison plot saved: {path}")
    return path


def plot_confusion_matrix(
    cm: List[List[int]],
    class_names: Optional[List[str]] = None,
    title: str = "Confusion Matrix",
    save_dir: Optional[Path] = None,
    filename: str = "confusion_matrix.png",
) -> Path:
    """
    Plot a confusion matrix heatmap.

    Args:
        cm: Confusion matrix as list of lists.
        class_names: Names for each class.
        title: Plot title.
        save_dir: Save directory.
        filename: Output filename.

    Returns:
        Path to saved plot.
    """
    save_dir = save_dir or LOG_DIR
    save_dir.mkdir(parents=True, exist_ok=True)

    cm_array = np.array(cm)
    n = cm_array.shape[0]

    fig, ax = plt.subplots(figsize=(max(8, n), max(6, n * 0.8)))
    im = ax.imshow(cm_array, interpolation="nearest", cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)

    if class_names:
        tick_labels = class_names
    else:
        tick_labels = [f"Class {i}" for i in range(n)]

    ax.set(
        xticks=np.arange(n),
        yticks=np.arange(n),
        xticklabels=tick_labels,
        yticklabels=tick_labels,
        ylabel="True Label",
        xlabel="Predicted Label",
        title=title,
    )
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

    # Annotate cells
    thresh = cm_array.max() / 2.0
    for i in range(n):
        for j in range(n):
            ax.text(j, i, format(cm_array[i, j], "d"),
                    ha="center", va="center",
                    color="white" if cm_array[i, j] > thresh else "black")

    plt.tight_layout()
    path = save_dir / filename
    plt.savefig(path, bbox_inches="tight")
    plt.close()

    logger.info(f"Confusion matrix saved: {path}")
    return path


def plot_client_distribution(
    distributions: Dict[int, Dict[str, int]],
    save_dir: Optional[Path] = None,
) -> Path:
    """
    Plot the class distribution across federated clients (stacked bar chart).

    Args:
        distributions: Dict[client_id, Dict[class_name, count]]
        save_dir: Save directory.

    Returns:
        Path to saved plot.
    """
    save_dir = save_dir or LOG_DIR
    save_dir.mkdir(parents=True, exist_ok=True)

    client_ids = sorted(distributions.keys())
    all_classes = sorted(set(
        cls for dist in distributions.values() for cls in dist
    ))

    fig, ax = plt.subplots(figsize=(max(8, len(client_ids) * 2), 6))

    x = np.arange(len(client_ids))
    width = 0.6
    bottom = np.zeros(len(client_ids))

    cmap = plt.cm.Set3
    colors = [cmap(i / max(len(all_classes) - 1, 1)) for i in range(len(all_classes))]

    for cls_idx, cls_name in enumerate(all_classes):
        values = [distributions[cid].get(cls_name, 0) for cid in client_ids]
        ax.bar(x, values, width, bottom=bottom, label=cls_name,
               color=colors[cls_idx], edgecolor="white", linewidth=0.5)
        bottom += np.array(values)

    ax.set_xlabel("Client ID")
    ax.set_ylabel("Number of Samples")
    ax.set_title("Non-IID Client Data Distribution (Dirichlet)")
    ax.set_xticks(x)
    ax.set_xticklabels([f"Client {cid}" for cid in client_ids])
    ax.legend(bbox_to_anchor=(1.05, 1), loc="upper left")

    plt.tight_layout()
    path = save_dir / "client_distribution.png"
    plt.savefig(path, bbox_inches="tight")
    plt.close()

    logger.info(f"Client distribution plot saved: {path}")
    return path
