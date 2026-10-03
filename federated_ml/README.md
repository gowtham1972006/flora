# FloraVeda — Federated Learning Module

Privacy-preserving plant disease classification using EfficientNetB0
with Federated Averaging (FedAvg) and FedSCAFFOLD.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Place dataset in data/raw/ (see data/README.md)

# 3. Prepare and validate the dataset
python prepare_data.py

# 4. Create non-IID client partitions
python create_clients.py --num-clients 4 --alpha 0.3

# 5. Train centralized baseline
python train_centralized.py --epochs 20

# 6. Train with FedAvg (baseline)
python train_federated.py --algorithm fedavg --rounds 20

# 7. Train with FedSCAFFOLD (primary algorithm)
python train_federated.py --algorithm fedscaffold --rounds 20

# 8. Evaluate all models
python evaluate.py --compare

# 9. Generate Grad-CAM visualizations
python generate_gradcam.py --num-samples 20

# 10. Start inference API
python inference.py --port 5000
```

## Run Tests

```bash
python tests/test_preprocessing.py
python tests/test_model.py
python tests/test_federated.py
python tests/test_inference.py
```

## Architecture

```
FloraVeda Frontend (React)
    ↓ (POST /predict)
Inference API (Flask :5000)
    ↓
Global EfficientNetB0
    ↓
Disease prediction + Grad-CAM
```

Federated training (separate from inference):
```
Client 1 ─┐
Client 2 ─┤ model updates only (no images)
Client 3 ─┼──→ Federated Server → Global Model
Client 4 ─┘
```

## Key Configuration (config.py)

| Parameter | Default | Description |
|---|---|---|
| `NUM_CLIENTS` | 4 | Number of simulated clients |
| `DIRICHLET_ALPHA` | 0.3 | Non-IID severity (lower = more heterogeneous) |
| `IMAGE_SIZE` | 224 | EfficientNetB0 input resolution |
| `BATCH_SIZE` | 32 | Training batch size |
| `LOCAL_EPOCHS` | 5 | Epochs per client per round |
| `FEDERATED_ROUNDS` | 20 | Total communication rounds |
| `LEARNING_RATE` | 0.001 | SGD learning rate |
