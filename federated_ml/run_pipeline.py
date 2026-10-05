"""
FloraVeda Federated ML — End-to-End Pipeline Runner
=====================================================
Runs the complete FL pipeline in the correct order:

  1. Generate synthetic demo dataset (data/raw/)
  2. Prepare / validate dataset   (data/processed/)
  3. Create client partitions      (data/clients/partition.json)
  4. Run unit tests                (tests/)
  5. Centralized training sanity   (checkpoints/centralized_best.pt)
  6. Federated training SCAFFOLD   (checkpoints/fedscaffold_final.pt)
  7. Generate Grad-CAM results     (results/)

Usage:
    python run_pipeline.py [--rounds 5] [--clients 4] [--skip-tests]
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def run(cmd: list, label: str):
    """Run a subprocess command, exit if it fails."""
    print(f"\n{'='*60}")
    print(f"STEP: {label}")
    print(f"CMD : {' '.join(str(c) for c in cmd)}")
    print("=" * 60)
    start = time.time()
    result = subprocess.run(cmd, cwd=BASE_DIR)
    elapsed = time.time() - start
    if result.returncode != 0:
        print(f"\n[PIPELINE ERROR] Step '{label}' failed (exit code {result.returncode})")
        sys.exit(result.returncode)
    print(f"\n[OK] '{label}' completed in {elapsed:.1f}s")


def main():
    parser = argparse.ArgumentParser(description="Run the full FloraVeda FL pipeline")
    parser.add_argument("--rounds", type=int, default=5, help="Federated training rounds")
    parser.add_argument("--clients", type=int, default=4, help="Number of FL clients")
    parser.add_argument("--local-epochs", type=int, default=3, help="Local epochs per round")
    parser.add_argument("--skip-tests", action="store_true", help="Skip unit tests")
    parser.add_argument(
        "--algorithm", type=str, default="fedscaffold",
        choices=["fedavg", "fedscaffold"],
    )
    args = parser.parse_args()

    py = sys.executable

    total_start = time.time()

    # ── Step 1: Generate demo dataset ──────────────────────────────────────────
    run(
        [py, "generate_demo_dataset.py"],
        "Generate synthetic leaf dataset (5 classes × 60 images)",
    )

    # ── Step 2: Prepare dataset ─────────────────────────────────────────────────
    run(
        [py, "prepare_data.py"],
        "Validate and copy images to data/processed/",
    )

    # ── Step 3: Create client partitions ────────────────────────────────────────
    run(
        [py, "create_clients.py",
         "--num-clients", str(args.clients)],
        f"Create {args.clients} non-IID client partitions (Dirichlet α=0.3)",
    )

    # ── Step 4: Unit tests ───────────────────────────────────────────────────────
    if not args.skip_tests:
        run(
            [py, "tests/test_preprocessing.py"],
            "Unit tests: preprocessing pipeline",
        )
        run(
            [py, "tests/test_federated.py"],
            "Unit tests: FL algorithms (FedAvg, FedSCAFFOLD, partitioning)",
        )
        run(
            [py, "tests/test_model.py"],
            "Unit tests: EfficientNetB0 model",
        )

    # ── Step 5: Centralized training sanity check ───────────────────────────────
    run(
        [py, "train_centralized.py",
         "--epochs", "3",
         "--batch-size", "16"],
        "Centralized training sanity check (3 epochs) — loss must decrease",
    )

    # ── Step 6: Federated training ───────────────────────────────────────────────
    run(
        [py, "train_federated.py",
         "--algorithm", args.algorithm,
         "--rounds", str(args.rounds),
         "--local-epochs", str(args.local_epochs),
         "--num-clients", str(args.clients),
         "--batch-size", "16"],
        f"Federated training ({args.algorithm.upper()}, {args.rounds} rounds, "
        f"{args.clients} clients)",
    )

    # ── Step 7: Generate Grad-CAM results ────────────────────────────────────────
    run(
        [py, "generate_gradcam.py"],
        "Generate Grad-CAM overlays on sample images → results/",
    )

    total_time = time.time() - total_start
    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)
    print(f"  Total time:  {total_time:.1f}s")
    print(f"  Model:       checkpoints/global_final.pt")
    print(f"  Class map:   checkpoints/class_to_index.json")
    print(f"  Grad-CAM:    results/")
    print(f"  Logs:        logs/")
    print()
    print("Start inference API:")
    print(f"  python inference.py")
    print()
    print("Test inference API:")
    print(f"  curl http://localhost:5000/health")
    print("=" * 60)


if __name__ == "__main__":
    main()
