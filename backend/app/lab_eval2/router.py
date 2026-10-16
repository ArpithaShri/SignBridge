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
    LATENT_DIM,
    CNN_LSTM_IMAGE_SIZE,
    CNN_LSTM_SEQUENCE_FRAMES,
    CNN_LSTM_BASELINE_SUMMARY_PATH,
    CNN_LSTM_MODEL_INFO_PATH,
    CNN_LSTM_REPORT_PATH,
    CNN_LSTM_TRAINING_HISTORY_PATH,
    CNN_LSTM_PIXEL_STATS_PATH,
    CNN_LSTM_SAMPLE_GRID_STATS_PATH
)
from app.lab_eval2.inference import gan_cnn_engine
from app.lab_eval2.inference_lstm import gan_cnn_lstm_engine
from app.lab_eval2.inference_mobilenetv2 import gan_mobilenetv2_engine

logger = logging.getLogger("signbridge.lab_eval2.router")

router = APIRouter(
    prefix="/api/v1/lab-eval2",
    tags=["Lab Evaluation 2 — Generative AI Research"]
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


# =========================================================================
# SECTION 1: GAN + CNN (Experiment 1) Endpoints
# =========================================================================

@router.get("/metadata")
async def get_metadata():
    """Returns verified experiment metadata, class lists, and model status for Lab Eval 2 GAN + CNN."""
    classes = gan_cnn_engine.get_classes()
    status_dict = gan_cnn_engine.status()

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
    """Returns all empirical test and training evaluation metrics for GAN + CNN."""
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


@router.post("/extract-frames")
async def extract_frames_only(
    video: UploadFile = File(...),
    strategy: str = Form("uniform"),
    max_frames: int = Form(5)
):
    """
    Extracts frames from an uploaded video clip, returning base64 thumbnails and timestamps.
    Used for the interactive frame extraction gallery in GAN + CNN Interactive Video Testing.
    """
    filename = video.filename or "unknown.mp4"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Supported: {sorted(list(ALLOWED_VIDEO_EXTENSIONS))}"
        )

    content = await video.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded video file is empty."
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Video exceeds limit of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
        )

    try:
        data = gan_cnn_engine.extract_video_frames_detailed(
            content,
            strategy=strategy,
            max_frames=max_frames
        )
        # Drop raw numpy tensors before returning JSON
        clean_frames = [
            {k: v for k, v in f.items() if not k.startswith("_")}
            for f in data["frames"]
        ]
        return {
            "success": True,
            "filename": filename,
            "metadata": data["metadata"],
            "frames": clean_frames
        }
    except Exception as e:
        logger.error(f"Frame extraction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Frame extraction failed: {str(e)}"
        )


@router.post("/video-infer")
async def video_infer(
    video: UploadFile = File(...),
    strategy: str = Form("uniform"),
    max_frames: int = Form(5),
    selected_indices: Optional[str] = Form(None)
):
    """
    Extracts video frames and runs simultaneous dual inference (Baseline CNN vs DCGAN-Augmented CNN)
    on each extracted frame. Returns frame-level predictions, agreement rate, and consensus distribution.
    """
    filename = video.filename or "unknown.mp4"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Supported: {sorted(list(ALLOWED_VIDEO_EXTENSIONS))}"
        )

    content = await video.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded video file is empty."
        )

    parsed_indices: Optional[List[int]] = None
    if selected_indices:
        try:
            if selected_indices.startswith("["):
                parsed_indices = json.loads(selected_indices)
            else:
                parsed_indices = [int(x.strip()) for x in selected_indices.split(",") if x.strip()]
        except Exception:
            parsed_indices = None

    try:
        result = gan_cnn_engine.predict_video_frame_level(
            content,
            strategy=strategy,
            max_frames=max_frames,
            selected_indices=parsed_indices
        )
        result["filename"] = filename
        result["success"] = True
        return result
    except Exception as e:
        logger.error(f"Video frame inference failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Video frame inference failed: {str(e)}"
        )


@router.post("/predict")
async def predict_sample(
    file: UploadFile = File(...),
    model: str = Form("both")
):
    """
    Single frame (or video fallback) inference for GAN + CNN.
    """
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()

    is_image = ext in ALLOWED_IMAGE_EXTENSIONS
    is_video = ext in ALLOWED_VIDEO_EXTENSIONS

    if not is_image and not is_video:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{ext}'. Supported: {sorted(list(ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS))}"
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    try:
        results = gan_cnn_engine.predict(content, is_video=is_video, target_model=model)
        results["filename"] = filename
        results["success"] = True
        return results
    except Exception as e:
        logger.error(f"Single prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Inference failed: {str(e)}"
        )


