"""
FloraVeda — Training Augmentation
===================================
Realistic augmentations applied ONLY to training data.
Validation and test sets use deterministic transforms only.

Design principle: augment without destroying disease-specific visual cues
(lesion color, spot patterns, vein discoloration, texture).
"""

from torchvision import transforms

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import (
    IMAGE_SIZE,
    IMAGENET_MEAN,
    IMAGENET_STD,
    AUG_ROTATION_DEGREES,
    AUG_HORIZONTAL_FLIP_PROB,
    AUG_BRIGHTNESS_RANGE,
    AUG_CONTRAST_RANGE,
    AUG_SATURATION_RANGE,
    AUG_TRANSLATE_FRACTION,
)


def get_train_transform() -> transforms.Compose:
    """
    Return the augmented transform pipeline for training images.

    Pipeline:
    1. Resize (shorter edge) + random resized crop → 224×224
    2. Random horizontal flip (disease patterns are flip-invariant)
    3. Small rotation (±15°)
    4. Color jitter (brightness, contrast, saturation — conservative)
    5. Small affine translation
    6. To tensor [0, 1]
    7. EfficientNetB0-compatible normalization (ImageNet stats)

    Deliberately excluded:
    - Vertical flip (unnatural for plant photos)
    - Extreme color shifts (would alter disease appearance)
    - Cutout/Erasing (could mask the disease region)
    - Gaussian blur (could hide disease texture)
    """
    return transforms.Compose([
        # Random resized crop provides zoom variation (scale 0.8–1.0)
        transforms.RandomResizedCrop(
            IMAGE_SIZE,
            scale=(0.8, 1.0),
            ratio=(0.9, 1.1),
            interpolation=transforms.InterpolationMode.LANCZOS,
        ),
        # Horizontal flip — safe for disease detection
        transforms.RandomHorizontalFlip(p=AUG_HORIZONTAL_FLIP_PROB),
        # Small rotation
        transforms.RandomRotation(
            degrees=AUG_ROTATION_DEGREES,
            interpolation=transforms.InterpolationMode.BILINEAR,
            fill=0,
        ),
        # Conservative color jitter — preserves disease colors
        transforms.ColorJitter(
            brightness=AUG_BRIGHTNESS_RANGE,
            contrast=AUG_CONTRAST_RANGE,
            saturation=AUG_SATURATION_RANGE,
            hue=0,  # No hue shift — critical for disease color accuracy
        ),
        # Small random affine translation
        transforms.RandomAffine(
            degrees=0,  # rotation already handled above
            translate=(AUG_TRANSLATE_FRACTION, AUG_TRANSLATE_FRACTION),
        ),
        # To tensor + normalize
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
