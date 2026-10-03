"""
FloraVeda — PyTorch Dataset for Plant Disease Images
======================================================
Loads images from a class-organized directory structure:
    root/
        class_a/
            img1.jpg
            img2.jpg
        class_b/
            img3.jpg
            ...

Each client gets its own subset of indices via the `indices` parameter.
"""

import logging
from pathlib import Path
from typing import Optional, List, Tuple

from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader, Subset
from torchvision import transforms

from .validator import validate_image, ImageValidationError

logger = logging.getLogger(__name__)


class PlantDiseaseDataset(Dataset):
    """
    A PyTorch Dataset for plant disease classification.

    Directory structure expected:
        root_dir/
            Chlorosis/
                img001.jpg
                ...
            Rust/
                img002.jpg
                ...

    Each subdirectory name becomes a class label.
    """

    def __init__(
        self,
        root_dir: str | Path,
        transform: Optional[transforms.Compose] = None,
        validate: bool = True,
    ):
        """
        Args:
            root_dir: Path to the dataset root containing class subdirectories.
            transform: torchvision transforms to apply. If None, raw PIL images
                       are returned (converted to tensor).
            validate: If True, validate each image on first access (slower but safer).
        """
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.validate = validate

        # Discover classes from subdirectories
        self.classes = sorted([
            d.name for d in self.root_dir.iterdir()
            if d.is_dir() and not d.name.startswith(".")
        ])
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        self.num_classes = len(self.classes)

        # Build index of (image_path, class_index) tuples
        self.samples: List[Tuple[Path, int]] = []
        for cls_name in self.classes:
            cls_dir = self.root_dir / cls_name
            cls_idx = self.class_to_idx[cls_name]
            for img_path in sorted(cls_dir.rglob("*")):
                if img_path.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}:
                    self.samples.append((img_path, cls_idx))

        logger.info(
            f"PlantDiseaseDataset: {len(self.samples)} images, "
            f"{self.num_classes} classes from {self.root_dir}"
        )
        if self.num_classes == 0:
            logger.warning(f"No classes found in {self.root_dir}!")

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        img_path, label = self.samples[idx]

        try:
            if self.validate:
                img = validate_image(img_path)
            else:
                img = Image.open(img_path).convert("RGB")
        except (ImageValidationError, Exception) as e:
            logger.warning(f"Failed to load {img_path}: {e}. Returning black image.")
            img = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform:
            tensor = self.transform(img)
        else:
            tensor = transforms.ToTensor()(img)

        return tensor, label

    def get_targets(self) -> List[int]:
        """Return all labels for use in stratified splitting."""
        return [label for _, label in self.samples]

    def get_class_name(self, idx: int) -> str:
        """Return the class name for a given class index."""
        return self.classes[idx]


def create_dataloader(
    dataset: Dataset,
    indices: Optional[List[int]] = None,
    batch_size: int = 32,
    shuffle: bool = True,
    num_workers: int = 0,
) -> DataLoader:
    """
    Create a DataLoader, optionally restricted to specific indices.

    Args:
        dataset: The full dataset.
        indices: If provided, only these indices are loaded (for client subsets).
        batch_size: Batch size.
        shuffle: Whether to shuffle.
        num_workers: Number of worker processes.

    Returns:
        A PyTorch DataLoader.
    """
    if indices is not None:
        subset = Subset(dataset, indices)
    else:
        subset = dataset

    return DataLoader(
        subset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
        drop_last=False,
    )
