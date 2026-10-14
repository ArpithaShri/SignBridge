import os
from pathlib import Path
from typing import Dict, List, Any

# Root backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Base directory for Lab Evaluation 2 artifacts
# Defaults to backend/artifacts/lab_eval2, with optional env var override
LAB_EVAL2_ARTIFACTS_DIR = Path(
    os.getenv("LAB_EVAL2_ARTIFACTS_DIR", BASE_DIR / "artifacts" / "lab_eval2")
)

# Model Artifact Paths
BASELINE_CNN_PATH = LAB_EVAL2_ARTIFACTS_DIR / "cnn_baseline.keras"
GAN_AUGMENTED_CNN_PATH = LAB_EVAL2_ARTIFACTS_DIR / "cnn_gan_augmented.keras"
GENERATOR_PATH = LAB_EVAL2_ARTIFACTS_DIR / "conditional_generator.keras"

# Note: conditional_discriminator.keras is NEVER loaded as a classifier
DISCRIMINATOR_PATH = LAB_EVAL2_ARTIFACTS_DIR / "conditional_discriminator.keras"

# Metadata and Metrics Files
CLASS_MAPPING_PATH = LAB_EVAL2_ARTIFACTS_DIR / "class_mapping.json"
REPORT_PATH = LAB_EVAL2_ARTIFACTS_DIR / "lab_eval2_experiment_report.json"
CLEAN_METRICS_PATH = LAB_EVAL2_ARTIFACTS_DIR / "clean_test_metrics.csv"
FINAL_COMPARISON_PATH = LAB_EVAL2_ARTIFACTS_DIR / "final_model_comparison.csv"
LATENCY_METRICS_PATH = LAB_EVAL2_ARTIFACTS_DIR / "latency_metrics.csv"
ROBUSTNESS_METRICS_PATH = LAB_EVAL2_ARTIFACTS_DIR / "robustness_metrics.csv"

# Image and Plots Directories
PLOTS_DIR = LAB_EVAL2_ARTIFACTS_DIR / "plots"
GALLERY_DIR = LAB_EVAL2_ARTIFACTS_DIR / "gallery"
GALLERY_INDEX_PATH = GALLERY_DIR / "samples_index.json"

# Core Experiment Constants
IMAGE_SIZE = 64
LATENT_DIM = 100
SELECTED_CLASSES: List[str] = ["small", "short", "bad", "big", "fast"]
CLASS_TO_IDX: Dict[str, int] = {
    "small": 0,
    "short": 1,
    "bad": 2,
    "big": 3,
    "fast": 4
}
IDX_TO_CLASS: Dict[int, str] = {v: k for k, v in CLASS_TO_IDX.items()}
NUM_CLASSES = len(SELECTED_CLASSES)

# Dataset & Architecture Overview Stats
EXPERIMENT_OVERVIEW: Dict[str, Any] = {
    "title": "Lab Evaluation 2 — Conditional DCGAN + CNN for ISL Image Classification",
    "classes": SELECTED_CLASSES,
    "num_classes": NUM_CLASSES,
    "image_size": IMAGE_SIZE,
    "latent_dim": LATENT_DIM,
    "frames_per_video": 8,
    "real_train_images": 616,
    "synthetic_train_images": 600,
    "baseline_train_images": 616,
    "augmented_train_images": 1216,
    "val_images": 120,
    "test_images": 120,
    "gan_epochs": 20,
    "cnn_epochs": 30,
    "models": {
        "baseline_cnn": {
            "id": "baseline",
            "name": "Baseline CNN",
            "training_samples": 616,
            "training_composition": "616 Real Frames only",
            "clean_accuracy": 20.0,
            "architecture": "3 Conv2D blocks (32, 64, 128) + MaxPool + GlobalAvgPool + Dense(128) -> Dense(5, Softmax)",
            "normalization": "Normalized to [0, 1] (/ 255.0)"
        },
        "gan_augmented_cnn": {
            "id": "gan_augmented",
            "name": "GAN-Augmented CNN",
            "training_samples": 1216,
            "training_composition": "616 Real Frames + 600 Synthetic Images",
            "clean_accuracy": 20.0,
            "architecture": "Identical 3 Conv2D blocks (32, 64, 128) + MaxPool + GlobalAvgPool + Dense(128) -> Dense(5, Softmax)",
            "normalization": "Normalized to [0, 1] (/ 255.0)"
        }
    },
    "scientific_finding": {
        "clean_accuracy_baseline": 20.0,
        "clean_accuracy_gan_augmented": 20.0,
        "mode_collapse_observed": True,
        "collapsed_target_class": "small",
        "key_takeaway": (
            "Both classifiers achieved 20.0% clean test accuracy and exhibited single-class prediction collapse "
            "(predicting class 'small' for all 120 test frames). GAN augmentation did NOT improve clean test accuracy "
            "in this run. Synthetic DCGAN samples at 64x64 resolution introduced artifacts and did not overcome "
            "the severe representation bottleneck."
        )
    }
}
