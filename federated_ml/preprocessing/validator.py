"""
FloraVeda — Image Validator
============================
Validates images before they enter the preprocessing pipeline.
Checks: file integrity, format, minimum resolution, RGB convertibility.
"""

import os
import logging
from pathlib import Path
from typing import Tuple, Optional

from PIL import Image, ExifTags, UnidentifiedImageError

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import MIN_IMAGE_RESOLUTION

logger = logging.getLogger(__name__)

# Supported image formats
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}


class ImageValidationError(Exception):
    """Raised when an image fails validation."""
    pass


def _check_file_exists(path: Path) -> None:
    """Verify the file exists and is non-empty."""
    if not path.exists():
        raise ImageValidationError(f"File does not exist: {path}")
    if not path.is_file():
        raise ImageValidationError(f"Path is not a file: {path}")
    if path.stat().st_size == 0:
        raise ImageValidationError(f"File is empty (0 bytes): {path}")


def _check_extension(path: Path) -> None:
    """Verify the file extension is a supported image format."""
    ext = path.suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ImageValidationError(
            f"Unsupported extension '{ext}'. Supported: {SUPPORTED_EXTENSIONS}"
        )


def _try_open_image(path: Path) -> Image.Image:
    """Try to open and verify the image data is not corrupted."""
    try:
        img = Image.open(path)
        img.verify()  # Verify internal consistency
        # Re-open because verify() can close the image
        img = Image.open(path)
        img.load()    # Force full decode to detect truncation
        return img
    except UnidentifiedImageError:
        raise ImageValidationError(f"Cannot identify image file (corrupted?): {path}")
    except (OSError, SyntaxError) as e:
        raise ImageValidationError(f"Corrupted or unreadable image: {path} — {e}")


def _check_resolution(img: Image.Image, path: Path) -> None:
    """Verify the image meets the minimum resolution requirement."""
    w, h = img.size
    if w < MIN_IMAGE_RESOLUTION or h < MIN_IMAGE_RESOLUTION:
        raise ImageValidationError(
            f"Image too small ({w}×{h}). Minimum: {MIN_IMAGE_RESOLUTION}×{MIN_IMAGE_RESOLUTION}. File: {path}"
        )


def _apply_exif_orientation(img: Image.Image) -> Image.Image:
    """
    Apply EXIF orientation tag to correctly orient the image.
    Many phone cameras store the image in landscape and use
    the EXIF orientation tag to indicate the correct rotation.
    """
    try:
        exif = img.getexif()
        if exif:
            # Find orientation tag
            orientation_key = None
            for tag, name in ExifTags.TAGS.items():
                if name == "Orientation":
                    orientation_key = tag
                    break

            if orientation_key and orientation_key in exif:
                orientation = exif[orientation_key]
                if orientation == 2:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT)
                elif orientation == 3:
                    img = img.rotate(180)
                elif orientation == 4:
                    img = img.transpose(Image.FLIP_TOP_BOTTOM)
                elif orientation == 5:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT).rotate(270)
                elif orientation == 6:
                    img = img.rotate(270, expand=True)
                elif orientation == 7:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT).rotate(90)
                elif orientation == 8:
                    img = img.rotate(90, expand=True)
    except (AttributeError, KeyError, TypeError):
        pass  # No EXIF data or no orientation tag

    return img


def _convert_to_rgb(img: Image.Image) -> Image.Image:
    """
    Convert the image to RGB. Handles:
    - RGBA (drop alpha channel)
    - Grayscale (convert to 3-channel)
    - Palette mode (convert to RGB)
    - CMYK (convert to RGB)
    """
    if img.mode == "RGB":
        return img
    if img.mode == "RGBA":
        # Composite on white background to handle transparency
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        return background
    # Handles L, P, CMYK, etc.
    return img.convert("RGB")


def validate_image(path: str | Path) -> Image.Image:
    """
    Full validation pipeline for a single image.

    Steps:
    1. Check file exists and has a supported extension
    2. Try opening the file (detects corruption)
    3. Check minimum resolution
    4. Apply EXIF orientation correction
    5. Convert to RGB

    Returns:
        PIL Image in RGB mode, correctly oriented.

    Raises:
        ImageValidationError: If the image fails any check.
    """
    path = Path(path)

    _check_file_exists(path)
    _check_extension(path)
    img = _try_open_image(path)
    _check_resolution(img, path)
    img = _apply_exif_orientation(img)
    img = _convert_to_rgb(img)

    return img


def validate_directory(
    directory: str | Path,
    verbose: bool = False,
) -> Tuple[list, list]:
    """
    Validate all images in a directory (recursively).

    Returns:
        (valid_paths, invalid_paths_with_reasons): Two lists.
    """
    directory = Path(directory)
    valid = []
    invalid = []

    for path in sorted(directory.rglob("*")):
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        try:
            validate_image(path)
            valid.append(path)
        except ImageValidationError as e:
            invalid.append((path, str(e)))
            if verbose:
                logger.warning(f"Invalid: {e}")

    logger.info(f"Validated {len(valid)} images, {len(invalid)} invalid in {directory}")
    return valid, invalid
