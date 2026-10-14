import csv
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, File, UploadFile, Form, Query, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from app.lab_eval2.config import (
    EXPERIMENT_OVERVIEW,
    SELECTED_CLASSES,
    CLASS_TO_IDX,
    REPORT_PATH,
    CLEAN_METRICS_PATH,
    FINAL_COMPARISON_PATH,
    LATENCY_METRICS_PATH,
    ROBUSTNESS_METRICS_PATH,
    PLOTS_DIR,
    GALLERY_DIR,
    GALLERY_INDEX_PATH
)
from app.lab_eval2.inference import lab_eval2_engine

logger = logging.getLogger("signbridge.lab_eval2.router")

router = APIRouter(
    prefix="/api/v1/lab-eval2",
    tags=["Lab Evaluation 2 — Conditional DCGAN + CNN"]
)

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit for single image upload


class GenerateRequest(BaseModel):
    class_name: str = Field(..., description="Target class name: small, short, bad, big, fast")
    seed: Optional[int] = Field(None, description="Optional random seed for reproducible noise generation")


def _read_csv_as_dicts(csv_path: Path) -> List[Dict[str, Any]]:
    """Helper to safely read a CSV into a list of row dictionaries."""
    if not csv_path.exists():
        return []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            parsed_row = {}
            for k, v in row.items():
                if v is None:
                    parsed_row[k] = ""
                    continue
                # Try parsing numeric values
                v_clean = v.strip()
                try:
                    if "." in v_clean:
                        parsed_row[k] = float(v_clean)
                    else:
                        parsed_row[k] = int(v_clean)
                except ValueError:
                    parsed_row[k] = v_clean
            rows.append(parsed_row)
        return rows


@router.get("/metadata")
async def get_metadata():
    """Returns overview metadata, dataset split counts, class mappings, and report limitations."""
    report_data = {}
    if REPORT_PATH.exists():
        try:
            with open(REPORT_PATH, "r", encoding="utf-8") as f:
                report_data = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read report file: {e}")

    engine_status = lab_eval2_engine.status()

    return {
        "overview": EXPERIMENT_OVERVIEW,
        "report": report_data,
        "engine_status": engine_status
    }


