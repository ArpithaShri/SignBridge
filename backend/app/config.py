import os
from pathlib import Path
from typing import List, Dict, Any, Optional

# Base directory of the backend package
BASE_DIR = Path(__file__).resolve().parent.parent

# Artifact root directory
ARTIFACTS_DIR = BASE_DIR / "artifacts"

# Global Preprocessing Constants
FRAMES_PER_VIDEO = int(os.getenv("FRAMES_PER_VIDEO", "33"))
IMAGE_SIZE_DEFAULT = int(os.getenv("IMAGE_SIZE", "224"))
IMAGE_SIZE_LSTM = int(os.getenv("IMAGE_SIZE_LSTM", "112"))
MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_BYTES", str(100 * 1024 * 1024))) # 100 MB
ALLOWED_EXTENSIONS = {".mov", ".mp4", ".avi", ".webm"}

# Model Catalog & Metadata
MODEL_REGISTRY: Dict[str, Dict[str, Any]] = {
    "mobilenetv2": {
        "id": "mobilenetv2",
        "name": "MobileNetV2 (Frozen Backbone)",
        "model_dir": ARTIFACTS_DIR / "mobilenetv2_frozen",
        "model_file": Path(os.getenv("MOBILENET_MODEL_PATH", ARTIFACTS_DIR / "mobilenetv2_frozen" / "mobilenetv2_frozen_best.keras")),
        "mapping_file": Path(os.getenv("MOBILENET_MAPPING_PATH", ARTIFACTS_DIR / "mobilenetv2_frozen" / "class_mapping.json")),
        "test_accuracy": 67.78,
        "architecture": "ImageNet Pretrained Feature Extractor + Global Avg Pooling + Dense(256) -> Dense(76)",
        "tagline": "Top-performing transfer learning model",
        "input_shape": [None, 224, 224, 3],
        "frame_count": 33,
        "image_size": 224,
        "color_space": "RGB",
        "normalization": "Normalized to [-1, 1] (via internal Rescaling)",
        "input_scale": "[0, 255] float32",
        "input_mode": "individual_frames",
        "aggregation": "mean frame probabilities",
        "is_default": True
    },
    "custom_cnn": {
        "id": "custom_cnn",
        "name": "Custom 2D CNN (Baseline)",
        "model_dir": ARTIFACTS_DIR / "custom_cnn",
        "model_file": Path(os.getenv("CUSTOM_CNN_MODEL_PATH", ARTIFACTS_DIR / "custom_cnn" / "cnn_baseline_best.keras")),
        "mapping_file": Path(os.getenv("CUSTOM_CNN_MAPPING_PATH", ARTIFACTS_DIR / "custom_cnn" / "class_mapping.json")),
        "test_accuracy": 5.00,
        "architecture": "3 Conv blocks (32, 64, 128) + MaxPool + Global Avg Pooling + Dense(128) -> Dense(76)",
        "tagline": "Baseline convolutional architecture without temporal modeling",
        "input_shape": [None, 224, 224, 3],
        "frame_count": 33,
        "image_size": 224,
        "color_space": "RGB",
        "normalization": "Normalized to [0, 1] (/ 255.0)",
        "input_scale": "[0, 1] float32",
        "input_mode": "individual_frames",
        "aggregation": "mean frame probabilities",
        "is_default": False
    },
    "cnn_lstm": {
        "id": "cnn_lstm",
        "name": "CNN-LSTM Spatio-Temporal Model",
        "model_dir": ARTIFACTS_DIR / "cnn_lstm",
        "model_file": Path(os.getenv("CNN_LSTM_MODEL_PATH", ARTIFACTS_DIR / "cnn_lstm" / "signbridge_cnn_lstm_best.keras")),
        "mapping_file": Path(os.getenv("CNN_LSTM_MAPPING_PATH", ARTIFACTS_DIR / "cnn_lstm" / "class_mapping.json")),
        "test_accuracy": 4.44,
        "architecture": "TimeDistributed Conv blocks + LSTM(64) sequence integrator -> Dense(76)",
        "tagline": "Spatio-temporal sequence network integrating all 33 frames",
        "input_shape": [None, 33, 112, 112, 3],
        "frame_count": 33,
        "image_size": 112,
        "color_space": "RGB",
        "normalization": "Normalized to [0, 1] (/ 255.0)",
        "input_scale": "[0, 1] float32",
        "input_mode": "frame_sequence",
        "aggregation": "sequence-level LSTM output (no frame averaging)",
        "is_default": False
    },
    "late_fusion": {
        "id": "late_fusion",
        "name": "Tri-Model Late Fusion Ensemble (Equal-Weight)",
        "model_dir": ARTIFACTS_DIR,
        "model_file": None,
        "mapping_file": ARTIFACTS_DIR / "mobilenetv2_frozen" / "class_mapping.json",
        "test_accuracy": 67.78,
        "architecture": "Equal-weight late-fusion probability average of MobileNetV2, Custom CNN, and CNN-LSTM",
        "tagline": "Tri-model late fusion ensemble combining all probability distributions",
        "input_shape": [None, 33, 224, 224, 3],
        "frame_count": 33,
        "image_size": 224,
        "color_space": "RGB",
        "normalization": "Model-specific branch normalization",
        "input_scale": "Hybrid [0, 255] and [0, 1]",
        "input_mode": "multi_branch",
        "aggregation": "equal-weight probability average: (P_mobilenet + P_custom + P_lstm) / 3",
        "is_default": False
    }
}

DEFAULT_MODEL_ID = "mobilenetv2"

# Model ID aliases mapping
MODEL_ALIASES = {
    "mobilenetv2": "mobilenetv2",
    "mobilenet-v2": "mobilenetv2",
    "mobilenet": "mobilenetv2",
    "custom_cnn": "custom_cnn",
    "custom-cnn": "custom_cnn",
    "cnn": "custom_cnn",
    "cnn_baseline": "custom_cnn",
    "cnn_lstm": "cnn_lstm",
    "cnn-lstm": "cnn_lstm",
    "lstm": "cnn_lstm",
    "late_fusion": "late_fusion",
    "late-fusion": "late_fusion",
    "fusion": "late_fusion",
    "ensemble": "late_fusion"
}


def normalize_model_id(model_id: Optional[str]) -> str:
    """Normalizes model identifier strings to standard keys."""
    if not model_id:
        return DEFAULT_MODEL_ID
    cleaned = model_id.strip().lower()
    return MODEL_ALIASES.get(cleaned, cleaned)


# Backwards compatibility aliases
DEFAULT_ARTIFACT_DIR = MODEL_REGISTRY["mobilenetv2"]["model_dir"]
MODEL_PATH = MODEL_REGISTRY["mobilenetv2"]["model_file"]
CLASS_MAPPING_PATH = MODEL_REGISTRY["mobilenetv2"]["mapping_file"]
IMAGE_SIZE = IMAGE_SIZE_DEFAULT

# Server configuration
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGINS: List[str] = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000,http://localhost:8001,http://127.0.0.1:8001"
    ).split(",")
    if origin.strip()
]
CORS_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
