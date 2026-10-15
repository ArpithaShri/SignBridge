import os
import csv
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel, Field

from app.lab_eval2.config import (
    EXPERIMENT_SUMMARY_PATH,
    TEST_COMPARISON_PATH,
    ROBUSTNESS_PATH,
    LATENCY_PATH,
    GENERALIZATION_GAP_PATH,
    PER_CLASS_BIAS_PATH,
    UNCERTAINTY_PATH,
    BASELINE_HISTORY_PATH,
    AUGMENTED_HISTORY_PATH,
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_VIDEO_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    NUM_CLASSES,
    IMAGE_SIZE,
    LATENT_DIM
)
from app.lab_eval2.inference import gan_cnn_engine

logger = logging.getLogger("signbridge.lab_eval2.router")

router = APIRouter(
    prefix="/api/v1/lab-eval2",
    tags=["Lab Evaluation 2 — GAN + CNN"]
)


def _read_csv_as_dicts(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for r in reader:
            parsed = {}
            for k, v in r.items():
                if v is None:
                    continue
                v_clean = v.strip()
                # Try int then float then keep str
                try:
                    if "." in v_clean:
                        parsed[k] = float(v_clean)
                    else:
                        parsed[k] = int(v_clean)
                except ValueError:
                    parsed[k] = v_clean
            rows.append(parsed)
        return rows


class GenerateRequest(BaseModel):
    class_identifier: Any = Field(..., description="Target sign class index (0..75) or name (e.g. 'afternoon')")
    seed: Optional[int] = Field(None, description="Optional random seed for reproducible synthesis")


@router.get("/metadata")
async def get_metadata():
    """Returns verified experiment metadata, class lists, and model status for Lab Eval 2."""
    classes = gan_cnn_engine.get_classes()
    status_dict = gan_cnn_engine.status()

    # Read summary json if available
    summary = {}
    if EXPERIMENT_SUMMARY_PATH.exists():
        try:
            with open(EXPERIMENT_SUMMARY_PATH, "r", encoding="utf-8") as f:
                summary = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read experiment_summary.json: {e}")

    return {
        "overview": {
            "title": "Lab Evaluation 2 — Conditional DCGAN + CNN for 76-Class Indian Sign Language",
            "experiment": "Frame-Level ISL Word Recognition with Generative Data Augmentation",
            "classes": classes,
            "num_classes": len(classes),
            "image_size": f"{IMAGE_SIZE}×{IMAGE_SIZE}×3",
            "latent_dim": LATENT_DIM,
            "frames_per_video": 5,
            "test_images": 900,
            "gan_epochs_completed": 100,
            "baseline_cnn_epochs": 44,
            "augmented_cnn_epochs": 31,
            "models": {
                "baseline": {
                    "name": "Baseline Custom CNN",
                    "architecture": "4-Block Conv2D + BatchNorm + MaxPool + GAP + Dense(128) + Dropout(0.4)",
                    "training_set": "Real video frames only (5 uniform frames/video)",
                    "clean_accuracy": 49.89,
                    "macro_precision": 54.10,
                    "macro_recall": 51.10,
                    "macro_f1": 49.08,
                    "mean_latency_ms": 4.16
                },
                "gan_augmented": {
                    "name": "DCGAN-Augmented Custom CNN",
                    "architecture": "Identical 4-Block Conv2D backbone trained on Real + 50% GAN frames",
                    "training_set": "Real frames + Class-conditioned DCGAN synthetic frames",
                    "clean_accuracy": 29.00,
                    "macro_precision": 35.31,
                    "macro_recall": 31.62,
                    "macro_f1": 29.36,
                    "mean_latency_ms": 3.23
                }
            },
            "scientific_conclusion": {
                "headline": "Baseline CNN Outperforms DCGAN + CNN on Clean Held-Out Test Set",
                "clean_accuracy_baseline": 49.89,
                "clean_accuracy_gan_augmented": 29.00,
                "summary": (
                    "The baseline CNN achieved 49.89% clean accuracy, whereas the GAN-augmented CNN achieved 29.00%. "
                    "Downsampling video frames to 64×64 pixels and training DCGAN on subtle finger gestures resulted in blurry "
                    "synthetic hand blobs that acted as label noise rather than reinforcing decision boundaries on clean test data. "
                    "However, under severe Gaussian noise (STD=0.1 and 0.2), the GAN-augmented CNN retained slightly higher relative accuracy."
                )
            }
        },
        "engine_status": status_dict,
        "summary": summary
    }


@router.get("/metrics")
async def get_metrics():
    """Returns all empirical test and training evaluation metrics parsed from actual experiment CSVs and JSONs."""
    test_comparison = _read_csv_as_dicts(TEST_COMPARISON_PATH)
    robustness = _read_csv_as_dicts(ROBUSTNESS_PATH)
    latency = _read_csv_as_dicts(LATENCY_PATH)
    generalization_gap = _read_csv_as_dicts(GENERALIZATION_GAP_PATH)
    per_class_bias = _read_csv_as_dicts(PER_CLASS_BIAS_PATH)
    uncertainty = _read_csv_as_dicts(UNCERTAINTY_PATH)

    baseline_history = {}
    if BASELINE_HISTORY_PATH.exists():
        try:
            with open(BASELINE_HISTORY_PATH, "r", encoding="utf-8") as f:
                baseline_history = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read baseline history: {e}")

    augmented_history = {}
    if AUGMENTED_HISTORY_PATH.exists():
        try:
            with open(AUGMENTED_HISTORY_PATH, "r", encoding="utf-8") as f:
                augmented_history = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read augmented history: {e}")

    return {
        "test_comparison": test_comparison,
        "robustness": robustness,
        "latency": latency,
        "generalization_gap": generalization_gap,
        "per_class_bias": per_class_bias,
        "uncertainty": uncertainty,
        "training_history": {
            "baseline": baseline_history,
            "augmented": augmented_history
        }
    }


@router.post("/predict")
async def predict_sample(
    file: UploadFile = File(...),
    model: str = Form("both")
):
    """
    Runs classification prediction on a single image frame (or video clip) using the trained 
    Baseline CNN and/or GAN-Augmented CNN models.
    """
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()

    is_image = ext in ALLOWED_IMAGE_EXTENSIONS
    is_video = ext in ALLOWED_VIDEO_EXTENSIONS

    if not is_image and not is_video:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported: {sorted(list(ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS))}"
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
        )

    try:
        results = gan_cnn_engine.predict(content, is_video=is_video, target_model=model)
        results["filename"] = filename
        results["success"] = True
        return results
    except Exception as e:
        logger.error(f"Inference error in Lab Eval 2 predict: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Inference failed: {str(e)}"
        )


@router.post("/generate")
async def generate_synthetic_image(payload: GenerateRequest):
    """
    Generates a 64x64 RGB synthetic image conditioned on the requested class 
    using the trained Conditional DCGAN Generator checkpoint.
    """
    try:
        result = gan_cnn_engine.generate(payload.class_identifier, seed=payload.seed)
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Generation error in Lab Eval 2: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Synthetic frame generation failed: {str(e)}"
        )
