import time
import logging
from typing import Dict, Any, Optional, Tuple, List
import numpy as np
import cv2

from app.lab_eval2.config import (
    BASELINE_CNN_PATH,
    GAN_AUGMENTED_CNN_PATH,
    GENERATOR_PATH,
    IMAGE_SIZE,
    LATENT_DIM,
    SELECTED_CLASSES,
    CLASS_TO_IDX,
    IDX_TO_CLASS,
    NUM_CLASSES,
)

logger = logging.getLogger("signbridge.lab_eval2")


class LabEval2Engine:
    """
    Dedicated inference engine for Lab Evaluation 2:
    - Baseline CNN (trained on 616 real frames)
    - GAN-Augmented CNN (trained on 616 real frames + 600 synthetic images)
    - Conditional DCGAN Generator (generates 64x64 RGB images conditioned on 5 classes)
    
    Security & Architecture Note:
    - Discriminator is NEVER loaded as a classifier.
    - Models are loaded once and reused across requests.
    """

    def __init__(self):
        self.baseline_model = None
        self.gan_augmented_model = None
        self.generator_model = None
        self._loaded = False
        self._load_errors: Dict[str, str] = {}

    def load_models(self) -> Dict[str, bool]:
        """Loads all LabEval2 models once into memory."""
        import keras

        # 1. Baseline CNN
        if self.baseline_model is None and BASELINE_CNN_PATH.exists():
            try:
                logger.info(f"Loading Baseline CNN from {BASELINE_CNN_PATH}...")
                self.baseline_model = keras.models.load_model(BASELINE_CNN_PATH)
                logger.info("Baseline CNN loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load Baseline CNN: {e}")
                self._load_errors["baseline"] = str(e)
        elif not BASELINE_CNN_PATH.exists():
            self._load_errors["baseline"] = f"Model file not found at {BASELINE_CNN_PATH}"

        # 2. GAN-Augmented CNN
        if self.gan_augmented_model is None and GAN_AUGMENTED_CNN_PATH.exists():
            try:
                logger.info(f"Loading GAN-Augmented CNN from {GAN_AUGMENTED_CNN_PATH}...")
                self.gan_augmented_model = keras.models.load_model(GAN_AUGMENTED_CNN_PATH)
                logger.info("GAN-Augmented CNN loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load GAN-Augmented CNN: {e}")
                self._load_errors["gan_augmented"] = str(e)
        elif not GAN_AUGMENTED_CNN_PATH.exists():
            self._load_errors["gan_augmented"] = f"Model file not found at {GAN_AUGMENTED_CNN_PATH}"

        # 3. Conditional DCGAN Generator
        if self.generator_model is None and GENERATOR_PATH.exists():
            try:
                logger.info(f"Loading Conditional DCGAN Generator from {GENERATOR_PATH}...")
                self.generator_model = keras.models.load_model(GENERATOR_PATH)
                logger.info("Conditional Generator loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load Conditional Generator: {e}")
                self._load_errors["generator"] = str(e)
        elif not GENERATOR_PATH.exists():
            self._load_errors["generator"] = f"Generator file not found at {GENERATOR_PATH}"

        self._loaded = (
            self.baseline_model is not None and
            self.gan_augmented_model is not None and
            self.generator_model is not None
        )

        return self.status()

    def status(self) -> Dict[str, Any]:
        """Returns the readiness status of all models."""
        return {
            "baseline_loaded": self.baseline_model is not None,
            "gan_augmented_loaded": self.gan_augmented_model is not None,
            "generator_loaded": self.generator_model is not None,
            "all_ready": self._loaded,
            "errors": self._load_errors
        }

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """
        Preprocesses uploaded image for the 64x64 5-class classifiers:
        - Decodes raw image bytes
        - Converts BGR to RGB
        - Resizes to (64, 64) with INTER_AREA
        - Normalizes pixel values: float32 / 255.0 to [0.0, 1.0]
        - Returns batch tensor with shape (1, 64, 64, 3)
        """
        arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None or img.size == 0:
            raise ValueError("Could not decode image. Please provide a valid PNG, JPG, or WebP image file.")

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
        img_norm = (img_resized.astype(np.float32) / 255.0).reshape(1, IMAGE_SIZE, IMAGE_SIZE, 3)
        return img_norm

    def _predict_single(self, model, input_tensor: np.ndarray) -> Tuple[str, float, Dict[str, float], float]:
        """Runs single-model inference with precise millisecond latency timing."""
        start_t = time.perf_counter()
        raw_probs = model.predict(input_tensor, verbose=0)[0]
        latency_ms = (time.perf_counter() - start_t) * 1000.0

        # Build class-mapped probabilities dictionary
        probs_dict = {
            cls_name: float(raw_probs[idx])
            for idx, cls_name in enumerate(SELECTED_CLASSES)
        }

        pred_idx = int(np.argmax(raw_probs))
        pred_class = SELECTED_CLASSES[pred_idx]
        confidence = float(raw_probs[pred_idx])

        return pred_class, confidence, probs_dict, round(latency_ms, 2)

    def predict(self, image_bytes: bytes, model_type: str = "both") -> Dict[str, Any]:
        """
        Executes single-image classifier inference for Lab Evaluation 2.
        model_type: 'baseline' | 'gan_augmented' | 'both'
        """
        if not self._loaded:
            self.load_models()

        input_tensor = self.preprocess_image(image_bytes)
        model_key = model_type.strip().lower()

        results: Dict[str, Any] = {
            "image_size": f"{IMAGE_SIZE}x{IMAGE_SIZE}",
            "normalization": "[0, 1] (/ 255.0)",
            "classes": SELECTED_CLASSES,
            "collapse_note": (
                "Both classifiers exhibit single-class prediction collapse to 'small' "
                "(Clean Test Accuracy: 20.0%). Class probabilities remain closely centered "
                "around ~0.20 per class."
            )
        }

        if model_key in ["baseline", "both"]:
            if self.baseline_model is None:
                raise RuntimeError("Baseline CNN model is not loaded.")
            pred_class, conf, probs, lat = self._predict_single(self.baseline_model, input_tensor)
            results["baseline"] = {
                "model_name": "Baseline CNN",
                "training_set": "616 Real Frames",
                "predicted_class": pred_class,
                "confidence": conf,
                "probabilities": probs,
                "latency_ms": lat
            }

        if model_key in ["gan_augmented", "gan", "both"]:
            if self.gan_augmented_model is None:
                raise RuntimeError("GAN-Augmented CNN model is not loaded.")
            pred_class, conf, probs, lat = self._predict_single(self.gan_augmented_model, input_tensor)
            results["gan_augmented"] = {
                "model_name": "GAN-Augmented CNN",
                "training_set": "1,216 Images (616 Real + 600 Synthetic)",
                "predicted_class": pred_class,
                "confidence": conf,
                "probabilities": probs,
                "latency_ms": lat
            }

        return results

    def generate(self, class_name: str, seed: Optional[int] = None) -> Dict[str, Any]:
        """
        Generates a 64x64 RGB synthetic image using the Conditional DCGAN Generator.
        - Input: Latent Gaussian noise (100-dim) + Class Label (0 to 4)
        - Generator Output: Tanh [-1, 1] rescaled to [0, 255] RGB
        - Returns base64 PNG data URL with metadata.
        """
        import base64

        if self.generator_model is None:
            self.load_models()
            if self.generator_model is None:
                raise RuntimeError("Conditional DCGAN Generator model is not loaded.")

        clean_cls = class_name.strip().lower()
        if clean_cls not in CLASS_TO_IDX:
            raise ValueError(
                f"Invalid class '{class_name}'. Must be one of: {SELECTED_CLASSES}"
            )

        class_idx = CLASS_TO_IDX[clean_cls]

        # Deterministic or random noise generator
        actual_seed = seed if seed is not None else int(time.time() * 1000) % 10000000
        rng = np.random.RandomState(actual_seed)
        noise = rng.randn(1, LATENT_DIM).astype(np.float32)
        label = np.array([[class_idx]], dtype=np.int32)

        start_t = time.perf_counter()
        raw_fake = self.generator_model([noise, label], training=False).numpy()
        gen_latency_ms = (time.perf_counter() - start_t) * 1000.0

        # Rescale tanh [-1, 1] to [0, 1] then [0, 255] uint8
        clipped = np.clip((raw_fake[0] + 1.0) / 2.0, 0.0, 1.0)
        rgb_img = (clipped * 255.0).astype(np.uint8)

        # Convert RGB to BGR for cv2 PNG encoding
        bgr_img = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2BGR)
        success, buf = cv2.imencode(".png", bgr_img)
        if not success:
            raise RuntimeError("Failed to encode generated image to PNG.")

        b64_png = base64.b64encode(buf).decode("utf-8")
        data_url = f"data:image/png;base64,{b64_png}"

        return {
            "success": True,
            "class_name": clean_cls,
            "class_index": class_idx,
            "seed": actual_seed,
            "latency_ms": round(gen_latency_ms, 2),
            "image_data_url": data_url,
            "image_size": f"{IMAGE_SIZE}x{IMAGE_SIZE}",
            "latent_dim": LATENT_DIM,
            "is_live": True,
            "source": "Live Conditional Generator"
        }


# Singleton engine instance
lab_eval2_engine = LabEval2Engine()
