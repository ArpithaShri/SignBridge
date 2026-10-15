import io
import os
import time
import base64
import logging
import tempfile
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import cv2
import numpy as np

from app.lab_eval2.config import (
    LAB_EVAL2_ARTIFACTS_DIR,
    BASELINE_CNN_PATH,
    GAN_AUGMENTED_CNN_PATH,
    GENERATOR_PATH,
    CLASS_MAPPING_PATH,
    IMAGE_SIZE,
    LATENT_DIM,
    NUM_CLASSES,
)

logger = logging.getLogger("signbridge.lab_eval2.inference")


class GanCnnEngine:
    """
    Dedicated inference engine for Lab Evaluation 2 (GAN + CNN experiment).
    Completely isolated from the main 76-class SignBridge inference pipeline.
    
    Supports:
    - Baseline Custom CNN (trained on real frames only, clean test acc: 49.89%)
    - DCGAN-Augmented Custom CNN (trained on real + 50% synthetic frames, clean test acc: 29.00%)
    - Conditional DCGAN Generator (generates 64x64 RGB frames conditioned on sign class 0..75)
    """

    def __init__(self):
        self._baseline_model = None
        self._augmented_model = None
        self._generator_model = None
        self._class_mapping: Dict[int, str] = {}
        self._class_to_id: Dict[str, int] = {}
        self._load_class_mapping()

    def _load_class_mapping(self) -> None:
        if CLASS_MAPPING_PATH.exists():
            try:
                import json
                with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    # Keys can be string index "0", "1", ...
                    self._class_mapping = {int(k): v for k, v in raw.items()}
                    self._class_to_id = {v: int(k) for k, v in raw.items()}
                logger.info(f"Loaded {len(self._class_mapping)} classes for Lab Eval 2 GAN+CNN.")
            except Exception as e:
                logger.error(f"Failed to load Lab Eval 2 class mapping: {e}")
        else:
            logger.warning(f"Class mapping not found at {CLASS_MAPPING_PATH}")

    def load_models(self) -> Dict[str, bool]:
        """Loads models into memory once and caches them safely."""
        import keras

        status = {"baseline": False, "gan_augmented": False, "generator": False}

        # 1. Baseline CNN
        if self._baseline_model is None and BASELINE_CNN_PATH.exists():
            try:
                logger.info(f"Loading Baseline CNN from {BASELINE_CNN_PATH}...")
                self._baseline_model = keras.models.load_model(str(BASELINE_CNN_PATH), compile=False)
                status["baseline"] = True
            except Exception as e:
                logger.error(f"Failed to load Baseline CNN: {e}")
        elif self._baseline_model is not None:
            status["baseline"] = True

        # 2. GAN-Augmented CNN
        if self._augmented_model is None and GAN_AUGMENTED_CNN_PATH.exists():
            try:
                logger.info(f"Loading GAN-Augmented CNN from {GAN_AUGMENTED_CNN_PATH}...")
                self._augmented_model = keras.models.load_model(str(GAN_AUGMENTED_CNN_PATH), compile=False)
                status["gan_augmented"] = True
            except Exception as e:
                logger.error(f"Failed to load GAN-Augmented CNN: {e}")
        elif self._augmented_model is not None:
            status["gan_augmented"] = True

        # 3. Conditional DCGAN Generator
        if self._generator_model is None and GENERATOR_PATH.exists():
            try:
                logger.info(f"Loading Conditional DCGAN Generator from {GENERATOR_PATH}...")
                self._generator_model = keras.models.load_model(str(GENERATOR_PATH), compile=False)
                status["generator"] = True
            except Exception as e:
                logger.error(f"Failed to load Conditional Generator: {e}")
        elif self._generator_model is not None:
            status["generator"] = True

        return status

    def get_classes(self) -> List[str]:
        return [self._class_mapping.get(i, f"class_{i}") for i in range(NUM_CLASSES)]

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """
        Preprocesses raw image bytes matching Cell 7 of the notebook:
        1. Decode with OpenCV
        2. Convert BGR to RGB
        3. Resize to 64x64 with INTER_AREA
        4. Normalize from [0, 255] to [-1.0, 1.0] via `img / 127.5 - 1.0`
        Returns shape (1, 64, 64, 3) float32
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Could not decode image file. Ensure it is a valid PNG, JPG, or WebP image.")

        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(img_rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
        normalized = resized.astype(np.float32) / 127.5 - 1.0
        return np.expand_dims(normalized, axis=0)

    def preprocess_video(self, video_bytes: bytes, n_frames: int = 5) -> Tuple[np.ndarray, int]:
        """
        Extracts representative frames matching the notebook's uniform video frame protocol:
        Extracts n_frames, resizes to 64x64, scales to [-1.0, 1.0].
        Returns shape (N, 64, 64, 3) float32 and total video frame count.
        """
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        try:
            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                raise ValueError("Could not open video file. Ensure it is a valid MP4/WebM/AVI clip.")

            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if frame_count <= 0:
                raise ValueError("Video contains 0 readable frames.")

            indices = np.linspace(0, frame_count - 1, n_frames, dtype=int)
            unique_indices = np.unique(indices)
            frames = []

            for idx in unique_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
                ok, frame = cap.read()
                if not ok or frame is None:
                    continue
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                resized = cv2.resize(frame_rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
                normalized = resized.astype(np.float32) / 127.5 - 1.0
                frames.append(normalized)

            cap.release()

            if not frames:
                raise ValueError("Failed to extract any valid frames from the video.")

            return np.asarray(frames, dtype=np.float32), frame_count
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def predict(
        self,
        data_bytes: bytes,
        is_video: bool = False,
        target_model: str = "both"
    ) -> Dict[str, Any]:
        """
        Executes prediction on either a single image or video clip.
        For video, computes mean probability across extracted frames (as in notebook Cell 30).
        """
        self.load_models()

        if is_video:
            X, frame_count = self.preprocess_video(data_bytes, n_frames=5)
            input_info = f"Video ({len(X)} frames sampled from {frame_count} total)"
        else:
            X = self.preprocess_image(data_bytes)
            input_info = "Single image frame (64×64)"

        results = {
            "input_type": "video" if is_video else "image",
            "input_info": input_info,
            "classes_count": NUM_CLASSES,
        }

        # Predict with Baseline CNN
        if target_model in ("both", "baseline"):
            if self._baseline_model is None:
                results["baseline_error"] = "Baseline CNN model weight file not available."
            else:
                t0 = time.perf_counter()
                probs = self._baseline_model.predict(X, verbose=0)
                mean_probs = np.mean(probs, axis=0) if is_video else probs[0]
                elapsed_ms = (time.perf_counter() - t0) * 1000

                top_idx = int(np.argmax(mean_probs))
                top_conf = float(mean_probs[top_idx])
                top_class = self._class_mapping.get(top_idx, f"class_{top_idx}")

                # Top 5
                top5_indices = np.argsort(mean_probs)[::-1][:5]
                top5 = [
                    {
                        "class_index": int(i),
                        "class_name": self._class_mapping.get(int(i), f"class_{i}"),
                        "confidence": float(mean_probs[i])
                    }
                    for i in top5_indices
                ]

                results["baseline"] = {
                    "model_name": "Baseline Custom CNN",
                    "training_set": "Real frames only (clean test acc: 49.89%)",
                    "predicted_class": top_class,
                    "predicted_index": top_idx,
                    "confidence": top_conf,
                    "top5": top5,
                    "latency_ms": round(elapsed_ms, 2)
                }

        # Predict with GAN-Augmented CNN
        if target_model in ("both", "augmented"):
            if self._augmented_model is None:
                results["augmented_error"] = "GAN-Augmented CNN model weight file not available."
            else:
                t0 = time.perf_counter()
                probs = self._augmented_model.predict(X, verbose=0)
                mean_probs = np.mean(probs, axis=0) if is_video else probs[0]
                elapsed_ms = (time.perf_counter() - t0) * 1000

                top_idx = int(np.argmax(mean_probs))
                top_conf = float(mean_probs[top_idx])
                top_class = self._class_mapping.get(top_idx, f"class_{top_idx}")

                top5_indices = np.argsort(mean_probs)[::-1][:5]
                top5 = [
                    {
                        "class_index": int(i),
                        "class_name": self._class_mapping.get(int(i), f"class_{i}"),
                        "confidence": float(mean_probs[i])
                    }
                    for i in top5_indices
                ]

                results["gan_augmented"] = {
                    "model_name": "DCGAN-Augmented Custom CNN",
                    "training_set": "Real + 50% GAN synthetic frames (clean test acc: 29.00%)",
                    "predicted_class": top_class,
                    "predicted_index": top_idx,
                    "confidence": top_conf,
                    "top5": top5,
                    "latency_ms": round(elapsed_ms, 2)
                }

        return results

    def generate(self, class_identifier: Any, seed: Optional[int] = None) -> Dict[str, Any]:
        """
        Generates a 64x64 RGB synthetic image conditioned on the requested class using the trained DCGAN generator.
        """
        self.load_models()
        if self._generator_model is None:
            raise RuntimeError("Conditional DCGAN Generator checkpoint not available.")

        # Resolve class index
        if isinstance(class_identifier, int):
            class_idx = class_identifier
        elif isinstance(class_identifier, str) and class_identifier.isdigit():
            class_idx = int(class_identifier)
        elif isinstance(class_identifier, str):
            clean = class_identifier.strip().lower()
            if clean in self._class_to_id:
                class_idx = self._class_to_id[clean]
            else:
                raise ValueError(f"Unknown class '{class_identifier}'. Must be one of 76 ISL classes.")
        else:
            raise ValueError("Invalid class identifier.")

        if not (0 <= class_idx < NUM_CLASSES):
            raise ValueError(f"Class index must be in range 0..{NUM_CLASSES - 1}.")

        class_name = self._class_mapping.get(class_idx, f"class_{class_idx}")

        t0 = time.perf_counter()
        if seed is not None:
            rng = np.random.RandomState(seed)
            noise = rng.normal(0, 1, (1, LATENT_DIM)).astype(np.float32)
        else:
            noise = np.random.normal(0, 1, (1, LATENT_DIM)).astype(np.float32)

        label_arr = np.array([class_idx], dtype=np.int32)
        fake_tensor = self._generator_model.predict([noise, label_arr], verbose=0)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        # Output is in [-1.0, 1.0], convert to [0, 255] RGB uint8
        img_np = np.clip((fake_tensor[0] + 1.0) / 2.0 * 255.0, 0, 255).astype(np.uint8)

        # Convert RGB to BGR for cv2.imencode
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        ok, buf = cv2.imencode(".png", img_bgr)
        if not ok:
            raise RuntimeError("Failed to encode generated image.")

        b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
        data_url = f"data:image/png;base64,{b64}"

        return {
            "success": True,
            "class_name": class_name,
            "class_index": class_idx,
            "seed": seed,
            "latency_ms": round(elapsed_ms, 2),
            "image_data_url": data_url,
            "image_size": "64×64×3",
            "latent_dim": LATENT_DIM,
            "is_live": True,
        }

    def status(self) -> Dict[str, Any]:
        return {
            "baseline_loaded": self._baseline_model is not None,
            "gan_augmented_loaded": self._augmented_model is not None,
            "generator_loaded": self._generator_model is not None,
            "classes_count": len(self._class_mapping),
            "artifacts_dir_exists": LAB_EVAL2_ARTIFACTS_DIR.exists()
        }


gan_cnn_engine = GanCnnEngine()
