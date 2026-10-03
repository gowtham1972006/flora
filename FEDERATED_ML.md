# FloraVeda — Federated Learning Architecture

## Table of Contents

1. [Overall Architecture](#1-overall-architecture)
2. [Why Federated Learning](#2-why-federated-learning)
3. [Client/Server Architecture](#3-clientserver-architecture)
4. [Local Image Preprocessing](#4-local-image-preprocessing)
5. [EfficientNetB0](#5-efficientnetb0)
6. [Non-IID Data Distribution](#6-non-iid-data-distribution)
7. [FedAvg](#7-fedavg)
8. [FedSCAFFOLD](#8-fedscaffold)
9. [Control Variates](#9-control-variates)
10. [Communication Rounds](#10-communication-rounds)
11. [Global Model](#11-global-model)
12. [Grad-CAM](#12-grad-cam)
13. [Inference Integration](#13-inference-integration)
14. [Privacy / Data Locality](#14-privacy--data-locality)
15. [How to Run](#15-how-to-run)
16. [Dataset Preparation](#16-dataset-preparation)
17. [Evaluation](#17-evaluation)
18. [Known Limitations](#18-known-limitations)

---

## 1. Overall Architecture

```
FloraVeda Application
    ├── Existing Features (Auth, Plants, Favorites, Care Tasks, etc.)
    ├── Plant Scan UI
    │     ├── Gemini AI Diagnosis (existing, unchanged)
    │     └── EfficientNetB0 Inference (new, opt-in)
    │
    └── Federated ML Layer (federated_ml/)
          ├── Local Image Preprocessing
          ├── EfficientNetB0 (Transfer Learning)
          ├── Simulated Federated Clients (×4)
          ├── Non-IID Data Distribution (Dirichlet)
          ├── FedAvg (baseline)
          ├── FedSCAFFOLD (primary algorithm)
          ├── Global Model
          ├── Grad-CAM Explainability
          └── Flask Inference API
```

The federated ML module is **completely separate** from the React/Supabase application. It lives in `federated_ml/` and communicates with the frontend only through a lightweight REST API.

---

## 2. Why Federated Learning

Traditional machine learning requires collecting all training data in one place. For medical/agricultural image data:

- **Privacy**: Plant disease images may contain location metadata, proprietary crop data, or sensitive agricultural information
- **Data Sovereignty**: Different farms/regions may not want to share raw images
- **Communication Cost**: Uploading thousands of high-resolution plant images is expensive
- **Decentralized Data**: In reality, plant disease images exist on many devices across many locations

Federated Learning solves this by training the model collaboratively **without centralizing the data**. Each client trains locally and only shares model weight updates.

---

## 3. Client/Server Architecture

```
┌─────────────────────────────────────────┐
│              LOCAL MACHINE              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      Federated Server           │    │
│  │  • Global model                 │    │
│  │  • FedAvg / FedSCAFFOLD        │    │
│  │  • Checkpoints                  │    │
│  └──────────┬──────────────────────┘    │
│             │ model updates only        │
│    ┌────────┼────────┐                  │
│    │        │        │                  │
│  ┌─┴─┐  ┌─┴─┐  ┌─┴─┐  ┌───┐         │
│  │ C1 │  │ C2 │  │ C3 │  │ C4│         │
│  │    │  │    │  │    │  │   │         │
│  │imgs│  │imgs│  │imgs│  │img│         │
│  └────┘  └────┘  └────┘  └───┘         │
└─────────────────────────────────────────┘
```

Each client:
1. Receives the current global model
2. Loads **only** its own local images
3. Preprocesses and augments locally
4. Trains EfficientNetB0 locally
5. Sends **only** model weight deltas back to the server

The server **never** receives, loads, or processes client images.

---

## 4. Local Image Preprocessing

Every image passes through this pipeline **on the client**:

```
Raw Image
    ↓ validate (file integrity, format, size)
    ↓ EXIF orientation correction
    ↓ RGB conversion (RGBA, grayscale, CMYK handled)
    ↓ Aspect-ratio-aware resize + center crop
    ↓ 224 × 224
    ↓ Training augmentation (training only)
    ↓ ImageNet normalization
    ↓ Tensor [3, 224, 224]
```

**Augmentation** (training only):
- Rotation: ±15°
- Horizontal flip: 50%
- Random resized crop: 80-100% scale
- Color jitter: ±10% brightness/contrast/saturation
- Translation: ±5%
- No hue shift (preserves disease colors)
- No vertical flip (unnatural)
- No cutout (could mask disease region)

**Validation/Test**: deterministic resize + center crop only.

---

## 5. EfficientNetB0

**Architecture**:
```
Input [B, 3, 224, 224]
    ↓
EfficientNetB0 Backbone (ImageNet pretrained)
    ↓
Global Average Pooling → 1280-d features
    ↓
Dropout (0.3)
    ↓
Linear (1280 → num_classes)
    ↓
Softmax → class probabilities
```

**Training Strategies**:
1. **Feature Extraction** (rounds 1–10): backbone frozen, only classifier trains
2. **Fine-tuning** (rounds 11+): last 3 backbone blocks unfrozen with lower learning rate
3. **Full fine-tuning**: all layers trainable (optional)

EfficientNetB0 learns the disease-related visual features itself — no handcrafted feature extraction.

---

## 6. Non-IID Data Distribution

Real federated data is **not identically distributed** across clients. We simulate this using the **Dirichlet distribution**:

```
targets = [0, 1, 2, 0, 1, ...]  # class labels
proportions ~ Dir(α)              # per-class allocation across clients
```

- **α → 0**: extremely non-IID (each client mostly has one class)
- **α = 0.3**: moderately non-IID (realistic, our default)
- **α → ∞**: IID (uniform distribution)

This creates clients with heterogeneous class distributions, which is the primary challenge that FedSCAFFOLD addresses.

---

## 7. FedAvg

**Federated Averaging** (McMahan et al., 2017) — our baseline algorithm:

1. Server sends global model **w** to all clients
2. Each client trains locally for **E** epochs
3. Server aggregates: **w_new = Σ (nᵢ/N) · wᵢ**

where nᵢ = samples on client i, N = total samples.

FedAvg works well with IID data but suffers from **client drift** on non-IID data.

---

## 8. FedSCAFFOLD

**SCAFFOLD** (Karimireddy et al., ICML 2020) — our primary algorithm:

Addresses client drift by maintaining **control variates** that estimate gradient directions.

**Per round**:
1. Server sends **(w, c)** to clients
2. Each client i:
   - Trains locally with corrected gradients: **g_corrected = g + (c - cᵢ)**
   - Updates its control variate: **cᵢ_new = cᵢ - c + (w - yᵢ) / (K·η)**
   - Sends **(Δy, Δc)** to server
3. Server aggregates:
   - **w_new = w + (1/S) · Σ Δyᵢ**
   - **c_new = c + (1/N) · Σ Δcᵢ**

---

## 9. Control Variates

Control variates are the key innovation of SCAFFOLD:

- **c** (global): estimates the average gradient direction across all clients
- **cᵢ** (per-client): estimates the local gradient direction on client i
- **c - cᵢ**: the correction term applied during local training

This correction **reduces the variance** caused by heterogeneous data and allows clients to make progress toward the global optimum rather than drifting toward their local optima.

---

## 10. Communication Rounds

```
Round 1:  Server → clients (global model)
          Clients → server (model updates + Δc)
          Server aggregates → new global model

Round 2:  Server → clients (updated global model)
          ...

Round N:  Final global model
```

Each round, only **model weight deltas** and **control variate deltas** are communicated. The total communication per round is proportional to the model size, **not** the dataset size.

---

## 11. Global Model

The global model is the aggregated EfficientNetB0 that combines knowledge from all clients without seeing their data. It is:

- Saved as checkpoints after each round
- Used for inference via the Flask API
- Evaluated on a held-out global test set

---

## 12. Grad-CAM

**Gradient-weighted Class Activation Mapping** (Selvaraju et al., 2017):

```
Input image → EfficientNetB0 → prediction
                      ↓
        Hook last conv layer
                      ↓
        Backward pass for target class
                      ↓
        Gradient × Activations → weighted sum
                      ↓
        ReLU → resize → normalize → heatmap
                      ↓
        Overlay on original image
```

The heatmap shows which regions of the leaf contributed most to the disease prediction, providing **interpretable** results for end users.

---

## 13. Inference Integration

```
FloraVeda Scan UI
    ↓ capture/upload image
    ↓ base64 encode
    ↓
  ┌─────────────────────────────────────┐
  │ diagnoseImage() in diagnosis.ts     │
  │                                     │
  │ 1. Try Gemini Edge Function        │ ← existing
  │ 2. Try Federated ML (if enabled)   │ ← NEW
  │ 3. Try Client-side Gemini          │ ← existing
  │ 4. Demo fallback                   │ ← existing
  └─────────────────────────────────────┘
    ↓
  Disease result + confidence + Grad-CAM
```

The federated ML path is controlled by `VITE_ENABLE_FEDERATED_ML=true`. When disabled, the app behaves exactly as before.

---

## 14. Privacy / Data Locality

### What STAYS LOCAL (per client):
- ✅ Raw plant images
- ✅ Preprocessed images
- ✅ Augmented images
- ✅ Local training batches
- ✅ Local feature representations
- ✅ Local model during training
- ✅ Local control variate (cᵢ)

### What IS COMMUNICATED:
- Model weight updates (Δw)
- Control variate deltas (Δc)
- Sample counts
- Training metrics (loss, accuracy)

### What IS STORED CENTRALLY:
- Global model weights
- Global control variate (c)
- Aggregated round metrics
- Evaluation results

### Important Disclaimer
Federated Learning keeps raw training data decentralized. However, model updates can theoretically leak some information about the training data. This implementation does **not** add differential privacy or secure aggregation. Those are separate research areas and not claimed as features.

---

## 15. How to Run

```bash
cd federated_ml

# 1. Install dependencies
pip install -r requirements.txt

# 2. Prepare dataset (place images in data/raw/ first)
python prepare_data.py

# 3. Create non-IID client partitions
python create_clients.py --num-clients 4 --alpha 0.3

# 4. Train centralized baseline
python train_centralized.py --epochs 20

# 5. Train with FedAvg
python train_federated.py --algorithm fedavg --rounds 20

# 6. Train with FedSCAFFOLD
python train_federated.py --algorithm fedscaffold --rounds 20

# 7. Evaluate and compare all models
python evaluate.py --compare

# 8. Generate Grad-CAM visualizations
python generate_gradcam.py --num-samples 20

# 9. Start inference API
python inference.py --port 5000
```

---

## 16. Dataset Preparation

See `federated_ml/data/README.md` for dataset setup instructions.

The recommended dataset is **PlantVillage** (~54,000 images, 38 classes).

The system auto-detects classes from the directory structure:
```
data/raw/
    ClassName1/
        img001.jpg
    ClassName2/
        img002.jpg
```

---

## 17. Evaluation

The evaluation compares three training approaches:

| Approach | Description |
|---|---|
| Centralized | Standard training on all data combined |
| FedAvg | Federated baseline (weighted averaging) |
| FedSCAFFOLD | Federated with control variates |

Metrics: Accuracy, Precision, Recall, F1-Score, Confusion Matrix, per-class performance.

Expected outcome: FedSCAFFOLD should converge faster and achieve higher accuracy than FedAvg on non-IID data, approaching centralized performance.

---

## 18. Known Limitations

1. **Simulated clients**: All clients run on one machine. Real deployment would require network communication.
2. **No differential privacy**: Model updates may leak information. DP-SGD could be added.
3. **No secure aggregation**: A malicious server could inspect individual updates.
4. **Dataset dependency**: Model quality depends entirely on the training data quality.
5. **Python 3.14 + PyTorch**: Uses PyTorch instead of TensorFlow due to TF not supporting Python 3.14.
6. **Single GPU**: Training uses one GPU (or CPU). Multi-GPU parallelism is not implemented.
7. **Class mapping**: The inference API maps ML class names to the 4 existing FloraVeda disease IDs. Classes not in the mapping default to "chlorosis".
