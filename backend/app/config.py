import os
from pathlib import Path
from typing import List

# Base directory of the backend package
BASE_DIR = Path(__file__).resolve().parent.parent

# Artifact paths
DEFAULT_ARTIFACT_DIR = BASE_DIR / "artifacts" / "mobilenetv2_frozen"
MODEL_PATH = Path(os.getenv("MOBILENET_MODEL_PATH", DEFAULT_ARTIFACT_DIR / "mobilenetv2_frozen_best.keras"))
CLASS_MAPPING_PATH = Path(os.getenv("CLASS_MAPPING_PATH", DEFAULT_ARTIFACT_DIR / "class_mapping.json"))

# Preprocessing parameters (strictly matching evaluation protocol)
FRAMES_PER_VIDEO = int(os.getenv("FRAMES_PER_VIDEO", "33"))
IMAGE_SIZE = int(os.getenv("IMAGE_SIZE", "224"))
MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_BYTES", str(100 * 1024 * 1024))) # 100 MB
ALLOWED_EXTENSIONS = {".mov", ".mp4", ".avi"}

# Server configuration
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGINS: List[str] = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]
