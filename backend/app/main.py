import os
import shutil
import tempfile
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import (
    CORS_ORIGINS,
    CORS_ORIGIN_REGEX,
    MAX_FILE_SIZE_BYTES,
    ALLOWED_EXTENSIONS,
    FRAMES_PER_VIDEO,
    MODEL_REGISTRY,
    DEFAULT_MODEL_ID,
    normalize_model_id
)
from app.preprocessing import preprocess_for_model
from app.inference import engine
from app.lab_eval2.router import router as lab_eval2_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("signbridge.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Pre-load available models once
    logger.info("Initializing SignBridge Multi-Model Backend...")
    try:
        load_statuses = engine.load_all()
        logger.info(f"Model initialization statuses: {load_statuses}")
    except Exception as e:
        logger.error(f"Error initializing models at startup: {e}")

    try:
        from app.lab_eval2.inference import lab_eval2_engine
        eval2_statuses = lab_eval2_engine.load_models()
        logger.info(f"LabEval2 model initialization statuses: {eval2_statuses}")
    except Exception as e:
        logger.warning(f"LabEval2 models not preloaded at startup: {e}")

    yield
    # Shutdown
    logger.info("SignBridge backend shutting down.")


app = FastAPI(
    title="SignBridge ISL Recognition API",
    description=(
        "Production inference API for 76 Indian Sign Language word classes. "
        "Supports MobileNetV2 (Frozen Backbone, 67.78% Acc), Custom 2D CNN (5.00% Acc), "
        "and CNN-LSTM Spatio-Temporal Model (4.44% Acc). "
        "Includes Lab Evaluation 2 Conditional DCGAN + CNN Module."
    ),
    version="1.2.0",
    lifespan=lifespan
)

# CORS middleware for local Vite frontend across all ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Lab Evaluation 2 module router
app.include_router(lab_eval2_router)


@app.get("/")
async def root():
    return {
        "service": "SignBridge ISL Recognition Backend",
        "version": "1.1.0",
        "default_model": DEFAULT_MODEL_ID,
        "supported_models": [
            {
                "id": k,
                "name": v["name"],
                "test_accuracy": v["test_accuracy"],
                "loaded": engine.is_model_loaded(k)
            }
            for k, v in MODEL_REGISTRY.items()
        ],
        "docs_url": "/docs",
        "health_url": "/api/v1/health"
    }


@app.get("/api/v1/health")
async def health_check():
    loaded_map = {
        key: engine.is_model_loaded(key)
        for key in MODEL_REGISTRY
    }
    return {
        "status": "healthy",
        # Backwards compatible flags
        "model_loaded": engine.is_model_loaded(DEFAULT_MODEL_ID),
        "classes_count": engine.num_classes,
        "default_model": DEFAULT_MODEL_ID,
        "models": loaded_map,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/api/v1/model-info")
async def model_info(model: Optional[str] = Query(None)):
    if model:
        target_key = normalize_model_id(model)
        if target_key not in MODEL_REGISTRY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown model '{model}'. Supported options: {list(MODEL_REGISTRY.keys())}"
            )
        cfg = MODEL_REGISTRY[target_key]

        if target_key == "late_fusion":
            return {
                "model_id": "late_fusion",
                "name": cfg["name"],
                "architecture": cfg["architecture"],
                "tagline": cfg["tagline"],
                "offline_test_accuracy": cfg["test_accuracy"],
                "input_shape": [None, 33, 224, 224, 3],
                "output_shape": [None, 76],
                "num_classes": engine.num_classes or 76,
                "preprocessing": {
                    "sampling_frames": cfg["frame_count"],
                    "target_resolution": "Multi-scale (224x224 & 112x112)",
                    "color_space": cfg["color_space"],
                    "normalization": cfg["normalization"],
                    "input_scale": cfg["input_scale"],
                    "aggregation": cfg["aggregation"]
                }
            }

        is_ready = engine.is_model_loaded(target_key)
        if not is_ready:
            try:
                engine.load_model(target_key)
                is_ready = True
            except Exception as e:
                return JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    content={
                        "error": f"Model '{cfg['name']}' is not available: {str(e)}",
                        "model_id": target_key,
                        "expected_path": str(cfg["model_file"])
                    }
                )

        model_inst = engine.models[target_key]
        return {
            "model_id": target_key,
            "name": cfg["name"],
            "architecture": cfg["architecture"],
            "tagline": cfg["tagline"],
            "offline_test_accuracy": cfg["test_accuracy"],
            "input_shape": list(model_inst.input_shape),
            "output_shape": list(model_inst.output_shape),
            "num_classes": engine.num_classes,
            "preprocessing": {
                "sampling_frames": cfg["frame_count"],
                "target_resolution": f"{cfg['image_size']}x{cfg['image_size']}",
                "color_space": cfg["color_space"],
                "normalization": cfg["normalization"],
                "input_scale": cfg["input_scale"],
                "aggregation": cfg["aggregation"]
            }
        }

    # Return summary of all models
    return {
        "default_model": DEFAULT_MODEL_ID,
        "num_classes": engine.num_classes,
        "models": [
            {
                "id": k,
                "name": v["name"],
                "test_accuracy": v["test_accuracy"],
                "architecture": v["architecture"],
                "tagline": v["tagline"],
                "loaded": engine.is_model_loaded(k),
                "input_mode": v["input_mode"],
                "resolution": f"{v['image_size']}x{v['image_size']}"
            }
            for k, v in MODEL_REGISTRY.items()
        ]
    }


