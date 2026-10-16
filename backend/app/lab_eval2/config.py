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

# -------------------------------------------------------------
# GAN + CNN-LSTM Artifacts & Configuration
# -------------------------------------------------------------
GAN_CNN_LSTM_ARTIFACTS_DIR = Path(
    os.getenv("GAN_CNN_LSTM_ARTIFACTS_DIR", BASE_DIR / "artifacts" / "lab_eval2" / "gan_cnn_lstm")
)

CNN_LSTM_BASELINE_MODEL_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "signbridge_cnn_lstm_best.keras"
CNN_LSTM_AUGMENTED_MODEL_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "gan_augmented_cnn_lstm_best.keras"
CNN_LSTM_GENERATOR_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "conditional_generator.keras"
CNN_LSTM_DISCRIMINATOR_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "conditional_discriminator.keras"
CNN_LSTM_MAPPING_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "class_mapping.json"
CNN_LSTM_INFERENCE_CONFIG_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "inference_config.json"
CNN_LSTM_TRAINING_CONFIG_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "training_config.json"
CNN_LSTM_BASELINE_SUMMARY_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "cnn_lstm_baseline_summary.json"
CNN_LSTM_MODEL_INFO_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "cnn_lstm_model_info.json"
CNN_LSTM_REPORT_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "cnn_lstm_test_classification_report.json"
CNN_LSTM_CONFUSION_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "cnn_lstm_test_confusion_matrix.csv"
CNN_LSTM_PREDICTIONS_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "cnn_lstm_test_predictions.csv"
CNN_LSTM_PIXEL_STATS_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "pixel_statistics_summary.json"
CNN_LSTM_SAMPLE_GRID_STATS_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "sample_grid_pixel_statistics.csv"
CNN_LSTM_EXPERIMENT_REPORT_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "conditional_gan_experiment_report.md"
CNN_LSTM_EVALUATION_SUMMARY_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "evaluation_summary.json"
CNN_LSTM_TRAINING_HISTORY_PATH = GAN_CNN_LSTM_ARTIFACTS_DIR / "training_history.csv"

CNN_LSTM_SEQUENCE_FRAMES = 33
CNN_LSTM_IMAGE_SIZE = 112

# -------------------------------------------------------------
# GAN + MobileNetV2 Artifacts & Configuration
# -------------------------------------------------------------
GAN_MOBILENETV2_ARTIFACTS_DIR = Path(
    os.getenv("GAN_MOBILENETV2_ARTIFACTS_DIR", BASE_DIR / "artifacts" / "lab_eval2" / "gan_mobilenetv2")
)

MOBILENETV2_BASELINE_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "mobilenetv2_baseline.keras"
MOBILENETV2_AUGMENTED_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "mobilenetv2_gan_augmented.keras"
MOBILENETV2_GENERATOR_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "conditional_generator.keras"

MOBILENETV2_CLASS_MAPPING_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "class_mapping.json"
MOBILENETV2_RUN_CONFIG_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "run_config.json"
MOBILENETV2_DATASET_SPLITS_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "dataset_split_counts.json"
MOBILENETV2_TRAINING_DETAILS_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "training_details.json"
MOBILENETV2_EVALUATION_RESULTS_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "evaluation_results.json"
MOBILENETV2_CLASSIFICATION_REPORTS_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "classification_reports.json"
MOBILENETV2_CONFUSION_MATRICES_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "confusion_matrices.json"
MOBILENETV2_LATENCY_CSV_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "latency.csv"
MOBILENETV2_ROBUSTNESS_CSV_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "robustness.csv"
MOBILENETV2_PER_CLASS_METRICS_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "per_class_metrics_pooled.csv"
MOBILENETV2_PER_SEED_RESULTS_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "per_seed_results.csv"
MOBILENETV2_SUMMARY_MEAN_STD_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "summary_mean_std.csv"
MOBILENETV2_GAN_LOSSES_PATH = GAN_MOBILENETV2_ARTIFACTS_DIR / "gan_training_losses.csv"

MOBILENETV2_INPUT_SIZE = 64
MOBILENETV2_INTERNAL_SIZE = 128
MOBILENETV2_NUM_CLASSES = 5
MOBILENETV2_CLASSES = ["bad", "big", "fast", "short", "small"]
MOBILENETV2_GAN_LABEL_ORDER = ["small", "short", "bad", "big", "fast"]
MOBILENETV2_FRAMES_PER_VIDEO = 8


