"""
FloraVeda — EfficientNetB0 Classifier
=======================================
Transfer learning with EfficientNetB0 pre-trained on ImageNet.

Supports:
- Frozen base (feature extraction only)
- Partial fine-tuning (unfreeze last N blocks)
- Full fine-tuning (all layers trainable)
- Progressive unfreezing (start frozen, unfreeze later)
"""

import logging
from typing import Optional

import torch
import torch.nn as nn
from torchvision import models

logger = logging.getLogger(__name__)


class EfficientNetB0Classifier(nn.Module):
    """
    EfficientNetB0 with a custom classification head for plant disease detection.

    Architecture:
        EfficientNetB0 backbone (ImageNet pretrained)
            → Global Average Pooling (built into EfficientNet)
            → Dropout
            → Linear (1280 → num_classes)

    The backbone produces 1280-dimensional features after GAP.
    """

    def __init__(
        self,
        num_classes: int,
        dropout_rate: float = 0.3,
        freeze_base: bool = True,
        pretrained: bool = True,
    ):
        """
        Args:
            num_classes: Number of disease classes.
            dropout_rate: Dropout rate before the final linear layer.
            freeze_base: If True, freeze all backbone parameters initially.
            pretrained: If True, load ImageNet-pretrained weights.
        """
        super().__init__()

        self.num_classes = num_classes
        self.freeze_base = freeze_base

        # Load EfficientNetB0 with pretrained weights
        weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
        self.backbone = models.efficientnet_b0(weights=weights)

        # The original classifier head is:
        #   Sequential(Dropout(0.2), Linear(1280, 1000))
        # We replace it entirely.
        in_features = self.backbone.classifier[1].in_features  # 1280

        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=dropout_rate, inplace=True),
            nn.Linear(in_features, num_classes),
        )

        # Freeze backbone if requested
        if freeze_base:
            self._freeze_backbone()

        total = sum(p.numel() for p in self.parameters())
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        logger.info(
            f"EfficientNetB0Classifier: {num_classes} classes, "
            f"{total:,} params total, {trainable:,} trainable"
            f"{' (base frozen)' if freeze_base else ' (all unfrozen)'}"
        )

    def _freeze_backbone(self):
        """Freeze all backbone feature extraction layers."""
        for name, param in self.backbone.features.named_parameters():
            param.requires_grad = False

    def unfreeze_backbone(self, num_blocks_from_end: Optional[int] = None):
        """
        Unfreeze backbone layers for fine-tuning.

        Args:
            num_blocks_from_end: If None, unfreeze ALL backbone layers.
                If an integer, unfreeze only the last N blocks.
        """
        if num_blocks_from_end is None:
            # Unfreeze everything
            for param in self.backbone.features.parameters():
                param.requires_grad = True
            logger.info("Unfroze ALL backbone layers.")
        else:
            # EfficientNetB0 has 9 blocks (features[0] through features[8])
            total_blocks = len(self.backbone.features)
            start_unfreeze = max(0, total_blocks - num_blocks_from_end)

            for i, block in enumerate(self.backbone.features):
                if i >= start_unfreeze:
                    for param in block.parameters():
                        param.requires_grad = True

            logger.info(
                f"Unfroze last {num_blocks_from_end} backbone blocks "
                f"(blocks {start_unfreeze}–{total_blocks - 1})."
            )

        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        logger.info(f"Trainable parameters after unfreeze: {trainable:,}")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: Input tensor [B, 3, 224, 224]

        Returns:
            Logits tensor [B, num_classes] (apply softmax externally for probabilities)
        """
        return self.backbone(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Return softmax probabilities."""
        logits = self.forward(x)
        return torch.softmax(logits, dim=1)

    def get_last_conv_layer(self) -> nn.Module:
        """
        Return the last convolutional layer for Grad-CAM.
        In EfficientNetB0, this is features[-1] (the last block).
        """
        return self.backbone.features[-1]


def create_model(
    num_classes: int,
    dropout_rate: float = 0.3,
    freeze_base: bool = True,
    pretrained: bool = True,
    device: Optional[torch.device] = None,
) -> EfficientNetB0Classifier:
    """
    Factory function to create and move the model to the right device.

    Args:
        num_classes: Number of disease classes.
        dropout_rate: Dropout rate.
        freeze_base: Whether to freeze the backbone.
        pretrained: Whether to use ImageNet pretrained weights.
        device: Target device. Auto-detected if None.

    Returns:
        EfficientNetB0Classifier on the target device.
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = EfficientNetB0Classifier(
        num_classes=num_classes,
        dropout_rate=dropout_rate,
        freeze_base=freeze_base,
        pretrained=pretrained,
    )
    model = model.to(device)
    logger.info(f"Model created on device: {device}")
    return model
