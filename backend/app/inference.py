import json
import time
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

from app.config import (
    MODEL_REGISTRY,
    DEFAULT_MODEL_ID,
    normalize_model_id
)

logger = logging.getLogger("signbridge.inference")


class MultiModelInferenceEngine:
    """
    Singleton inference engine for the SignBridge ISL recognition models:
    - MobileNetV2 (Frozen Backbone) [Default]
    - Custom 2D CNN (Baseline)
    - CNN-LSTM Spatio-Temporal Model

    Loads Keras models and the verified 76-class mapping into memory once and caches them.
    Never reloads weights on every request.
    """

    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.class_to_idx: Dict[str, int] = {}
        self.idx_to_class: Dict[int, str] = {}
        self.num_classes = 0
        self._class_mapping_loaded = False

    def _load_class_mapping(self, mapping_path: Path):
        if self._class_mapping_loaded:
            return

        if not mapping_path.exists():
            raise FileNotFoundError(
                f"Class mapping file not found at {mapping_path}. "
                f"Please ensure class_mapping.json is present in the model artifacts directory."
            )

        with open(mapping_path, "r", encoding="utf-8") as f:
            self.class_to_idx = json.load(f)

        self.num_classes = len(self.class_to_idx)
        self.idx_to_class = {idx: name for name, idx in self.class_to_idx.items()}
        self._class_mapping_loaded = True
        logger.info(f"Loaded {self.num_classes} ISL class labels from {mapping_path.name}")

    def load_model(self, model_id: str = DEFAULT_MODEL_ID) -> Any:
        target_key = normalize_model_id(model_id)

        if target_key not in MODEL_REGISTRY:
            raise ValueError(
                f"Unknown model identifier '{model_id}'. "
                f"Allowed options: {list(MODEL_REGISTRY.keys())}"
            )

        if target_key in self.models:
            return self.models[target_key]

        cfg = MODEL_REGISTRY[target_key]
        model_file = cfg["model_file"]
        mapping_file = cfg["mapping_file"]

        if not model_file.exists():
            raise FileNotFoundError(
                f"Trained model artifact for '{cfg['name']}' not found at: {model_file}."
            )

        # Load class mapping
        self._load_class_mapping(mapping_file)

        import keras
        logger.info(f"Loading Keras model for '{cfg['name']}' from {model_file.name}...")
        t0 = time.perf_counter()
        loaded_model = keras.models.load_model(str(model_file), compile=False)
        load_time_s = time.perf_counter() - t0
        self.models[target_key] = loaded_model
        logger.info(
            f"Successfully loaded '{cfg['name']}' in {load_time_s:.2f}s. "
            f"Input shape: {loaded_model.input_shape}, Output shape: {loaded_model.output_shape}"
        )
        return loaded_model

    def load_all(self) -> Dict[str, bool]:
        """Attempts to load all registered models, reporting load status per model."""
        statuses = {}
        for key in MODEL_REGISTRY:
            try:
                self.load_model(key)
                statuses[key] = True
            except Exception as e:
                logger.warning(f"Could not load model '{key}' at startup: {e}")
                statuses[key] = False
        return statuses

    def is_model_loaded(self, model_id: str) -> bool:
        target_key = normalize_model_id(model_id)
        return target_key in self.models

    def get_loaded_models(self) -> List[str]:
        return list(self.models.keys())

    # Backwards compatibility properties matching MobileNetV2
    @property
    def is_loaded(self) -> bool:
        return DEFAULT_MODEL_ID in self.models

    @property
    def model(self):
        return self.models.get(DEFAULT_MODEL_ID)

    def load(self):
        """Backwards compatible startup load call for MobileNetV2."""
        self.load_model(DEFAULT_MODEL_ID)

    def predict(
        self,
        frames_or_seq: np.ndarray,
        model_id: str = DEFAULT_MODEL_ID,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Runs neural inference using the specified model:
        - mobilenetv2: 4D tensor (33, 224, 224, 3) in [0, 255] -> mean frame probability vector.
        - custom_cnn:  4D tensor (33, 224, 224, 3) in [0, 1]   -> mean frame probability vector.
        - cnn_lstm:    5D tensor (1, 33, 112, 112, 3) in [0, 1]-> single sequence probability vector.
        """
        target_key = normalize_model_id(model_id)
        if target_key not in MODEL_REGISTRY:
            raise ValueError(
                f"Unknown model identifier '{model_id}'. "
                f"Allowed options: {list(MODEL_REGISTRY.keys())}"
            )

        if not self.is_model_loaded(target_key):
            # Attempt lazy load
            self.load_model(target_key)

        model_instance = self.models[target_key]
        cfg = MODEL_REGISTRY[target_key]

        t0 = time.perf_counter()

        if target_key == "cnn_lstm":
            # 5D input: (batch=1, 33, 112, 112, 3)
            if frames_or_seq.ndim != 5:
                raise ValueError(
                    f"CNN-LSTM requires a 5D sequence tensor (1, 33, 112, 112, 3), got shape {frames_or_seq.shape}"
                )
            preds = model_instance.predict(frames_or_seq, verbose=0)
            video_probs = preds[0]
            frames_count = frames_or_seq.shape[1]
        else:
            # 4D input: (33, 224, 224, 3)
            if frames_or_seq.ndim != 4:
                raise ValueError(
                    f"Frame-level models require a 4D tensor (N, 224, 224, 3), got shape {frames_or_seq.shape}"
                )
            frame_probs = model_instance.predict(frames_or_seq, batch_size=33, verbose=0)
            video_probs = frame_probs.mean(axis=0)
            frames_count = frames_or_seq.shape[0]

        # Normalize probability vector
        prob_sum = float(video_probs.sum())
        if prob_sum > 0:
            video_probs = video_probs / prob_sum

        inference_time_ms = round((time.perf_counter() - t0) * 1000, 2)

        top_idx = int(np.argmax(video_probs))
        predicted_word = self.idx_to_class[top_idx].upper()
        confidence = float(video_probs[top_idx])

        # Top-K candidates
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
            "frames_evaluated": frames_count,
            "model_metadata": {
                "id": cfg["id"],
                "name": cfg["name"],
                "testAccuracy": cfg["test_accuracy"],
                "architecture": cfg["architecture"],
                "tagline": cfg["tagline"],
                "preprocessing": {
                    "framesSampled": cfg["frame_count"],
                    "frameResolution": f"{cfg['image_size']} × {cfg['image_size']}",
                    "colorSpace": cfg["color_space"],
                    "normalization": cfg["normalization"],
                    "aggregation": cfg["aggregation"]
                }
            }
        }


# Global inference engine singleton
engine = MultiModelInferenceEngine()