@router.get("/metrics")
async def get_metrics():
    """
    Returns authentic experimental results parsed directly from the exported CSV/JSON artifacts.
    Note: Both models scored 20.0% clean test accuracy and collapsed onto class 'small'.
    """
    clean_metrics = _read_csv_as_dicts(CLEAN_METRICS_PATH)
    final_comparison = _read_csv_as_dicts(FINAL_COMPARISON_PATH)
    latency_metrics = _read_csv_as_dicts(LATENCY_METRICS_PATH)
    robustness_metrics = _read_csv_as_dicts(ROBUSTNESS_METRICS_PATH)

    # Detailed per-class breakdown from Colab evaluation
    per_class_breakdown = [
        {"class": "small", "support": 24, "baseline_precision": 20.0, "baseline_recall": 100.0, "baseline_f1": 33.33, "gan_precision": 20.0, "gan_recall": 100.0, "gan_f1": 33.33},
        {"class": "short", "support": 24, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1": 0.0, "gan_precision": 0.0, "gan_recall": 0.0, "gan_f1": 0.0},
        {"class": "bad", "support": 24, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1": 0.0, "gan_precision": 0.0, "gan_recall": 0.0, "gan_f1": 0.0},
        {"class": "big", "support": 24, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1": 0.0, "gan_precision": 0.0, "gan_recall": 0.0, "gan_f1": 0.0},
        {"class": "fast", "support": 24, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1": 0.0, "gan_precision": 0.0, "gan_recall": 0.0, "gan_f1": 0.0},
    ]

    return {
        "clean_test_metrics": clean_metrics,
        "final_model_comparison": final_comparison,
        "latency_metrics": latency_metrics,
        "robustness_metrics": robustness_metrics,
        "per_class_breakdown": per_class_breakdown,
        "scientific_conclusion": {
            "clean_accuracy": 20.0,
            "mode_collapse": True,
            "collapsed_class": "small",
            "gan_augmented_better": False,
            "summary": (
                "Empirical evaluation shows both Baseline CNN and GAN-augmented CNN achieved 20.0% clean test accuracy, "
                "which matches random chance for 5 balanced classes. Both networks collapsed entirely into predicting class 'small' "
                "(120/120 predictions). Consequently, GAN data augmentation did not provide a statistically significant accuracy or "
                "robustness benefit over the baseline."
            )
        }
    }


@router.get("/gallery")
async def get_gallery(
    class_filter: Optional[str] = Query(None, description="Optional class name filter: small, short, bad, big, fast"),
    type_filter: Optional[str] = Query(None, description="Optional type filter: synthetic or real")
):
    """Returns sample gallery items with safe URLs for display."""
    items = []
    if GALLERY_INDEX_PATH.exists():
        try:
            with open(GALLERY_INDEX_PATH, "r", encoding="utf-8") as f:
                items = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read gallery index: {e}")

    # Add URL property to each item
    for item in items:
        item["url"] = f"/api/v1/lab-eval2/artifact-image/gallery/{item['filename']}"

    # Apply optional filters
    if class_filter:
        c_clean = class_filter.strip().lower()
        items = [i for i in items if i.get("class_name", "").lower() == c_clean]
    if type_filter:
        t_clean = type_filter.strip().lower()
        items = [i for i in items if i.get("type", "").lower() == t_clean]

    return {
        "count": len(items),
        "classes": SELECTED_CLASSES,
        "items": items
    }


@router.get("/plots")
async def get_plots():
    """Returns list of authentic plots extracted directly from the experiment notebook outputs."""
    plot_definitions = [
        {
            "id": "baseline_confusion_matrix",
            "filename": "baseline_cnn_confusion_matrix.png",
            "title": "Baseline CNN Confusion Matrix",
            "description": "Clean test frames (120 total). Shows complete collapse onto class 'small' (24/24 correct on small, 0 on all others).",
            "category": "evaluation"
        },
        {
            "id": "gan_augmented_confusion_matrix",
            "filename": "gan_augmented_cnn_confusion_matrix.png",
            "title": "GAN-Augmented CNN Confusion Matrix",
            "description": "Clean test frames (120 total). Exhibits identical single-class collapse onto class 'small'.",
            "category": "evaluation"
        },
        {
            "id": "training_curves_accuracy",
            "filename": "training_curves_accuracy.png",
            "title": "Training & Validation Accuracy Curves",
            "description": "Accuracy progression over 30 epochs for Baseline CNN vs GAN-augmented CNN.",
            "category": "training"
        },
        {
            "id": "training_curves_loss",
            "filename": "training_curves_loss.png",
            "title": "Training & Validation Loss Curves",
            "description": "Sparse categorical cross-entropy loss progression over 30 epochs.",
            "category": "training"
        },
        {
            "id": "dcgan_training_loss",
            "filename": "dcgan_training_loss.png",
            "title": "Conditional DCGAN Loss Progression",
            "description": "Generator loss vs Discriminator loss over 20 epochs of adversarial training.",
            "category": "gan"
        },
        {
            "id": "robustness_comparison",
            "filename": "robustness_comparison.png",
            "title": "Robustness Evaluation Across Perturbations",
            "description": "Performance under Clean, Brightness Reduction (0.6x), Gaussian Noise (sigma=0.08), and Blur (5x5).",
            "category": "robustness"
        },
        {
            "id": "real_samples_grid",
            "filename": "real_training_samples_grid.png",
            "title": "Real Training Frames Grid (5 Classes)",
            "description": "Ground truth frame samples across 'small', 'short', 'bad', 'big', and 'fast'.",
            "category": "samples"
        },
        {
            "id": "dcgan_generated_grid",
            "filename": "dcgan_generated_grid.png",
            "title": "Conditional DCGAN 5x5 Synthetic Grid",
            "description": "Class-conditioned synthetic frames synthesized during the Colab experiment.",
            "category": "samples"
        },
        {
            "id": "baseline_predictions",
            "filename": "baseline_cnn_predictions.png",
            "title": "Baseline CNN Qualitative Predictions",
            "description": "Sample test frame predictions with reported confidences (~0.20-0.21).",
            "category": "qualitative"
        },
        {
            "id": "gan_predictions",
            "filename": "gan_augmented_cnn_predictions.png",
            "title": "GAN-Augmented CNN Qualitative Predictions",
            "description": "Sample test frame predictions with reported confidences (~0.20-0.21).",
            "category": "qualitative"
        }
    ]

    for p in plot_definitions:
        p["url"] = f"/api/v1/lab-eval2/artifact-image/plots/{p['filename']}"

    return {"plots": plot_definitions}


@router.get("/artifact-image/{category}/{filename}")
async def get_artifact_image(category: str, filename: str):
    """
    Secure file delivery endpoint for exported plots and gallery images.
    Implements strict directory whitelist and path traversal prevention.
    """
    clean_cat = category.strip().lower()
    if clean_cat == "plots":
        base_dir = PLOTS_DIR
    elif clean_cat == "gallery":
        base_dir = GALLERY_DIR
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image category. Allowed: 'plots', 'gallery'."
        )

    # Sanitize filename (prevent directory traversal)
    clean_filename = Path(filename).name
    target_path = (base_dir / clean_filename).resolve()

    # Security check: ensure target is strictly inside base_dir
    try:
        target_path.relative_to(base_dir.resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Path traversal detected."
        )

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image file '{clean_filename}' not found."
        )

    ext = target_path.suffix.lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg"
    return FileResponse(path=str(target_path), media_type=media_type)


@router.post("/predict")
async def predict_lab_eval2(
    image: UploadFile = File(...),
    model: Optional[str] = Form("both"),
    model_query: Optional[str] = Query(None, alias="model")
):
    """
    Executes single-image inference using 64x64 Baseline CNN or GAN-Augmented CNN.
    Input image is resized to 64x64 RGB and normalized to [0, 1].
    """
    if not image.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload."
        )

    ext = Path(image.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Allowed: {sorted(list(ALLOWED_IMAGE_EXTENSIONS))}"
        )

    # Read image bytes with size validation
    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty."
        )
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded image exceeds maximum size of {MAX_IMAGE_SIZE_BYTES // (1024*1024)} MB."
        )

    target_model = model or model_query or "both"

    try:
        results = lab_eval2_engine.predict(image_bytes, model_type=target_model)
        results["filename"] = image.filename
        results["success"] = True
        return results
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Inference error on {image.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(e)}"
        )


@router.post("/generate")
async def generate_lab_eval2_image(payload: GenerateRequest):
    """
    Generates a class-conditioned 64x64 RGB synthetic image using the Conditional DCGAN Generator.
    Conditioned on 100-dim Gaussian latent noise and class label.
    """
    clean_cls = payload.class_name.strip().lower()
    if clean_cls not in CLASS_TO_IDX:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid class '{payload.class_name}'. Supported options: {SELECTED_CLASSES}"
        )

    try:
        gen_result = lab_eval2_engine.generate(clean_cls, seed=payload.seed)
        return gen_result
    except Exception as e:
        logger.error(f"Generation error for class {clean_cls}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image generation failed: {str(e)}"
        )