@router.post("/generate")
async def generate_synthetic_image(payload: GenerateRequest):
    """
    Synthesizes a 64x64 RGB frame using the 100-epoch DCGAN Generator.
    """
    try:
        return gan_cnn_engine.generate(payload.class_identifier, seed=payload.seed)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}"
        )


# =========================================================================
# SECTION 2: GAN + CNN-LSTM (Experiment 2) Endpoints
# =========================================================================

@router.get("/cnn-lstm/metadata")
async def get_cnn_lstm_metadata():
    """
    Returns verified research metadata for the GAN + CNN-LSTM experiment.
    Includes verified baseline CNN-LSTM test accuracy (4.44%), noise robustness data,
    and transparent status indicating the missing augmented CNN-LSTM classifier checkpoint.
    """
    gan_cnn_lstm_engine.load_models()
    classes = gan_cnn_lstm_engine.get_classes()
    status_dict = gan_cnn_lstm_engine.status()

    baseline_summary = {}
    if CNN_LSTM_BASELINE_SUMMARY_PATH.exists():
        try:
            with open(CNN_LSTM_BASELINE_SUMMARY_PATH, "r", encoding="utf-8") as f:
                baseline_summary = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read cnn_lstm_baseline_summary: {e}")

    model_info = {}
    if CNN_LSTM_MODEL_INFO_PATH.exists():
        try:
            with open(CNN_LSTM_MODEL_INFO_PATH, "r", encoding="utf-8") as f:
                model_info = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read cnn_lstm_model_info: {e}")

    pixel_stats = {}
    if CNN_LSTM_PIXEL_STATS_PATH.exists():
        try:
            with open(CNN_LSTM_PIXEL_STATS_PATH, "r", encoding="utf-8") as f:
                pixel_stats = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read pixel_stats: {e}")

    sample_grid_stats = _read_csv_as_dicts(CNN_LSTM_SAMPLE_GRID_STATS_PATH)

    # Classification report summary
    class_report = {}
    if CNN_LSTM_REPORT_PATH.exists():
        try:
            with open(CNN_LSTM_REPORT_PATH, "r", encoding="utf-8") as f:
                class_report = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read classification report: {e}")

    return {
        "overview": {
            "title": "Lab Evaluation 2 — Conditional DCGAN + CNN-LSTM for 76-Class Indian Sign Language",
            "experiment": "Spatio-Temporal Sequence ISL Word Recognition with Class-Conditioned DCGAN",
            "classes": classes,
            "num_classes": len(classes),
            "image_size": f"{IMAGE_SIZE}×{IMAGE_SIZE}×3 (DCGAN) / {CNN_LSTM_IMAGE_SIZE}×{CNN_LSTM_IMAGE_SIZE}×3 (CNN-LSTM)",
            "sequence_frames": 33,
            "latent_dim": LATENT_DIM,
            "training_images": 4030,
            "test_videos": 180,
            "models": {
                "baseline_cnn_lstm": {
                    "name": "Baseline CNN-LSTM (Real Data Only)",
                    "architecture": "TimeDistributed Conv Blocks + LSTM(64) Sequence Integrator -> Dense(76)",
                    "training_set": "Real video sequences only (33 uniform frames/video at 112×112)",
                    "clean_accuracy": 4.44,
                    "macro_f1": 0.0100,
                    "weighted_f1": 0.0097,
                    "status": "Verified & Active"
                },
                "conditional_dcgan": {
                    "name": "Class-Conditioned DCGAN Generator",
                    "architecture": "Learned Class Embedding + Dense + 4x Conv2DTranspose + Tanh -> 64×64 RGB",
                    "training_set": "4,030 extracted training frames conditioned on class 0..75",
                    "saved_epochs": 50,
                    "status": "Verified & Active"
                },
                "gan_augmented_cnn_lstm": {
                    "name": "GAN-Augmented CNN-LSTM",
                    "architecture": "Spatio-temporal sequence network trained on Real + Generatively Augmented Sequences",
                    "status": "Awaiting Checkpoint / Not Provided in Package",
                    "clean_accuracy": None,
                    "note": (
                        "The teammate package implements a 2D class-conditional DCGAN (generating 64×64 frames) and provides "
                        "evaluation data for the baseline real-data CNN-LSTM, but does not include a trained GAN-augmented CNN-LSTM "
                        "classifier checkpoint. Per project instructions, zero metrics are fabricated."
                    )
                }
            },
            "scientific_findings": {
                "headline": "Temporal Sequence Modeling Requires Spatio-Temporal Generation",
                "clean_accuracy_baseline": 4.44,
                "summary": (
                    "The baseline CNN-LSTM achieved 4.44% accuracy across 180 test videos covering 76 classes. "
                    "The teammate's DCGAN synthesizes individual 64×64 spatial frames without temporal sequence continuity. "
                    "Because CNN-LSTM requires 33 temporally ordered 112×112 frames, isolated 2D DCGAN frames cannot be directly "
                    "injected into sequence training without temporal trajectory synthesis or video-level generative models."
                )
            }
        },
        "baseline_summary": baseline_summary,
        "model_info": model_info,
        "pixel_stats": pixel_stats,
        "sample_grid_stats": sample_grid_stats,
        "classification_report": class_report,
        "engine_status": status_dict
    }


