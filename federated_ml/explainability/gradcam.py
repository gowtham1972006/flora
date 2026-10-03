"""
FloraVeda — Grad-CAM (Gradient-weighted Class Activation Mapping)
==================================================================
Generates visual explanations showing which regions of a leaf image
contributed most to the disease prediction.

Reference:
    Selvaraju et al., "Grad-CAM: Visual Explanations from Deep Networks
    via Gradient-based Localization" (ICCV 2017)

Pipeline:
    Input image → EfficientNetB0 → prediction →
    Grad-CAM on last conv layer → heatmap → overlay on original
"""

import io
import base64
import logging
from typing import Optional, Tuple

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.cm as cm

logger = logging.getLogger(__name__)


class GradCAM:
    """
    Grad-CAM implementation for EfficientNetB0.

    Hooks into the last convolutional layer to capture:
    1. Forward activations (feature maps)
    2. Backward gradients (importance weights)

    Then computes a weighted combination to produce a heatmap.
    """

    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        """
        Args:
            model: The EfficientNetB0 classifier.
            target_layer: The convolutional layer to visualize (usually the last one).
        """
        self.model = model
        self.target_layer = target_layer
        self.activations = None
        self.gradients = None

        # Register hooks
        self._forward_hook = target_layer.register_forward_hook(self._save_activation)
        self._backward_hook = target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        """Hook to capture forward activations."""
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        """Hook to capture backward gradients."""
        self.gradients = grad_output[0].detach()

    def generate(
        self,
        input_tensor: torch.Tensor,
        target_class: Optional[int] = None,
    ) -> np.ndarray:
        """
        Generate a Grad-CAM heatmap.

        Args:
            input_tensor: Preprocessed image tensor [1, 3, 224, 224].
            target_class: Class index to explain. If None, uses the predicted class.

        Returns:
            Heatmap as numpy array [H, W] with values in [0, 1].
        """
        self.model.eval()

        # Ensure input requires grad for backward pass
        input_tensor = input_tensor.clone().requires_grad_(True)
        device = next(self.model.parameters()).device
        input_tensor = input_tensor.to(device)

        # Forward pass
        output = self.model(input_tensor)

        # Use predicted class if target not specified
        if target_class is None:
            target_class = output.argmax(dim=1).item()

        # Backward pass for the target class
        self.model.zero_grad()
        target_score = output[0, target_class]
        target_score.backward()

        # Get activations and gradients
        activations = self.activations  # [1, C, H', W']
        gradients = self.gradients       # [1, C, H', W']

        # Global average pool the gradients → importance weights
        weights = gradients.mean(dim=(2, 3), keepdim=True)  # [1, C, 1, 1]

        # Weighted combination of activation maps
        cam = (weights * activations).sum(dim=1, keepdim=True)  # [1, 1, H', W']

        # ReLU — only positive contributions
        cam = F.relu(cam)

        # Resize to input image size
        cam = F.interpolate(
            cam,
            size=(input_tensor.shape[2], input_tensor.shape[3]),
            mode="bilinear",
            align_corners=False,
        )

        # Normalize to [0, 1]
        cam = cam.squeeze().cpu().numpy()
        if cam.max() > 0:
            cam = (cam - cam.min()) / (cam.max() - cam.min())

        return cam

    def release(self):
        """Remove hooks to free memory."""
        self._forward_hook.remove()
        self._backward_hook.remove()


def generate_heatmap_image(
    cam: np.ndarray,
    colormap: str = "jet",
) -> Image.Image:
    """
    Convert a Grad-CAM array to a colored heatmap image.

    Args:
        cam: Grad-CAM output [H, W] in [0, 1].
        colormap: Matplotlib colormap name.

    Returns:
        PIL Image of the heatmap.
    """
    colormap_fn = matplotlib.colormaps[colormap]
    heatmap = colormap_fn(cam)[:, :, :3]  # drop alpha channel
    heatmap = (heatmap * 255).astype(np.uint8)
    return Image.fromarray(heatmap)


def generate_gradcam_overlay(
    model: torch.nn.Module,
    input_tensor: torch.Tensor,
    original_image: Image.Image,
    target_class: Optional[int] = None,
    alpha: float = 0.5,
) -> Tuple[Image.Image, Image.Image, int, float]:
    """
    End-to-end Grad-CAM: generate overlay on original image.

    Args:
        model: EfficientNetB0 classifier with a get_last_conv_layer() method.
        input_tensor: Preprocessed tensor [1, 3, 224, 224].
        original_image: Original PIL image for overlay.
        target_class: Class to explain (None = predicted class).
        alpha: Blending factor for overlay (0 = all original, 1 = all heatmap).

    Returns:
        Tuple of:
        - overlay: PIL Image with heatmap overlaid on original
        - heatmap: PIL Image of the raw heatmap
        - predicted_class: The predicted class index
        - confidence: Softmax probability of predicted class
    """
    # Get the target layer
    target_layer = model.get_last_conv_layer()

    # Create Grad-CAM
    grad_cam = GradCAM(model, target_layer)

    try:
        # Get prediction
        model.eval()
        device = next(model.parameters()).device
        with torch.no_grad():
            logits = model(input_tensor.to(device))
            probs = torch.softmax(logits, dim=1)
            predicted_class = probs.argmax(dim=1).item()
            confidence = probs[0, predicted_class].item()

        # Use target_class if specified, otherwise predicted
        explain_class = target_class if target_class is not None else predicted_class

        # Generate CAM
        cam = grad_cam.generate(input_tensor, target_class=explain_class)

        # Create heatmap image
        heatmap = generate_heatmap_image(cam)

        # Resize to match original image
        heatmap_resized = heatmap.resize(original_image.size, Image.LANCZOS)
        original_rgb = original_image.convert("RGB")

        # Blend overlay
        overlay = Image.blend(original_rgb, heatmap_resized, alpha=alpha)

    finally:
        grad_cam.release()

    return overlay, heatmap, predicted_class, confidence


def gradcam_to_base64(overlay: Image.Image, format: str = "PNG") -> str:
    """Convert a Grad-CAM overlay image to base64 string for API response."""
    buffer = io.BytesIO()
    overlay.save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