@app.post("/api/v1/recognize")
async def recognize_video(
    video: UploadFile = File(...),
    model: Optional[str] = Form(None),
    model_query: Optional[str] = Query(None, alias="model")
):
    # 1. Resolve requested model identifier (Form parameter takes precedence, then Query, then default)
    requested_model = model or model_query or DEFAULT_MODEL_ID
    target_key = normalize_model_id(requested_model)

    if target_key not in MODEL_REGISTRY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unknown model '{requested_model}'. "
                f"Supported models: {list(MODEL_REGISTRY.keys())}"
            )
        )

    # 2. Ensure target model is loaded
    if not engine.is_model_loaded(target_key):
        try:
            engine.load_model(target_key)
        except Exception as e:
            cfg = MODEL_REGISTRY[target_key]
            logger.error(f"Cannot load requested model '{target_key}': {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"Selected model '{cfg['name']}' is not available. "
                    f"Ensure model weights exist at {cfg['model_file']}."
                )
            )

    # 3. Validate filename and extension
    if not video.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload."
        )

    ext = Path(video.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Allowed formats: {sorted(list(ALLOWED_EXTENSIONS))}"
        )

    # 4. Stream upload to a temporary file while verifying size limit
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    temp_path = Path(temp_file.name)
    total_bytes = 0

    try:
        while True:
            chunk = await video.read(1024 * 1024)  # 1MB chunks
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Uploaded file exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
                )
            temp_file.write(chunk)
        temp_file.flush()
        temp_file.close()

        if total_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded video file is empty."
            )

        # 5. Model-specific frame extraction & inference
        try:
            if target_key == "late_fusion":
                pred_result = engine.predict_late_fusion(temp_path, top_k=5)
            else:
                input_tensor = preprocess_for_model(
                    temp_path,
                    model_id=target_key,
                    num_frames=FRAMES_PER_VIDEO
                )
                pred_result = engine.predict(input_tensor, model_id=target_key, top_k=5)
        except Exception as e:
            logger.error(f"Inference error on {video.filename} with model {target_key}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Neural inference error: {str(e)}"
            )

        # 6. Format response matching frontend TypeScript schema
        meta = pred_result["model_metadata"]
        return {
            "success": True,
            "isMock": False,
            "videoName": video.filename,
            "predictedWord": pred_result["predicted_word"],
            "confidence": pred_result["confidence"],
            "modelUsed": {
                "id": meta["id"],
                "name": meta["name"],
                "testAccuracy": meta["testAccuracy"],
                "architecture": meta["architecture"],
                "tagline": meta.get("tagline", "")
            },
            "topK": pred_result["top_k"],
            "preprocessing": meta["preprocessing"],
            "inferenceTimeMs": pred_result["inference_time_ms"],
            "simulatedLatencyMs": pred_result["inference_time_ms"],  # Backward-compatible alias
            "timestamp": datetime.now().strftime("%I:%M:%S %p")
        }

    finally:
        # Guarantee cleanup of temporary file on disk
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.error(f"Error removing temporary file {temp_path}: {e}")


