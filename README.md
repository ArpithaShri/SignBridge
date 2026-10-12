# SignBridge — Indian Sign Language Video Recognition

SignBridge is an end-to-end deep learning framework and web application designed to recognize 76 dynamic Indian Sign Language (ISL) word classes from short RGB video clips (primarily `.MOV`).

## Project Overview

- **Dataset**: 76 discrete ISL word classes across 1,166 video samples (806 train / 180 val / 180 test).
- **Temporal Frame Sampling**: 33 uniformly sampled frames per video clip (`np.linspace(0, total - 1, 33)`).
- **Spatial Preprocessing**: Standardized to $224 \times 224$ pixels RGB, resized with `cv2.INTER_AREA`, scaled into $[-1, 1]$ via MobileNetV2's internal rescaling.
- **Aggregated Video Prediction**: Multi-frame forward pass with frame-level softmax averaging across all 33 frames (`mean(axis=0)`).
- **Evaluated Architectures**:
  1. **MobileNetV2 (Frozen Backbone Transfer Learning)**: **67.78% Test Accuracy** (Top-performing model — connected in Phase 4A).
  2. **Custom 2D CNN**: 3 Conv blocks (32, 64, 128) + ReLU + MaxPool + Global Avg Pooling + Dense(128) + Softmax(76) (5.00% test accuracy).
  3. **CNN-LSTM Spatio-Temporal Model**: 2D CNN feature extractor paired with LSTM (64 units) capturing temporal transitions across 33 frames (4.44% test accuracy).
- **Late Fusion**: Equal-weight late fusion achieved 60.56% on test evaluation; MobileNetV2 remains the standalone primary predictor.

---

## Project Structure

```
SignBridge/
├── backend/
│   ├── app/
│   │   ├── config.py           # API settings, paths, CORS, frame sampling parameters
│   │   ├── preprocessing.py    # 33-frame OpenCV extraction & RGB resizing matching Colab
│   │   ├── inference.py        # MobileNetV2 singleton inference engine & top-K aggregation
│   │   └── main.py             # FastAPI endpoints (/health, /model-info, /recognize)
│   ├── artifacts/
│   │   └── mobilenetv2_frozen/ # Keras model (.keras) & class_mapping.json (76 classes)
│   ├── tests/
│   │   ├── test_api_validation.py # HTTP endpoint, error handling, and inference tests
│   │   └── test_preprocessing.py  # 33-frame extraction, resolution, and invalid-file tests
│   └── requirements.txt        # Python 3.11 dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Dashboard, Recognition, Comparison, Navbar & Footer
│   │   ├── services/
│   │   │   └── recognitionApi.ts # Real FastAPI integration + health check monitoring
│   │   ├── data/               # Model benchmark metrics and 76-class vocabulary
│   │   ├── types/              # TypeScript interfaces
│   │   ├── styles/             # Modern design system and glassmorphism styling
│   │   ├── App.tsx             # Root component with live health polling
│   │   └── main.tsx
│   ├── .env                    # Local Vite API endpoint configuration
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── .env.example                # Project-wide environment template
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18+ and npm v9+
- **Python**: 3.11 (TensorFlow 2.18 / Keras 3 compatible)

---

### 1. Backend Setup & Run (FastAPI + MobileNetV2)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   py -3.11 -m pip install -r requirements.txt
   ```
   *(Note: On Windows with Application Control / WDAC, install via `py -3.11 -m pip install --user -r requirements.txt` to avoid unsigned DLL restrictions).*

3. **Verify Model Artifacts**:
   Ensure `mobilenetv2_frozen_best.keras` (13.8 MB) and `class_mapping.json` (76 classes) exist in:
   `backend/artifacts/mobilenetv2_frozen/`

4. **Run Backend Test Suite**:
   ```bash
   py -3.11 -m pytest tests -v
   ```

5. **Start the FastAPI Backend Server**:
   ```bash
   py -3.11 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - Swagger Documentation: `http://127.0.0.1:8000/docs`
   - Health Check: `http://127.0.0.1:8000/api/v1/health`
   - Model Info: `http://127.0.0.1:8000/api/v1/model-info`

---

### 2. Frontend Setup & Run (React + Vite + TypeScript)

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` (default is already configured for `http://localhost:8000`):
   ```bash
   cp .env.example .env
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/`.

5. **Production Build Validation**:
   ```bash
   npm run build
   ```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Returns backend readiness, loaded model state, and class count. |
| `GET` | `/api/v1/model-info` | Returns model architecture, input/output shapes, and preprocessing parameters. |
| `POST` | `/api/v1/recognize` | Accepts `multipart/form-data` with a video file (`.mov`, `.mp4`, `.avi`), extracts 33 frames, runs MobileNetV2 inference, and returns the top predicted ISL word and top-5 candidates. |

---

## Live vs Mock Mode

- **Live MobileNetV2 Mode**: When the FastAPI server is running on port 8000 with loaded model weights, the frontend displays a green **"MobileNetV2 Live"** badge in the navbar and results carry the **"Live MobileNetV2 Inference"** badge with actual measured latency.
- **Offline Safety**: If the backend is unreachable during video analysis, the frontend displays clear diagnostic error messages rather than silently fabricating mock predictions.
