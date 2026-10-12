import json
import time
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

from app.config import MODEL_PATH, CLASS_MAPPING_PATH

logger = logging.getLogger("signbridge.inference")


class MobileNetV2InferenceEngine:
    """
    Singleton inference engine for the trained MobileNetV2 (Frozen Backbone) model.
    Loads the Keras model weights and class index mapping once upon server startup.
    """

    def __init__(self):
        self.model = None
        self.class_to_idx: Dict[str, int] = {}
        self.idx_to_class: Dict[int, str] = {}
        self.is_loaded = False
        self.num_classes = 0

    def load(self):
        if self.is_loaded:
            return

        logger.info(f"Checking for model artifact at: {MODEL_PATH}")
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Trained MobileNetV2 model not found at {MODEL_PATH}. "
                f"Please ensure mobilenetv2_frozen_best.keras is placed in the artifacts folder."
            )

        logger.info(f"Checking for class mapping at: {CLASS_MAPPING_PATH}")
        if not CLASS_MAPPING_PATH.exists():
            raise FileNotFoundError(
                f"Class mapping file not found at {CLASS_MAPPING_PATH}. "
                f"Please ensure class_mapping.json is placed in the artifacts folder."
            )

        # 1. Load class mapping
        with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
            self.class_to_idx = json.load(f)

        self.num_classes = len(self.class_to_idx)
        self.idx_to_class = {idx: name for name, idx in self.class_to_idx.items()}

        logger.info(f"Loaded {self.num_classes} ISL class labels from {CLASS_MAPPING_PATH.name}")

        # 2. Load Keras model
        import keras

        logger.info(f"Loading Keras model from {MODEL_PATH.name}...")
        self.model = keras.models.load_model(str(MODEL_PATH), compile=False)
        self.is_loaded = True

        logger.info(
            f"Successfully initialized MobileNetV2 model. "
            f"Input shape: {self.model.input_shape}, Output shape: {self.model.output_shape}"
        )

    def predict(self, frames: np.ndarray, top_k: int = 5) -> Dict[str, Any]:
        """
        Runs multi-frame inference on 33 sampled frames (224x224x3) and computes
        video-level consensus probabilities via mean frame probability aggregation.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Inference model is not loaded. Call load() first.")

        if frames.ndim != 4 or frames.shape[1:] != (224, 224, 3):
            raise ValueError(f"Expected input shape (N, 224, 224, 3), got {frames.shape}")

        t0 = time.perf_counter()

        # Frame-level forward pass (batch size 32 or 33)
        # Note: frames are float32 in [0, 255]; model's built-in Rescaling maps to [-1, 1].
        frame_probabilities = self.model.predict(frames, batch_size=33, verbose=0)

        # Video-level aggregation: mean frame probabilities matching evaluation protocol
        video_probs = frame_probabilities.mean(axis=0)
        prob_sum = float(video_probs.sum())
        if prob_sum > 0:
            video_probs = video_probs / prob_sum

        inference_time_ms = round((time.perf_counter() - t0) * 1000, 2)

        top_idx = int(np.argmax(video_probs))
        predicted_word = self.idx_to_class[top_idx].upper()
        confidence = float(video_probs[top_idx])

        # Top-K candidate extraction
        sorted_indices = np.argsort(video_probs)[::-1][:top_k]
        top_k_candidates = [
            {
                "word": self.idx_to_class[int(idx)].upper(),
                "confidence": round(float(video_probs[idx]), 4)
            }
            for idx in sorted_indices
        ]

        return {
            "predicted_word": predicted_word,
            "confidence": round(confidence, 4),
            "top_k": top_k_candidates,
            "inference_time_ms": inference_time_ms,
            "frames_evaluated": int(frames.shape[0])
        }


# Global inference engine instance
engine = MobileNetV2InferenceEngine()
