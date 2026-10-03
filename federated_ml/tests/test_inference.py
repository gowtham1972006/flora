"""
FloraVeda — Tests for Inference Pipeline
==========================================
End-to-end: image → preprocessing → model → prediction
"""

import sys
import base64
import io
from pathlib import Path

import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_end_to_end_pipeline():
    """Test: image → preprocess → model → prediction (correct shapes and types)."""
    from preprocessing.transforms import preprocess_single_image
    from models.efficientnet import create_model

    # Create a test image
    img = Image.new("RGB", (640, 480), color=(0, 128, 0))

    # Preprocess
    tensor = preprocess_single_image(img)
    assert tensor.shape == (1, 3, 224, 224), f"Wrong shape: {tensor.shape}"

    # Model inference
    model = create_model(num_classes=5, freeze_base=True, pretrained=False,
                         device=torch.device("cpu"))
    model.eval()

    with torch.no_grad():
        output = model(tensor)

    assert output.shape == (1, 5), f"Wrong output shape: {output.shape}"

    # Softmax
    probs = torch.softmax(output, dim=1)
    assert abs(probs.sum().item() - 1.0) < 1e-4, "Probs should sum to 1"

    # Argmax = prediction
    pred = probs.argmax(dim=1).item()
    assert 0 <= pred < 5, f"Prediction {pred} out of range"

    print("✓ test_end_to_end_pipeline passed")


def test_base64_roundtrip():
    """Test base64 encoding → decoding roundtrip for inference API."""
    img = Image.new("RGB", (224, 224), color=(100, 200, 50))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    # Decode back
    decoded = base64.b64decode(b64)
    img_back = Image.open(io.BytesIO(decoded))
    assert img_back.size == (224, 224)
    assert img_back.mode == "RGB"

    print("✓ test_base64_roundtrip passed")


def test_gradcam_generation():
    """Test that Grad-CAM produces a valid heatmap."""
    from models.efficientnet import create_model
    from explainability.gradcam import GradCAM

    model = create_model(num_classes=5, freeze_base=True, pretrained=False,
                         device=torch.device("cpu"))
    model.eval()

    target_layer = model.get_last_conv_layer()
    grad_cam = GradCAM(model, target_layer)

    dummy_input = torch.randn(1, 3, 224, 224)
    cam = grad_cam.generate(dummy_input, target_class=0)

    assert cam.shape == (224, 224), f"CAM shape should be (224, 224), got {cam.shape}"
    assert cam.min() >= 0 and cam.max() <= 1.0, "CAM values should be in [0, 1]"

    grad_cam.release()
    print("✓ test_gradcam_generation passed")


def test_gradcam_overlay():
    """Test the full Grad-CAM overlay pipeline."""
    from models.efficientnet import create_model
    from explainability.gradcam import generate_gradcam_overlay
    from preprocessing.transforms import get_eval_transform

    model = create_model(num_classes=5, freeze_base=True, pretrained=False,
                         device=torch.device("cpu"))
    model.eval()

    original = Image.new("RGB", (640, 480), color=(0, 128, 0))
    transform = get_eval_transform()
    input_tensor = transform(original).unsqueeze(0)

    overlay, heatmap, pred_class, confidence = generate_gradcam_overlay(
        model=model,
        input_tensor=input_tensor,
        original_image=original,
        alpha=0.4,
    )

    assert overlay.mode == "RGB"
    assert overlay.size == original.size
    assert 0 <= pred_class < 5
    assert 0 <= confidence <= 1

    print("✓ test_gradcam_overlay passed")


if __name__ == "__main__":
    test_end_to_end_pipeline()
    test_base64_roundtrip()
    test_gradcam_generation()
    test_gradcam_overlay()
    print("\n✅ All inference tests passed!")
