import io
import os
import time
import json
import base64
import logging
import tempfile
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import cv2
import numpy as np

from app.lab_eval2.config import (
    GAN_CNN_LSTM_ARTIFACTS_DIR,
    CNN_LSTM_BASELINE_MODEL_PATH,
    CNN_LSTM_AUGMENTED_MODEL_PATH,
    CNN_LSTM_GENERATOR_PATH,
    CNN_LSTM_DISCRIMINATOR_PATH,
    CNN_LSTM_MAPPING_PATH,
    CNN_LSTM_BASELINE_SUMMARY_PATH,
    CNN_LSTM_MODEL_INFO_PATH,
    CNN_LSTM_REPORT_PATH,
    CNN_LSTM_CONFUSION_PATH,
    CNN_LSTM_PREDICTIONS_PATH,
    CNN_LSTM_PIXEL_STATS_PATH,
    CNN_LSTM_SAMPLE_GRID_STATS_PATH,
    CNN_LSTM_EXPERIMENT_REPORT_PATH,
    CNN_LSTM_EVALUATION_SUMMARY_PATH,
    CNN_LSTM_TRAINING_HISTORY_PATH,
    CNN_LSTM_SEQUENCE_FRAMES,
    CNN_LSTM_IMAGE_SIZE,
    NUM_CLASSES,
    LATENT_DIM
)

logger = logging.getLogger("signbridge.lab_eval2.inference_lstm")


