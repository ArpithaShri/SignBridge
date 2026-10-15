import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
LAB_EVAL2_ARTIFACTS_DIR = Path(
    os.getenv("LAB_EVAL2_ARTIFACTS_DIR", BASE_DIR / "artifacts" / "lab_eval2" / "gan_cnn")
)

BASELINE_CNN_PATH = LAB_EVAL2_ARTIFACTS_DIR / "baseline_cnn_best.keras"
GAN_AUGMENTED_CNN_PATH = LAB_EVAL2_ARTIFACTS_DIR / "gan_augmented_cnn_best.keras"
GENERATOR_PATH = LAB_EVAL2_ARTIFACTS_DIR / "generator_epoch_100.keras"
CLASS_MAPPING_PATH = LAB_EVAL2_ARTIFACTS_DIR / "class_mapping.json"
EXPERIMENT_SUMMARY_PATH = LAB_EVAL2_ARTIFACTS_DIR / "experiment_summary.json"
TEST_COMPARISON_PATH = LAB_EVAL2_ARTIFACTS_DIR / "test_comparison_results.csv"
ROBUSTNESS_PATH = LAB_EVAL2_ARTIFACTS_DIR / "robustness_results.csv"
LATENCY_PATH = LAB_EVAL2_ARTIFACTS_DIR / "latency_results.csv"
GENERALIZATION_GAP_PATH = LAB_EVAL2_ARTIFACTS_DIR / "generalization_gap.csv"
PER_CLASS_BIAS_PATH = LAB_EVAL2_ARTIFACTS_DIR / "per_class_bias_analysis.csv"
UNCERTAINTY_PATH = LAB_EVAL2_ARTIFACTS_DIR / "uncertainty_summary.csv"
BASELINE_HISTORY_PATH = LAB_EVAL2_ARTIFACTS_DIR / "baseline_history.json"
AUGMENTED_HISTORY_PATH = LAB_EVAL2_ARTIFACTS_DIR / "augmented_history.json"

IMAGE_SIZE = 64
CHANNELS = 3
LATENT_DIM = 100
NUM_CLASSES = 76

# Allowed upload extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50MB
