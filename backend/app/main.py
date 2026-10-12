import os
import shutil
import tempfile
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import (
    CORS_ORIGINS,
    MAX_FILE_SIZE_BYTES,
    ALLOWED_EXTENSIONS,
    FRAMES_PER_VIDEO,
    IMAGE_SIZE,
    MODEL_PATH,
    CLASS_MAPPING_PATH
)
from app.preprocessing import extract_rgb_frames
from app.inference import engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("signbridge.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load model once
    logger.info("Initializing SignBridge MobileNetV2 backend...")
    try:
        engine.load()
        logger.info("MobileNetV2 engine successfully ready for live inference.")
    except Exception as e:
        logger.error(f"Could not load MobileNetV2 model at startup: {e}")
        logger.warning(
            "Backend starting in scaffold mode. Ensure mobilenetv2_frozen_best.keras and "
            "class_mapping.json are present in backend/artifacts/mobilenetv2_frozen/."
        )
    yield
    # Shutdown
    logger.info("SignBridge backend shutting down.")


app = FastAPI(
    title="SignBridge ISL Recognition API",
    description="Real-time and batch video recognition API for 76 Indian Sign Language word classes using MobileNetV2.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "SignBridge ISL Recognition Backend",
        "version": "1.0.0",
        "active_model": "MobileNetV2 (Frozen Backbone)",
        "docs_url": "/docs",
        "health_url": "/api/v1/health"
    }


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": engine.is_loaded,
        "classes_count": engine.num_classes,
        "model_path": str(MODEL_PATH),
        "mapping_path": str(CLASS_MAPPING_PATH),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/api/v1/model-info")
async def model_info():
    if not engine.is_loaded:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "Model weights are not loaded.",
                "model_path": str(MODEL_PATH),
                "mapping_path": str(CLASS_MAPPING_PATH)
            }
        )

    return {
        "model_id": "mobilenetv2",
        "name": "MobileNetV2 (Frozen Backbone)",
        "architecture": "ImageNet Pretrained Feature Extractor + Global Avg Pooling + Dense(256) -> Dense(76)",
        "offline_test_accuracy": 67.78,
        "input_shape": list(engine.model.input_shape),
        "output_shape": list(engine.model.output_shape),
        "num_classes": engine.num_classes,
        "preprocessing": {
            "sampling_frames": FRAMES_PER_VIDEO,
            "target_resolution": f"{IMAGE_SIZE}x{IMAGE_SIZE}",
            "color_space": "RGB",
            "pixel_rescaling": "1/127.5, offset -1.0 to [-1, 1]"
        }
    }


@app.post("/api/v1/recognize")
async def recognize_video(video: UploadFile = File(...)):
    # 1. Check if model is ready
    if not engine.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "MobileNetV2 model is not loaded. Ensure mobilenetv2_frozen_best.keras "
                "and class_mapping.json are placed in backend/artifacts/mobilenetv2_frozen/."
            )
        )

    # 2. Validate filename and extension
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

    # 3. Stream upload to a temporary file while verifying size limit
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

        # 4. Extract 33 RGB frames
        try:
            frames = extract_rgb_frames(temp_path, num_frames=FRAMES_PER_VIDEO, image_size=IMAGE_SIZE)
        except Exception as e:
            logger.warning(f"Failed to decode video frames from {video.filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not decode video file: {str(e)}"
            )

        # 5. Execute MobileNetV2 neural inference
        try:
            pred_result = engine.predict(frames, top_k=5)
        except Exception as e:
            logger.error(f"Inference error on {video.filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Neural inference error: {str(e)}"
            )

        # 6. Format response matching frontend TypeScript schema
        return {
            "success": True,
            "isMock": False,
            "videoName": video.filename,
            "predictedWord": pred_result["predicted_word"],
            "confidence": pred_result["confidence"],
            "modelUsed": {
                "id": "mobilenetv2",
                "name": "MobileNetV2 (Frozen Backbone)",
                "testAccuracy": 67.78,
                "architecture": "Pretrained ImageNet Visual Extractor + Global Avg Pooling"
            },
            "topK": pred_result["top_k"],
            "preprocessing": {
                "framesSampled": FRAMES_PER_VIDEO,
                "frameResolution": f"{IMAGE_SIZE} × {IMAGE_SIZE}",
                "colorSpace": "RGB",
                "normalization": "Normalized to [-1, 1]"
            },
            "simulatedLatencyMs": pred_result["inference_time_ms"],
            "timestamp": datetime.now().strftime("%I:%M:%S %p")
        }

    finally:
        # Guarantee cleanup of temporary file on disk
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.error(f"Error removing temporary file {temp_path}: {e}")