@app.post("/api/v1/compare")
async def compare_video_models(
    video: UploadFile = File(...)
):
    """
    Executes neural inference across all 3 trained ISL models (MobileNetV2, Custom CNN, CNN-LSTM)
    on the exact same uploaded video sequence.
    Returns individual model predictions, top-5 candidates, measured latencies, and consensus analysis.
    """
    # 1. Validate filename and extension
    if not video.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload."
        )

    ext = Path(video.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Allowed formats: {sorted(list(ALLOWED_EXTENSIONS))}"
        )

    # 2. Ensure all 3 models are loaded
    for m_id in ["mobilenetv2", "custom_cnn", "cnn_lstm"]:
        if not engine.is_model_loaded(m_id):
            try:
                engine.load_model(m_id)
            except Exception as e:
                cfg = MODEL_REGISTRY[m_id]
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Model '{cfg['name']}' is not available: {str(e)}"
                )

    # 3. Stream upload to a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    temp_path = Path(temp_file.name)
    total_bytes = 0

    try:
        while True:
            chunk = await video.read(1024 * 1024)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Uploaded file exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
                )
            temp_file.write(chunk)
        temp_file.flush()
        temp_file.close()

        if total_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded video file is empty."
            )

        # 4. Preprocess and predict for each model
        try:
            t_mobile = preprocess_for_model(temp_path, model_id="mobilenetv2", num_frames=FRAMES_PER_VIDEO)
            pred_mobile = engine.predict(t_mobile, model_id="mobilenetv2", top_k=5)

            t_custom = preprocess_for_model(temp_path, model_id="custom_cnn", num_frames=FRAMES_PER_VIDEO)
            pred_custom = engine.predict(t_custom, model_id="custom_cnn", top_k=5)

            t_lstm = preprocess_for_model(temp_path, model_id="cnn_lstm", num_frames=FRAMES_PER_VIDEO)
            pred_lstm = engine.predict(t_lstm, model_id="cnn_lstm", top_k=5)
        except Exception as e:
            logger.error(f"Inference error during model comparison on {video.filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model comparison inference error: {str(e)}"
            )

        # 5. Calculate agreement and consensus
        from collections import Counter
        words = [
            pred_mobile["predicted_word"],
            pred_custom["predicted_word"],
            pred_lstm["predicted_word"]
        ]
        word_counts = Counter(words)
        majority_word, agreement_count = word_counts.most_common(1)[0]
        all_agree = (agreement_count == 3)

        return {
            "videoName": video.filename,
            "analyzedAt": datetime.now().strftime("%I:%M:%S %p"),
            "isMockData": False,
            "primaryPrediction": {
                "modelId": "mobilenetv2",
                "modelName": "MobileNetV2 (Frozen Backbone)",
                "word": pred_mobile["predicted_word"],
                "confidence": pred_mobile["confidence"]
            },
            "models": {
                "mobilenetv2": {
                    "modelId": "mobilenetv2",
                    "modelName": "MobileNetV2 (Frozen Backbone)",
                    "predictedWord": pred_mobile["predicted_word"],
                    "confidence": pred_mobile["confidence"],
                    "inferenceTimeMs": pred_mobile["inference_time_ms"],
                    "isBestModelOverall": True,
                    "status": "success",
                    "topK": pred_mobile["top_k"]
                },
                "custom-cnn": {
                    "modelId": "custom-cnn",
                    "modelName": "Custom 2D CNN",
                    "predictedWord": pred_custom["predicted_word"],
                    "confidence": pred_custom["confidence"],
                    "inferenceTimeMs": pred_custom["inference_time_ms"],
                    "isBestModelOverall": False,
                    "status": "success",
                    "topK": pred_custom["top_k"]
                },
                "cnn-lstm": {
                    "modelId": "cnn-lstm",
                    "modelName": "CNN-LSTM",
                    "predictedWord": pred_lstm["predicted_word"],
                    "confidence": pred_lstm["confidence"],
                    "inferenceTimeMs": pred_lstm["inference_time_ms"],
                    "isBestModelOverall": False,
                    "status": "success",
                    "topK": pred_lstm["top_k"]
                }
            },
            "agreementStatus": {
                "allAgree": all_agree,
                "majorityAgreedWord": majority_word,
                "agreementCount": agreement_count
            }
        }

    finally:
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.error(f"Error removing temporary file {temp_path}: {e}")
