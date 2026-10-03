"""
FloraVeda — Generate a Synthetic Demo Dataset
===============================================
Creates a small fake dataset with colored leaf-like images
so you can test the entire federated pipeline without downloading
PlantVillage (~3 GB).

Replace this with real images later for actual training.

Usage:
    python generate_demo_dataset.py
"""

import sys
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import RAW_DATA_DIR, ensure_dirs

# Disease classes matching the FloraVeda app
CLASSES = {
    "Chlorosis": {
        "base_color": (60, 140, 40),    # green base
        "spot_color": (200, 200, 60),    # yellow spots (nutrient deficiency)
        "num_images": 40,
    },
    "Wilting": {
        "base_color": (80, 120, 50),     # muted green
        "spot_color": (100, 80, 40),     # brown droopy patches
        "num_images": 40,
    },
    "Rust": {
        "base_color": (50, 130, 35),     # green base
        "spot_color": (180, 100, 30),    # orange-brown rust pustules
        "num_images": 40,
    },
    "Powdery_Mildew": {
        "base_color": (55, 135, 45),     # green base
        "spot_color": (220, 220, 220),   # white-grey powdery coating
        "num_images": 40,
    },
    "Healthy": {
        "base_color": (40, 160, 50),     # vibrant green
        "spot_color": (50, 170, 60),     # slightly different green (no disease)
        "num_images": 40,
    },
}

IMAGES_PER_CLASS = 40  # 40 images x 5 classes = 200 total (small but enough to demo)


def generate_leaf_image(
    size: int = 256,
    base_color: tuple = (50, 140, 40),
    spot_color: tuple = (200, 200, 60),
    num_spots: int = 8,
    seed: int = 0,
) -> Image.Image:
    """Generate a synthetic leaf-like image with disease spots."""
    rng = random.Random(seed)

    # Create base leaf
    img = Image.new("RGB", (size, size), (240, 240, 230))  # light background
    draw = ImageDraw.Draw(img)

    # Draw leaf shape (ellipse)
    cx, cy = size // 2, size // 2
    leaf_w = int(size * 0.7 + rng.randint(-20, 20))
    leaf_h = int(size * 0.5 + rng.randint(-15, 15))

    leaf_box = (cx - leaf_w // 2, cy - leaf_h // 2, cx + leaf_w // 2, cy + leaf_h // 2)
    draw.ellipse(leaf_box, fill=base_color, outline=(30, 90, 20))

    # Draw central vein
    draw.line([(cx - leaf_w // 2 + 10, cy), (cx + leaf_w // 2 - 10, cy)],
              fill=(30, 100, 25), width=2)

    # Draw disease spots
    for _ in range(num_spots):
        sx = rng.randint(cx - leaf_w // 3, cx + leaf_w // 3)
        sy = rng.randint(cy - leaf_h // 3, cy + leaf_h // 3)
        sr = rng.randint(5, 20)

        # Vary spot color slightly
        sc = tuple(max(0, min(255, c + rng.randint(-20, 20))) for c in spot_color)
        draw.ellipse((sx - sr, sy - sr, sx + sr, sy + sr), fill=sc)

    # Slight blur for realism
    img = img.filter(ImageFilter.GaussianBlur(radius=1))

    return img


def main():
    ensure_dirs()

    print("=" * 60)
    print("GENERATING SYNTHETIC DEMO DATASET")
    print("=" * 60)
    print()
    print("This creates fake leaf images for testing the pipeline.")
    print("Replace with real images (e.g., PlantVillage) for actual training.")
    print()

    total = 0

    for class_name, config in CLASSES.items():
        class_dir = RAW_DATA_DIR / class_name
        class_dir.mkdir(parents=True, exist_ok=True)

        n = config["num_images"]
        base = config["base_color"]
        spots = config["spot_color"]

        # Healthy has fewer spots
        max_spots = 2 if class_name == "Healthy" else 12

        for i in range(n):
            num_spots = random.randint(0, max_spots) if class_name == "Healthy" else random.randint(4, max_spots)
            img = generate_leaf_image(
                size=256,
                base_color=base,
                spot_color=spots,
                num_spots=num_spots,
                seed=hash(f"{class_name}_{i}") % (2**31),
            )
            img.save(class_dir / f"{class_name.lower()}_{i:03d}.jpg", "JPEG", quality=90)

        total += n
        print(f"  {class_name:20s}: {n} images -> {class_dir}")

    print()
    print(f"  Total: {total} images across {len(CLASSES)} classes")
    print(f"  Location: {RAW_DATA_DIR}")
    print()
    print("=" * 60)
    print("Done! Now run the pipeline:")
    print()
    print("  python prepare_data.py")
    print("  python create_clients.py")
    print("  python train_federated.py --algorithm fedscaffold --rounds 5")
    print("  python evaluate.py")
    print("  python generate_gradcam.py")
    print("  python inference.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
