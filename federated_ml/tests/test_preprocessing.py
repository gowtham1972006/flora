"""
FloraVeda — Tests for Preprocessing Pipeline
==============================================
"""

import sys
import tempfile
from pathlib import Path

import torch
import numpy as np
from PIL import Image

# Add project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_image_validation():
    """Test that valid images pass and invalid ones are rejected."""
    from preprocessing.validator import validate_image, ImageValidationError

    # Create a valid test image
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        img = Image.new("RGB", (256, 256), color=(0, 128, 0))
        img.save(f, format="JPEG")
        valid_path = f.name

    # Should succeed
    result = validate_image(valid_path)
    assert result.mode == "RGB", f"Expected RGB, got {result.mode}"
    assert result.size[0] >= 64 and result.size[1] >= 64

    # Create a too-small image
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        img = Image.new("RGB", (32, 32), color=(255, 0, 0))
        img.save(f, format="JPEG")
        small_path = f.name

    try:
        validate_image(small_path)
        assert False, "Should have raised ImageValidationError for small image"
    except ImageValidationError:
        pass  # Expected

    print("✓ test_image_validation passed")


def test_rgba_conversion():
    """Test that RGBA images are converted to RGB."""
    from preprocessing.validator import validate_image

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        img = Image.new("RGBA", (256, 256), color=(0, 128, 0, 128))
        img.save(f, format="PNG")
        path = f.name

    result = validate_image(path)
    assert result.mode == "RGB", f"Expected RGB after conversion, got {result.mode}"
    print("✓ test_rgba_conversion passed")


def test_grayscale_conversion():
    """Test that grayscale images are converted to RGB."""
    from preprocessing.validator import validate_image

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        img = Image.new("L", (256, 256), color=128)
        img.save(f, format="PNG")
        path = f.name

    result = validate_image(path)
    assert result.mode == "RGB", f"Expected RGB after conversion, got {result.mode}"
    print("✓ test_grayscale_conversion passed")


def test_eval_transform_output_shape():
    """Test that eval transform produces correct tensor shape."""
    from preprocessing.transforms import get_eval_transform

    transform = get_eval_transform()
    img = Image.new("RGB", (800, 600), color=(0, 128, 0))
    tensor = transform(img)

    assert tensor.shape == (3, 224, 224), f"Expected (3, 224, 224), got {tensor.shape}"
    assert tensor.dtype == torch.float32
    print("✓ test_eval_transform_output_shape passed")


def test_train_transform_output_shape():
    """Test that train transform produces correct tensor shape."""
    from preprocessing.augmentation import get_train_transform

    transform = get_train_transform()
    img = Image.new("RGB", (800, 600), color=(0, 128, 0))
    tensor = transform(img)

    assert tensor.shape == (3, 224, 224), f"Expected (3, 224, 224), got {tensor.shape}"
    print("✓ test_train_transform_output_shape passed")


def test_preprocess_single_image():
    """Test single-image preprocessing for inference."""
    from preprocessing.transforms import preprocess_single_image

    img = Image.new("RGB", (640, 480), color=(0, 200, 100))
    tensor = preprocess_single_image(img)

    assert tensor.shape == (1, 3, 224, 224), f"Expected (1, 3, 224, 224), got {tensor.shape}"
    print("✓ test_preprocess_single_image passed")


def test_dataset_class():
    """Test PlantDiseaseDataset with a temporary directory."""
    from preprocessing.dataset import PlantDiseaseDataset

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create class directories with images
        for cls in ["Healthy", "Rust", "Chlorosis"]:
            cls_dir = Path(tmpdir) / cls
            cls_dir.mkdir()
            for i in range(5):
                img = Image.new("RGB", (256, 256), color=(i * 50, 100, 50))
                img.save(cls_dir / f"img_{i}.jpg")

        dataset = PlantDiseaseDataset(tmpdir, validate=False)

        assert dataset.num_classes == 3, f"Expected 3 classes, got {dataset.num_classes}"
        assert len(dataset) == 15, f"Expected 15 samples, got {len(dataset)}"
        assert len(dataset.classes) == 3

        # Test __getitem__
        tensor, label = dataset[0]
        assert tensor.shape[0] == 3  # RGB channels
        assert 0 <= label < 3

    print("✓ test_dataset_class passed")


if __name__ == "__main__":
    test_image_validation()
    test_rgba_conversion()
    test_grayscale_conversion()
    test_eval_transform_output_shape()
    test_train_transform_output_shape()
    test_preprocess_single_image()
    test_dataset_class()
    print("\n✅ All preprocessing tests passed!")
