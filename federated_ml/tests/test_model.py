"""
FloraVeda — Tests for EfficientNetB0 Model
============================================
"""

import sys
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_model_creation():
    """Test that the model is created with correct output dimensions."""
    from models.efficientnet import create_model

    model = create_model(num_classes=5, freeze_base=True, pretrained=True,
                         device=torch.device("cpu"))

    assert isinstance(model, torch.nn.Module)

    # Check output shape
    dummy = torch.randn(2, 3, 224, 224)
    output = model(dummy)
    assert output.shape == (2, 5), f"Expected (2, 5), got {output.shape}"

    print("✓ test_model_creation passed")


def test_model_frozen_base():
    """Test that backbone is frozen when freeze_base=True."""
    from models.efficientnet import create_model

    model = create_model(num_classes=5, freeze_base=True, pretrained=True,
                         device=torch.device("cpu"))

    # Check that feature layers are frozen
    for param in model.backbone.features.parameters():
        assert not param.requires_grad, "Feature layers should be frozen"

    # Check that classifier is trainable
    for param in model.backbone.classifier.parameters():
        assert param.requires_grad, "Classifier should be trainable"

    print("✓ test_model_frozen_base passed")


def test_model_unfreeze():
    """Test progressive unfreezing."""
    from models.efficientnet import create_model

    model = create_model(num_classes=5, freeze_base=True, pretrained=True,
                         device=torch.device("cpu"))

    # Unfreeze last 3 blocks
    model.unfreeze_backbone(num_blocks_from_end=3)

    # At least some feature params should now be trainable
    trainable = sum(p.requires_grad for p in model.backbone.features.parameters())
    assert trainable > 0, "Some feature params should be trainable after unfreeze"

    print("✓ test_model_unfreeze passed")


def test_model_different_classes():
    """Test model with different numbers of classes."""
    from models.efficientnet import create_model

    for n_classes in [2, 5, 10, 38]:
        model = create_model(num_classes=n_classes, freeze_base=True, pretrained=False,
                             device=torch.device("cpu"))
        dummy = torch.randn(1, 3, 224, 224)
        output = model(dummy)
        assert output.shape == (1, n_classes), f"Expected (1, {n_classes}), got {output.shape}"

    print("✓ test_model_different_classes passed")


def test_predict_proba():
    """Test that predict_proba returns valid probabilities."""
    from models.efficientnet import create_model

    model = create_model(num_classes=5, freeze_base=True, pretrained=False,
                         device=torch.device("cpu"))
    model.eval()

    dummy = torch.randn(1, 3, 224, 224)
    probs = model.predict_proba(dummy)

    assert probs.shape == (1, 5), f"Expected (1, 5), got {probs.shape}"
    assert abs(probs.sum().item() - 1.0) < 1e-5, "Probabilities should sum to 1"
    assert (probs >= 0).all(), "Probabilities should be non-negative"

    print("✓ test_predict_proba passed")


def test_get_last_conv_layer():
    """Test that get_last_conv_layer returns a valid layer."""
    from models.efficientnet import create_model

    model = create_model(num_classes=5, freeze_base=True, pretrained=False,
                         device=torch.device("cpu"))

    layer = model.get_last_conv_layer()
    assert layer is not None, "Last conv layer should not be None"
    assert isinstance(layer, torch.nn.Module)

    print("✓ test_get_last_conv_layer passed")


if __name__ == "__main__":
    test_model_creation()
    test_model_frozen_base()
    test_model_unfreeze()
    test_model_different_classes()
    test_predict_proba()
    test_get_last_conv_layer()
    print("\n✅ All model tests passed!")
