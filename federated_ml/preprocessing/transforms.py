"""
FloraVeda — Deterministic Image Transforms
============================================
Consistent preprocessing applied to ALL images (train, val, test).
No randomness — augmentation is in augmentation.py.
"""

import numpy as np
from PIL import Image
import torch
from torchvision import transforms

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD


def _aspect_ratio_resize(img: Image.Image, target_size: int) -> Image.Image:
    """
    Resize while preserving aspect ratio, then center-crop to target_size.
    This avoids distortion from naive resizing.

    Strategy:
    1. Resize so the shorter edge == target_size
    2. Center-crop to (target_size, target_size)
    """
    w, h = img.size
    if w < h:
        new_w = target_size
        new_h = int(h * (target_size / w))
    else:
        new_h = target_size
        new_w = int(w * (target_size / h))

    img = img.resize((new_w, new_h), Image.LANCZOS)

    # Center crop
    left = (new_w - target_size) // 2
    top = (new_h - target_size) // 2
    img = img.crop((left, top, left + target_size, top + target_size))

    return img


def get_eval_transform() -> transforms.Compose:
    """
    Return the deterministic transform pipeline for validation/test images.
    No augmentation — consistent preprocessing only.

    Pipeline:
    1. Resize (shorter edge) + center crop → 224×224
    2. To tensor [0, 1]
    3. EfficientNetB0-compatible normalization (ImageNet stats)
    """
    return transforms.Compose([
        transforms.Resize(int(IMAGE_SIZE * 1.05), interpolation=transforms.InterpolationMode.LANCZOS),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def preprocess_single_image(img: Image.Image) -> torch.Tensor:
    """
    Preprocess a single PIL Image for inference.
    Returns a tensor of shape [1, 3, 224, 224] (batch dim included).
    """
    transform = get_eval_transform()
    tensor = transform(img)          # [3, 224, 224]
    return tensor.unsqueeze(0)       # [1, 3, 224, 224]


def denormalize_tensor(tensor: torch.Tensor) -> np.ndarray:
    """
    Reverse ImageNet normalization for visualization.
    Input: tensor [C, H, W] or [H, W, C]
    Output: numpy array [H, W, C] in [0, 255] uint8
    """
    if tensor.dim() == 3 and tensor.shape[0] == 3:
        # [C, H, W] → [H, W, C]
        tensor = tensor.permute(1, 2, 0)

    mean = torch.tensor(IMAGENET_MEAN)
    std = torch.tensor(IMAGENET_STD)
    img = tensor * std + mean
    img = torch.clamp(img, 0, 1)
    return (img.numpy() * 255).astype(np.uint8)