class GanCnnLstmEngine:
    """
    Dedicated inference engine for Lab Evaluation 2 — GAN + CNN-LSTM Spatio-Temporal Experiment.
    Maintains clean separation from the main recognition pipeline and the GAN + CNN experiment.
    
    Includes:
    - Real-data Baseline CNN-LSTM (33 frames x 112x112 RGB, verified 4.44% clean accuracy)
    - Class-Conditioned DCGAN Generator (64x64 RGB frames conditioned on sign class 0..75)
    - Explicit status tracking for GAN-Augmented CNN-LSTM (Awaiting Checkpoint; zero fabricated metrics)
    """

    def __init__(self):
        self._baseline_model = None
        self._augmented_model = None
        self._generator_model = None
        self._class_mapping: Dict[int, str] = {}
        self._class_to_id: Dict[str, int] = {}
        self._load_class_mapping()

    def _load_class_mapping(self) -> None:
        target = CNN_LSTM_MAPPING_PATH
        if target.exists():
            try:
                with open(target, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                # Raw can be { "name": idx } or { "idx": "name" }
                if raw and isinstance(list(raw.keys())[0], str) and not list(raw.keys())[0].isdigit():
                    # Format: { "afternoon": 0, ... }
                    self._class_to_id = {k.lower(): int(v) for k, v in raw.items()}
                    self._class_mapping = {int(v): k.lower() for k, v in raw.items()}
                else:
                    # Format: { "0": "afternoon", ... }
                    self._class_mapping = {int(k): v.lower() for k, v in raw.items()}
                    self._class_to_id = {v.lower(): int(k) for k, v in raw.items()}
                logger.info(f"Loaded {len(self._class_mapping)} classes for GAN + CNN-LSTM.")
            except Exception as e:
                logger.error(f"Failed to load CNN-LSTM class mapping: {e}")
        else:
            logger.warning(f"CNN-LSTM class mapping not found at {target}")

    def load_models(self) -> Dict[str, bool]:
        """Loads available Keras models into memory once and caches them."""
        import keras

        status = {
            "baseline_lstm": False,
            "augmented_lstm": False,
            "generator": False
        }

        # 1. Baseline CNN-LSTM Model
        if self._baseline_model is None and CNN_LSTM_BASELINE_MODEL_PATH.exists():
            try:
                logger.info(f"Loading Baseline CNN-LSTM from {CNN_LSTM_BASELINE_MODEL_PATH.name}...")
                self._baseline_model = keras.models.load_model(str(CNN_LSTM_BASELINE_MODEL_PATH), compile=False)
                status["baseline_lstm"] = True
            except Exception as e:
                logger.error(f"Failed to load Baseline CNN-LSTM: {e}")
        elif self._baseline_model is not None:
            status["baseline_lstm"] = True

        # 2. GAN-Augmented CNN-LSTM Model (Strictly checked without fallback or fabrication)
        if self._augmented_model is None and CNN_LSTM_AUGMENTED_MODEL_PATH.exists():
            try:
                logger.info(f"Loading GAN-Augmented CNN-LSTM from {CNN_LSTM_AUGMENTED_MODEL_PATH.name}...")
                self._augmented_model = keras.models.load_model(str(CNN_LSTM_AUGMENTED_MODEL_PATH), compile=False)
                status["augmented_lstm"] = True
            except Exception as e:
                logger.error(f"Failed to load GAN-Augmented CNN-LSTM: {e}")
        elif self._augmented_model is not None:
            status["augmented_lstm"] = True

        # 3. Class-Conditioned DCGAN Generator
        if self._generator_model is None and CNN_LSTM_GENERATOR_PATH.exists():
            try:
                logger.info(f"Loading Conditional DCGAN Generator from {CNN_LSTM_GENERATOR_PATH.name}...")
                self._generator_model = keras.models.load_model(str(CNN_LSTM_GENERATOR_PATH), compile=False)
                status["generator"] = True
            except Exception as e:
                logger.error(f"Failed to load Conditional Generator: {e}")
        elif self._generator_model is not None:
            status["generator"] = True

        return status

    def get_classes(self) -> List[str]:
        return [self._class_mapping.get(i, f"class_{i}") for i in range(NUM_CLASSES)]

    def extract_33_frames_for_lstm(self, video_bytes: bytes) -> Tuple[np.ndarray, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Samples exactly 33 frames matching the original training procedure:
        - 33 evenly spaced frames
        - Converted BGR -> RGB
        - Resized to 112x112 with cv2.INTER_AREA
        - Normalized to [0.0, 1.0] via frame / 255.0
        Returns:
        - Tensor shape (1, 33, 112, 112, 3) float32
        - Thumbnails for visual verification (5 keyframes)
        - Metadata (duration, fps, total frames)
        """
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        try:
            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                raise ValueError("Could not decode video file. Ensure it is a valid MP4/WebM/AVI clip.")

            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = float(cap.get(cv2.CAP_PROP_FPS)) or 25.0
            duration_sec = frame_count / fps if fps > 0 else 0.0

            if frame_count <= 0:
                raise ValueError("Video contains 0 readable frames.")

            indices = np.linspace(0, frame_count - 1, CNN_LSTM_SEQUENCE_FRAMES, dtype=int)
            frames = []
            preview_thumbnails = []

            for i, idx in enumerate(indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
                ok, frame = cap.read()
                if not ok or frame is None:
                    # Pad with blank frame if read failure
                    frame_rgb = np.zeros((CNN_LSTM_IMAGE_SIZE, CNN_LSTM_IMAGE_SIZE, 3), dtype=np.uint8)
                else:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frame_rgb = cv2.resize(frame_rgb, (CNN_LSTM_IMAGE_SIZE, CNN_LSTM_IMAGE_SIZE), interpolation=cv2.INTER_AREA)

                # Normalized to [0.0, 1.0] float32
                norm_frame = frame_rgb.astype(np.float32) / 255.0
                frames.append(norm_frame)

                # Collect 5 keyframe thumbnails across the sequence (first, 25%, 50%, 75%, last)
                if i in (0, 8, 16, 24, 32):
                    thumb_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
                    ok_enc, buf = cv2.imencode(".jpg", thumb_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                    thumb_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf.tobytes()).decode('utf-8')}" if ok_enc else ""
                    preview_thumbnails.append({
                        "sequence_step": i,
                        "frame_num": int(idx),
                        "timestamp_sec": round(idx / fps, 2),
                        "thumbnail": thumb_b64
                    })

            cap.release()

            seq_tensor = np.expand_dims(np.asarray(frames, dtype=np.float32), axis=0)
            metadata = {
                "total_frames": frame_count,
                "fps": round(fps, 2),
                "duration_seconds": round(duration_sec, 2),
                "sequence_frames": CNN_LSTM_SEQUENCE_FRAMES,
                "frame_resolution": f"{CNN_LSTM_IMAGE_SIZE}x{CNN_LSTM_IMAGE_SIZE}"
            }
            return seq_tensor, preview_thumbnails, metadata
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def predict_video(self, video_bytes: bytes) -> Dict[str, Any]:
        """
        Executes sequence prediction through the real-data Baseline CNN-LSTM model.
        Also inspects for GAN-augmented CNN-LSTM and reports its explicit status.
        """
        self.load_models()
        seq_tensor, preview_thumbs, meta = self.extract_33_frames_for_lstm(video_bytes)

        results = {
            "metadata": meta,
            "preview_thumbnails": preview_thumbs,
            "models_tested": {}
        }

        # Baseline CNN-LSTM inference
        if self._baseline_model is not None:
            t0 = time.perf_counter()
            probs = self._baseline_model.predict(seq_tensor, verbose=0)[0]
            elapsed_ms = (time.perf_counter() - t0) * 1000

            top_idx = int(np.argmax(probs))
            top_conf = float(probs[top_idx])
            top_class = self._class_mapping.get(top_idx, f"class_{top_idx}")

            top5_indices = np.argsort(probs)[::-1][:5]
            top5 = [
                {
                    "class_index": int(i),
                    "class_name": self._class_mapping.get(int(i), f"class_{i}"),
                    "confidence": float(probs[i])
                }
                for i in top5_indices
            ]

            results["baseline_cnn_lstm"] = {
                "status": "success",
                "model_name": "Baseline CNN-LSTM (Real Data Only)",
                "architecture": "TimeDistributed Conv Blocks + LSTM(64) -> Dense(76)",
                "input_shape": "(None, 33, 112, 112, 3)",
                "clean_test_accuracy": 4.44,
                "predicted_class": top_class,
                "predicted_index": top_idx,
                "confidence": top_conf,
                "top5": top5,
                "latency_ms": round(elapsed_ms, 2)
            }
        else:
            results["baseline_cnn_lstm"] = {
                "status": "unavailable",
                "message": "Baseline CNN-LSTM checkpoint not loaded."
            }

        # GAN-Augmented CNN-LSTM: Transparently report state
        if self._augmented_model is not None:
            t1 = time.perf_counter()
            probs_aug = self._augmented_model.predict(seq_tensor, verbose=0)[0]
            elapsed_ms_aug = (time.perf_counter() - t1) * 1000

            top_idx_aug = int(np.argmax(probs_aug))
            top_conf_aug = float(probs_aug[top_idx_aug])
            top_class_aug = self._class_mapping.get(top_idx_aug, f"class_{top_idx_aug}")

            results["gan_augmented_cnn_lstm"] = {
                "status": "success",
                "model_name": "GAN-Augmented CNN-LSTM",
                "predicted_class": top_class_aug,
                "confidence": top_conf_aug,
                "latency_ms": round(elapsed_ms_aug, 2)
            }
        else:
            results["gan_augmented_cnn_lstm"] = {
                "status": "awaiting_checkpoint",
                "model_name": "GAN-Augmented CNN-LSTM",
                "message": (
                    "No trained GAN-augmented CNN-LSTM classifier checkpoint was provided in the teammate package. "
                    "The teammate implemented a 2D class-conditional DCGAN (generating 64x64 frames) and evaluated the real-data "
                    "baseline CNN-LSTM, but did not train a sequence-level GAN-augmented recurrent classifier."
                ),
                "is_available": False
            }

        return results

    def generate(self, class_identifier: Any, seed: Optional[int] = None) -> Dict[str, Any]:
        """
        Synthesizes a 64x64 RGB sign gesture image conditioned on class 0..75 using the teammate's DCGAN generator.
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

        # Convert [-1.0, 1.0] to [0, 255] RGB uint8
        img_np = np.clip((fake_tensor[0] + 1.0) / 2.0 * 255.0, 0, 255).astype(np.uint8)

        # Convert RGB to BGR for encoding
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        ok, buf = cv2.imencode(".png", img_bgr)
        if not ok:
            raise RuntimeError("Failed to encode synthesized image.")

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
            "baseline_lstm_loaded": self._baseline_model is not None,
            "augmented_lstm_loaded": self._augmented_model is not None,
            "generator_loaded": self._generator_model is not None,
            "classes_count": len(self._class_mapping),
            "artifacts_dir_exists": GAN_CNN_LSTM_ARTIFACTS_DIR.exists()
        }


gan_cnn_lstm_engine = GanCnnLstmEngine()
