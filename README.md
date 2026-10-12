# SignBridge — Indian Sign Language Video Recognition

SignBridge is an end-to-end deep learning framework and web application designed to recognize 76 dynamic Indian Sign Language (ISL) word classes from short RGB video clips (primarily `.MOV`).

## Project Overview

- **Dataset**: 76 discrete ISL word classes across 1,166 video samples (806 train / 180 val / 180 test).
- **Temporal Frame Sampling**: 33 uniformly sampled frames per video clip.
- **Spatial Preprocessing**: Standardized to $224 \times 224$ pixels RGB, normalized to $[0, 1]$.
- **Evaluated Architectures**:
  1. **MobileNetV2 (Frozen Backbone Transfer Learning)**: **67.78% Test Accuracy** (Top-performing model).
  2. **Custom 2D CNN**: 3 Conv blocks (32, 64, 128) + ReLU + MaxPool + Global Avg Pooling + Dense(128) + Softmax(76).
  3. **CNN-LSTM Spatio-Temporal Model**: 2D CNN feature extractor paired with LSTM (64 units) capturing temporal transitions across the 33 frames.
- **Late Fusion Note**: Equal-weight late fusion achieved 60.56% on test evaluation; per project specification, late fusion is not the default prediction method.

## Project Structure

```
SignBridge/
├── frontend/             # React + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/   # Dashboard, layout, and preview components
│   │   ├── data/         # Model metrics and 76-class metadata
│   │   ├── types/        # TypeScript interfaces
│   │   ├── styles/       # Design system and glassmorphism styling
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Planned Python / FastAPI model inference backend
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Frontend Setup & Development

```bash
cd frontend
npm install
npm run dev
```

The application will be running locally at `http://localhost:5173/`.

### Building for Production

```bash
cd frontend
npm run build
```
