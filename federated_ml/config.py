"""
FloraVeda Federated Learning — Centralized Configuration
=========================================================
All tuneable hyper-parameters and paths live here so they are
never scattered across training scripts.
"""

import os
import sys
from pathlib import Path

# Ensure proper encoding on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ─── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
CLIENT_DATA_DIR = DATA_DIR / "clients"
CHECKPOINT_DIR = BASE_DIR / "checkpoints"
LOG_DIR = BASE_DIR / "logs"
CONFIG_DIR = BASE_DIR / "configs"

# ─── Image Preprocessing ────────────────────────────────────────────────────────
IMAGE_SIZE = 224                     # EfficientNetB0 input resolution
MIN_IMAGE_RESOLUTION = 64           # reject images smaller than this
IMAGE_CHANNELS = 3                  # RGB

# EfficientNetB0 normalization (ImageNet statistics)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# ─── Augmentation (training only) ───────────────────────────────────────────────
AUG_ROTATION_DEGREES = 15           # max rotation ±15°
AUG_HORIZONTAL_FLIP_PROB = 0.5
AUG_BRIGHTNESS_RANGE = 0.1          # ±10%
AUG_CONTRAST_RANGE = 0.1            # ±10%
AUG_SATURATION_RANGE = 0.1          # ±10%
AUG_ZOOM_RANGE = (0.9, 1.1)         # 90%–110%
AUG_TRANSLATE_FRACTION = 0.05       # max 5% translation

# ─── Dataset Split ──────────────────────────────────────────────────────────────
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# ─── Federated Learning ─────────────────────────────────────────────────────────
NUM_CLIENTS = 4
DIRICHLET_ALPHA = 0.3               # lower = more non-IID
CLIENT_PARTICIPATION_RATE = 1.0     # fraction of clients per round

# ─── Training Hyper-parameters ───────────────────────────────────────────────────
BATCH_SIZE = 32
LOCAL_EPOCHS = 5
FEDERATED_ROUNDS = 20
LEARNING_RATE = 1e-3
LEARNING_RATE_FINETUNE = 1e-4       # for unfrozen base layers
WEIGHT_DECAY = 1e-4
DROPOUT_RATE = 0.3

# ─── Model ───────────────────────────────────────────────────────────────────────
NUM_CLASSES = None                   # auto-detected from dataset
FREEZE_BASE = True                   # freeze EfficientNetB0 base initially
PROGRESSIVE_UNFREEZE = True          # unfreeze later rounds
UNFREEZE_AFTER_ROUND = 10            # round at which to unfreeze base

# ─── Reproducibility ────────────────────────────────────────────────────────────
RANDOM_SEED = 42

# ─── Inference API ───────────────────────────────────────────────────────────────
INFERENCE_HOST = "0.0.0.0"
INFERENCE_PORT = 5000
GLOBAL_MODEL_PATH = CHECKPOINT_DIR / "global_final.pt"

# ─── Checkpoint Naming ──────────────────────────────────────────────────────────
def checkpoint_path(algorithm: str, round_num: int) -> Path:
    """Return the checkpoint file path for a given algorithm and round."""
    return CHECKPOINT_DIR / f"{algorithm}_round_{round_num:03d}.pt"

def final_checkpoint_path(algorithm: str) -> Path:
    """Return the path for the final model checkpoint."""
    return CHECKPOINT_DIR / f"{algorithm}_final.pt"

# ─── Ensure directories exist ───────────────────────────────────────────────────
def ensure_dirs():
    """Create all required directories if they don't exist."""
    for d in [DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, CLIENT_DATA_DIR,
              CHECKPOINT_DIR, LOG_DIR, CONFIG_DIR]:
        d.mkdir(parents=True, exist_ok=True)