@router.post("/cnn-lstm/predict-video")
async def predict_cnn_lstm_video(video: UploadFile = File(...)):
    """
    Runs authentic sequence inference using the Baseline CNN-LSTM model on an uploaded video clip.
    Extracts 33 frames, resizes to 112x112 RGB, scales to [0, 1], and evaluates spatio-temporal dynamics.
    """
    filename = video.filename or "unknown.mp4"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Supported: {sorted(list(ALLOWED_VIDEO_EXTENSIONS))}"
        )

    content = await video.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded video file is empty.")

    try:
        results = gan_cnn_lstm_engine.predict_video(content)
        results["filename"] = filename
        results["success"] = True
        return results
    except Exception as e:
        logger.error(f"CNN-LSTM sequence prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"CNN-LSTM inference failed: {str(e)}"
        )


@router.post("/cnn-lstm/generate")
async def generate_cnn_lstm_image(payload: GenerateRequest):
    """
    Generates a 64x64 synthetic sign image using the teammate's Conditional DCGAN Generator.
    """
    try:
        return gan_cnn_lstm_engine.generate(payload.class_identifier, seed=payload.seed)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"CNN-LSTM generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}"
        )


@router.get("/cnn-lstm/history")
async def get_cnn_lstm_history():
    """
    Returns the 50-epoch loss history for the class-conditional DCGAN.
    """
    history = _read_csv_as_dicts(CNN_LSTM_TRAINING_HISTORY_PATH)
    return {
        "success": True,
        "total_epochs": len(history),
        "history": history
    }


# =========================================================================
# SECTION 3: GAN + MobileNetV2 (Experiment 3) Endpoints
# =========================================================================

@router.get("/mobilenetv2/metadata")
async def get_mobilenetv2_metadata():
    """
    Returns verified research metadata for the GAN + MobileNetV2 experiment.
    Includes dataset split counts (train/val/test by video), 3-seed evaluation results,
    classification reports, confusion matrices, latency benchmarks, and robustness curves.
    """
    gan_mobilenetv2_engine.load_models()
    return gan_mobilenetv2_engine.get_metadata()


@router.post("/mobilenetv2/predict-image")
async def predict_mobilenetv2_image(file: UploadFile = File(...)):
    """
    Runs dual inference on a static frame image using both Baseline MobileNetV2 and
    GAN-Augmented MobileNetV2 models.
    """
    filename = file.filename or "unknown.png"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Supported: {sorted(list(ALLOWED_IMAGE_EXTENSIONS))}"
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    try:
        results = gan_mobilenetv2_engine.predict_image(content)
        results["filename"] = filename
        results["success"] = True
        return results
    except Exception as e:
        logger.error(f"MobileNetV2 image prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Inference failed: {str(e)}"
        )


@router.post("/mobilenetv2/predict-video")
async def predict_mobilenetv2_video(
    video: UploadFile = File(...),
    n_frames: int = Form(8)
):
    """
    Runs video inference by extracting n evenly spaced frames (default 8, matching evaluation setup),
    running dual inference per frame, and pooling probabilities by mean.
    """
    filename = video.filename or "unknown.mp4"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Supported: {sorted(list(ALLOWED_VIDEO_EXTENSIONS))}"
        )

    content = await video.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded video file is empty.")

    try:
        results = gan_mobilenetv2_engine.predict_video(content, n_frames=n_frames)
        results["filename"] = filename
        results["success"] = True
        return results
    except Exception as e:
        logger.error(f"MobileNetV2 video prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Video prediction failed: {str(e)}"
        )


@router.post("/mobilenetv2/generate")
async def generate_mobilenetv2_image(payload: GenerateRequest):
    """
    Synthesizes a 64x64 sign image for one of the 5 classes using the teammate's DCGAN generator.
    """
    try:
        return gan_mobilenetv2_engine.generate(payload.class_identifier, seed=payload.seed)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"MobileNetV2 generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}"
        )

