"""
FloraVeda — Grad-CAM Visualization Generator
==============================================
Generates Grad-CAM overlays for sample images using the trained model.

Usage:
    python generate_gradcam.py [--model checkpoints/global_final.pt] [--num-samples 10]
"""

import argparse
import logging
import sys
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import PROCESSED_DATA_DIR, CHECKPOINT_DIR, LOG_DIR, ensure_dirs
from preprocessing.transforms import get_eval_transform
from preprocessing.validator import validate_image
from preprocessing.dataset import PlantDiseaseDataset
from models.efficientnet import create_model
from explainability.gradcam import generate_gradcam_overlay

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("generate_gradcam")


def main():
    parser = argparse.ArgumentParser(description="Generate Grad-CAM visualizations")
    parser.add_argument("--model", type=str, default=None)
    parser.add_argument("--num-samples", type=int, default=10)
    parser.add_argument("--data-dir", type=str, default=str(PROCESSED_DATA_DIR))
    parser.add_argument("--output-dir", type=str, default=str(LOG_DIR / "gradcam"))
    args = parser.parse_args()

    ensure_dirs()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Find model
    if args.model:
        model_path = Path(args.model)
    else:
        for name in ["global_final", "fedscaffold_final", "fedavg_final", "centralized_best"]:
            path = CHECKPOINT_DIR / f"{name}.pt"
            if path.exists():
                model_path = path
                break
        else:
            logger.error("No trained model found. Train a model first.")
            sys.exit(1)

    logger.info(f"Using model: {model_path}")

    # Load model
    checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
    num_classes = checkpoint.get("num_classes", 5)
    class_names = checkpoint.get("class_names", [f"Class_{i}" for i in range(num_classes)])

    model = create_model(
        num_classes=num_classes,
        freeze_base=False,
        pretrained=False,
        device=device,
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Load dataset
    dataset = PlantDiseaseDataset(
        args.data_dir, transform=None, validate=False
    )
    eval_transform = get_eval_transform()

    # Output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate Grad-CAMs for sample images
    num_samples = min(args.num_samples, len(dataset))
    step = max(1, len(dataset) // num_samples)
    indices = list(range(0, len(dataset), step))[:num_samples]

    logger.info(f"Generating {len(indices)} Grad-CAM visualizations...")

    for i, idx in enumerate(indices):
        img_path = dataset.samples[idx][0]
        true_label = dataset.samples[idx][1]
        true_class = class_names[true_label] if true_label < len(class_names) else f"Class_{true_label}"

        try:
            # Load and preprocess
            original_img = validate_image(img_path)
            input_tensor = eval_transform(original_img).unsqueeze(0)

            # Generate overlay
            overlay, heatmap, pred_class, confidence = generate_gradcam_overlay(
                model=model,
                input_tensor=input_tensor,
                original_image=original_img,
                alpha=0.4,
            )

            pred_name = class_names[pred_class] if pred_class < len(class_names) else f"Class_{pred_class}"
            correct = "✓" if pred_class == true_label else "✗"

            # Save
            overlay_path = output_dir / f"gradcam_{i:03d}_{pred_name}_{confidence:.0%}.png"
            overlay.save(overlay_path)

            heatmap_path = output_dir / f"heatmap_{i:03d}.png"
            heatmap.save(heatmap_path)

            logger.info(
                f"  [{i+1}/{len(indices)}] {correct} "
                f"True: {true_class} | Pred: {pred_name} ({confidence:.1%}) "
                f"→ {overlay_path.name}"
            )

        except Exception as e:
            logger.warning(f"  Skipped {img_path.name}: {e}")

    print(f"\n✅ Grad-CAM visualizations saved to: {output_dir}")


if __name__ == "__main__":
    main()
