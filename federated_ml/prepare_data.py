"""
FloraVeda — Dataset Preparation Script
========================================
Downloads, validates, and organizes the plant disease dataset.

Usage:
    python prepare_data.py [--source PATH_TO_IMAGES]

Expected input structure (e.g., PlantVillage):
    raw/
        Apple___Apple_scab/
            img001.jpg
            ...
        Apple___healthy/
            img002.jpg
            ...
        Tomato___Late_blight/
            ...

Output structure:
    processed/
        Apple_Apple_scab/
            img001.jpg
        Apple_healthy/
            img002.jpg
        ...
"""

import argparse
import logging
import shutil
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import RAW_DATA_DIR, PROCESSED_DATA_DIR, ensure_dirs
from preprocessing.validator import validate_image, ImageValidationError, SUPPORTED_EXTENSIONS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("prepare_data")


def clean_class_name(name: str) -> str:
    """Normalize class directory names (remove triple underscores, etc.)."""
    return name.replace("___", "_").replace("__", "_").strip("_")


def prepare_dataset(source_dir: Path, output_dir: Path) -> dict:
    """
    Validate and copy images from source to processed directory.

    Only valid images that pass all checks are copied.
    Invalid images are logged but skipped.

    Returns:
        Summary dict with counts.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    stats = {
        "total_found": 0,
        "valid": 0,
        "invalid": 0,
        "classes": {},
    }

    # Discover class directories
    class_dirs = sorted([
        d for d in source_dir.iterdir()
        if d.is_dir() and not d.name.startswith(".")
    ])

    if not class_dirs:
        logger.error(f"No class directories found in {source_dir}")
        logger.info(
            "Expected structure:\n"
            "  raw/\n"
            "    ClassName1/\n"
            "      img001.jpg\n"
            "    ClassName2/\n"
            "      img002.jpg\n"
            "\n"
            "You can download the PlantVillage dataset from:\n"
            "  https://www.kaggle.com/datasets/emmarex/plantdisease\n"
            "  or https://github.com/spMohanty/PlantVillage-Dataset\n"
            "\n"
            "Extract into: federated_ml/data/raw/"
        )
        return stats

    for class_dir in class_dirs:
        clean_name = clean_class_name(class_dir.name)
        out_class_dir = output_dir / clean_name
        out_class_dir.mkdir(parents=True, exist_ok=True)

        class_valid = 0
        class_invalid = 0

        for img_path in sorted(class_dir.rglob("*")):
            if img_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                continue

            stats["total_found"] += 1

            try:
                # Validate the image
                validate_image(img_path)

                # Copy to processed directory
                dest = out_class_dir / img_path.name
                if not dest.exists():
                    shutil.copy2(img_path, dest)

                class_valid += 1
                stats["valid"] += 1

            except ImageValidationError as e:
                class_invalid += 1
                stats["invalid"] += 1
                logger.debug(f"Skipped: {e}")

        stats["classes"][clean_name] = {
            "valid": class_valid,
            "invalid": class_invalid,
        }

        logger.info(
            f"  {clean_name}: {class_valid} valid, {class_invalid} invalid"
        )

    return stats


def main():
    parser = argparse.ArgumentParser(description="Prepare plant disease dataset")
    parser.add_argument(
        "--source",
        type=str,
        default=str(RAW_DATA_DIR),
        help=f"Path to raw images (default: {RAW_DATA_DIR})",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(PROCESSED_DATA_DIR),
        help=f"Output path for processed images (default: {PROCESSED_DATA_DIR})",
    )
    args = parser.parse_args()

    ensure_dirs()

    source = Path(args.source)
    output = Path(args.output)

    logger.info(f"Source: {source}")
    logger.info(f"Output: {output}")

    if not source.exists():
        logger.error(f"Source directory does not exist: {source}")
        logger.info(
            f"Please place your dataset in: {RAW_DATA_DIR}\n"
            f"Expected structure: raw/ClassName/image.jpg"
        )
        sys.exit(1)

    stats = prepare_dataset(source, output)

    print("\n" + "=" * 60)
    print("DATASET PREPARATION SUMMARY")
    print("=" * 60)
    print(f"  Total images found:  {stats['total_found']}")
    print(f"  Valid (copied):      {stats['valid']}")
    print(f"  Invalid (skipped):   {stats['invalid']}")
    print(f"  Classes:             {len(stats['classes'])}")
    print()

    for cls_name, cls_stats in sorted(stats["classes"].items()):
        print(f"    {cls_name}: {cls_stats['valid']} images")

    print("=" * 60)

    if stats["valid"] == 0:
        print("\n⚠️  No valid images found! Check your dataset structure.")
        sys.exit(1)

    print(f"\n✅ Processed dataset ready at: {output}")


if __name__ == "__main__":
    main()
