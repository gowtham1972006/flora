"""
FloraVeda — Inference API (Flask)
==================================
REST API for plant disease prediction using the trained global model.
Runs alongside the existing FloraVeda frontend.

Endpoints:
    POST /predict      → Disease prediction + confidence + optional Grad-CAM
    GET  /health       → Health check
    GET  /classes      → List of disease classes

Usage:
    python inference.py [--port 5000] [--model checkpoints/global_final.pt]

This API does NOT replace the existing Gemini diagnosis.
It provides an ADDITIONAL inference path for the federated model.
"""

import argparse
import base64
import io
import logging
import sys
from pathlib import Path

import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (
    CHECKPOINT_DIR, INFERENCE_HOST, INFERENCE_PORT,
    GLOBAL_MODEL_PATH, ensure_dirs,
)
from preprocessing.validator import validate_image, ImageValidationError
from preprocessing.transforms import get_eval_transform, preprocess_single_image
from models.efficientnet import create_model
from explainability.gradcam import generate_gradcam_overlay, gradcam_to_base64

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("inference")

# ── Global state ─────────────────────────────────────────────────────────────────
model = None
class_names = []
device = torch.device("cpu")
model_loaded = False


def load_model(model_path: Path) -> bool:
    """Load the trained global model."""
    global model, class_names, device, model_loaded

    if not model_path.exists():
        logger.warning(f"Model not found: {model_path}")
        return False

    try:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
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
        model_loaded = True

        logger.info(f"Model loaded: {model_path} ({num_classes} classes)")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False


def predict_from_base64(image_b64: str, include_gradcam: bool = True) -> dict:
    """
    Run inference on a base64-encoded image.

    Returns:
        Dict with predicted_class, confidence, class_name, gradcam_base64 (optional).
    """
    if not model_loaded:
        return {"error": "Model not loaded", "status": "unavailable"}

    try:
        # Decode base64
        image_data = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
    except Exception as e:
        return {"error": f"Invalid image data: {e}"}

    # Preprocess
    eval_transform = get_eval_transform()
    input_tensor = eval_transform(img).unsqueeze(0)

    # Predict
    with torch.no_grad():
        input_tensor_dev = input_tensor.to(device)
        logits = model(input_tensor_dev)
        probs = torch.softmax(logits, dim=1)
        confidence, predicted = torch.max(probs, 1)

    pred_idx = predicted.item()
    pred_confidence = confidence.item()
    pred_class = class_names[pred_idx] if pred_idx < len(class_names) else f"Class_{pred_idx}"

    result = {
        "predicted_class": pred_class,
        "predicted_index": pred_idx,
        "confidence": round(pred_confidence * 100, 1),
        "all_probabilities": {
            class_names[i]: round(probs[0, i].item() * 100, 1)
            for i in range(len(class_names))
        },
    }

    # Grad-CAM
    if include_gradcam:
        try:
            overlay, _, _, _ = generate_gradcam_overlay(
                model=model,
                input_tensor=input_tensor,
                original_image=img,
                target_class=pred_idx,
                alpha=0.4,
            )
            result["gradcam_base64"] = gradcam_to_base64(overlay)
        except Exception as e:
            logger.warning(f"Grad-CAM failed: {e}")
            result["gradcam_base64"] = None

    return result


def create_app():
    """Create the Flask application."""
    from flask import Flask, request, jsonify
    from flask_cors import CORS

    app = Flask(__name__)
    CORS(app)  # Allow cross-origin requests from the React frontend

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "ok" if model_loaded else "no_model",
            "model_loaded": model_loaded,
            "num_classes": len(class_names),
            "classes": class_names,
        })

    @app.route("/classes", methods=["GET"])
    def get_classes():
        return jsonify({
            "classes": class_names,
            "num_classes": len(class_names),
        })

    @app.route("/predict", methods=["POST"])
    def predict():
        if not model_loaded:
            return jsonify({
                "error": "Model not loaded. Train the federated model first.",
                "status": "unavailable",
            }), 503

        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"error": "Missing 'image' field (base64-encoded)"}), 400

        image_b64 = data["image"]
        include_gradcam = data.get("gradcam", True)

        result = predict_from_base64(image_b64, include_gradcam=include_gradcam)

        if "error" in result:
            return jsonify(result), 400

        return jsonify(result)

    return app


def main():
    parser = argparse.ArgumentParser(description="FloraVeda ML Inference API")
    parser.add_argument("--port", type=int, default=INFERENCE_PORT)
    parser.add_argument("--host", type=str, default=INFERENCE_HOST)
    parser.add_argument(
        "--model", type=str, default=str(GLOBAL_MODEL_PATH),
        help="Path to the trained model checkpoint",
    )
    args = parser.parse_args()

    ensure_dirs()

    # Try to load the model
    model_path = Path(args.model)
    if not model_path.exists():
        # Try alternative paths
        for alt in ["global_final.pt", "fedscaffold_final.pt", "fedavg_final.pt", "centralized_best.pt"]:
            alt_path = CHECKPOINT_DIR / alt
            if alt_path.exists():
                model_path = alt_path
                break

    if model_path.exists():
        load_model(model_path)
    else:
        logger.warning(
            f"No trained model found. API will start but return 503 for predictions.\n"
            f"Train a model first, then restart the API."
        )

    app = create_app()
    print(f"\n🌿 FloraVeda ML Inference API")
    print(f"   Host: {args.host}:{args.port}")
    print(f"   Model: {'loaded ✓' if model_loaded else 'not available ✗'}")
    print(f"   Endpoints:")
    print(f"     GET  /health")
    print(f"     GET  /classes")
    print(f"     POST /predict")
    print()

    app.run(host=args.host, port=args.port, debug=False)


if __name__ == "__main__":
    main()
