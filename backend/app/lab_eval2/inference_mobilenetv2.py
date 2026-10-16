import base64
import csv
import io
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np

from app.lab_eval2.config import (
    MOBILENETV2_BASELINE_PATH,
    MOBILENETV2_AUGMENTED_PATH,
    MOBILENETV2_GENERATOR_PATH,
    MOBILENETV2_CLASS_MAPPING_PATH,
    MOBILENETV2_RUN_CONFIG_PATH,
    MOBILENETV2_DATASET_SPLITS_PATH,
    MOBILENETV2_TRAINING_DETAILS_PATH,
    MOBILENETV2_EVALUATION_RESULTS_PATH,
    MOBILENETV2_CLASSIFICATION_REPORTS_PATH,
    MOBILENETV2_CONFUSION_MATRICES_PATH,
    MOBILENETV2_LATENCY_CSV_PATH,
    MOBILENETV2_ROBUSTNESS_CSV_PATH,
    MOBILENETV2_PER_CLASS_METRICS_PATH,
    MOBILENETV2_PER_SEED_RESULTS_PATH,
    MOBILENETV2_SUMMARY_MEAN_STD_PATH,
    MOBILENETV2_GAN_LOSSES_PATH,
    MOBILENETV2_INPUT_SIZE,
    MOBILENETV2_INTERNAL_SIZE,
    MOBILENETV2_NUM_CLASSES,
    MOBILENETV2_CLASSES,
    MOBILENETV2_GAN_LABEL_ORDER,
    MOBILENETV2_FRAMES_PER_VIDEO,
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_VIDEO_EXTENSIONS,
)

logger = logging.getLogger("signbridge.lab_eval2.mobilenetv2")


class GanMobileNetV2Engine:
    """
    Dedicated inference service for Lab Evaluation 2 — GAN + MobileNetV2 experiment.
    Loads and runs both Baseline and GAN-Augmented fine-tuned MobileNetV2 models (5 ISL classes:
    'bad', 'big', 'fast', 'short', 'small') and the conditional DCGAN generator.
    """

    def __init__(self):
        self._baseline_model = None
        self._augmented_model = None
        self._generator_model = None
        self._classes = MOBILENETV2_CLASSES
        self._gan_label_order = MOBILENETV2_GAN_LABEL_ORDER
        self._class_to_idx = {name: idx for idx, name in enumerate(self._classes)}
        self._gan_class_to_idx = {name: idx for idx, name in enumerate(self._gan_label_order)}

    def load_models(self) -> Dict[str, bool]:
        """Loads baseline, GAN-augmented, and generator Keras models into memory if available."""
        import keras

        status = {
            "baseline": False,
            "augmented": False,
            "generator": False
        }

        # 1. Baseline MobileNetV2 Model
        if self._baseline_model is None and MOBILENETV2_BASELINE_PATH.exists():
            try:
                logger.info(f"Loading Baseline MobileNetV2 from {MOBILENETV2_BASELINE_PATH.name}...")
                self._baseline_model = keras.models.load_model(str(MOBILENETV2_BASELINE_PATH), compile=False)
                status["baseline"] = True
            except Exception as e:
                logger.error(f"Failed to load Baseline MobileNetV2: {e}")
        elif self._baseline_model is not None:
            status["baseline"] = True

        # 2. GAN-Augmented MobileNetV2 Model
        if self._augmented_model is None and MOBILENETV2_AUGMENTED_PATH.exists():
            try:
                logger.info(f"Loading GAN-Augmented MobileNetV2 from {MOBILENETV2_AUGMENTED_PATH.name}...")
                self._augmented_model = keras.models.load_model(str(MOBILENETV2_AUGMENTED_PATH), compile=False)
                status["augmented"] = True
            except Exception as e:
                logger.error(f"Failed to load GAN-Augmented MobileNetV2: {e}")
        elif self._augmented_model is not None:
            status["augmented"] = True

        # 3. Conditional DCGAN Generator
        if self._generator_model is None and MOBILENETV2_GENERATOR_PATH.exists():
            try:
                logger.info(f"Loading MobileNetV2 Conditional Generator from {MOBILENETV2_GENERATOR_PATH.name}...")
                self._generator_model = keras.models.load_model(str(MOBILENETV2_GENERATOR_PATH), compile=False)
                status["generator"] = True
            except Exception as e:
                logger.error(f"Failed to load Generator: {e}")
        elif self._generator_model is not None:
            status["generator"] = True

        return status

    def status(self) -> Dict[str, Any]:
        """Returns the readiness status of all models and artifact paths."""
        return {
            "baseline_loaded": self._baseline_model is not None,
            "augmented_loaded": self._augmented_model is not None,
            "generator_loaded": self._generator_model is not None,
            "classes_count": len(self._classes),
            "classes": self._classes,
            "baseline_path_exists": MOBILENETV2_BASELINE_PATH.exists(),
            "augmented_path_exists": MOBILENETV2_AUGMENTED_PATH.exists(),
            "generator_path_exists": MOBILENETV2_GENERATOR_PATH.exists(),
            "evaluation_results_exists": MOBILENETV2_EVALUATION_RESULTS_PATH.exists(),
        }

    def preprocess_frame(self, bgr_image: np.ndarray) -> np.ndarray:
        """
        Exact preprocessing required by the MobileNetV2 checkpoints:
        - Convert BGR to RGB
        - Resize to 64x64
        - Cast to float32
        - KEEP RAW PIXELS [0.0, 255.0] (no / 255.0, no preprocess_input - resizing to 128 and
          scaling to [-1, 1] are handled internally by the Keras model graph).
        """
        rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(rgb, (MOBILENETV2_INPUT_SIZE, MOBILENETV2_INPUT_SIZE))
        return resized.astype(np.float32)

    def predict_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Runs simultaneous dual inference on a single static image using both
        the Baseline MobileNetV2 and GAN-augmented MobileNetV2 checkpoints.
        """
        self.load_models()
        if self._baseline_model is None or self._augmented_model is None:
            raise RuntimeError("One or both MobileNetV2 checkpoints could not be loaded.")

        # Decode image
        arr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Failed to decode image file. Please upload a valid image.")

        preprocessed = self.preprocess_frame(img_bgr)
        batch = np.expand_dims(preprocessed, axis=0)

        # 1. Baseline prediction
        t0 = time.perf_counter()
        base_probs = self._baseline_model.predict(batch, verbose=0)[0]
        base_ms = (time.perf_counter() - t0) * 1000

        # 2. GAN-augmented prediction
        t1 = time.perf_counter()
        aug_probs = self._augmented_model.predict(batch, verbose=0)[0]
        aug_ms = (time.perf_counter() - t1) * 1000

        base_idx = int(np.argmax(base_probs))
        aug_idx = int(np.argmax(aug_probs))

        base_class = self._classes[base_idx]
        aug_class = self._classes[aug_idx]

        base_conf = float(base_probs[base_idx])
        aug_conf = float(aug_probs[aug_idx])

        # Top candidates
        top_k = min(3, len(self._classes))
        base_topk_idx = np.argsort(base_probs)[::-1][:top_k]
        aug_topk_idx = np.argsort(aug_probs)[::-1][:top_k]

        base_topk = [
            {"class_name": self._classes[int(i)], "confidence": float(base_probs[i])}
            for i in base_topk_idx
        ]
        aug_topk = [
            {"class_name": self._classes[int(i)], "confidence": float(aug_probs[i])}
            for i in aug_topk_idx
        ]

        # Thumbnail
        ok, buf = cv2.imencode(".jpg", img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        thumb_b64 = base64.b64encode(buf.tobytes()).decode("utf-8") if ok else ""

        return {
            "is_agreement": base_class == aug_class,
            "baseline": {
                "predicted_class": base_class,
                "predicted_index": base_idx,
                "confidence": base_conf,
                "top_k": base_topk,
                "latency_ms": round(base_ms, 2),
            },
            "gan_augmented": {
                "predicted_class": aug_class,
                "predicted_index": aug_idx,
                "confidence": aug_conf,
                "top_k": aug_topk,
                "latency_ms": round(aug_ms, 2),
            },
            "thumbnail_base64": thumb_b64,
            "preprocessing": {
                "input_resolution": f"{MOBILENETV2_INPUT_SIZE}x{MOBILENETV2_INPUT_SIZE}",
                "scaling": "Raw [0-255] RGB float32 (internal model rescaling to 128x128 [-1,1])",
            }
        }

    def predict_video(
        self,
        video_bytes: bytes,
        n_frames: int = MOBILENETV2_FRAMES_PER_VIDEO
    ) -> Dict[str, Any]:
        """
        Extracts n evenly spaced frames across the video (exact evaluation strategy),
        evaluates each frame with both Baseline and GAN-augmented MobileNetV2 models,
        and aggregates video-level predictions via mean probability pooling.
        """
        self.load_models()
        if self._baseline_model is None or self._augmented_model is None:
            raise RuntimeError("One or both MobileNetV2 checkpoints could not be loaded.")

        # Write to temporary memory buffer using OpenCV via memory-mapped Virtual File or temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        try:
            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                raise ValueError("Could not open uploaded video stream.")

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)
            duration_sec = total_frames / fps if fps > 0 else 0.0

            if total_frames <= 0:
                cap.release()
                raise ValueError("Video contains no readable frames.")

            frame_indices = np.linspace(0, total_frames - 1, n_frames, dtype=int)
            extracted_frames = []
            frame_records = []

            for step, f_idx in enumerate(frame_indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(f_idx))
                ok, bgr = cap.read()
                if not ok:
                    continue

                ts = float(f_idx) / fps if fps > 0 else 0.0
                prep = self.preprocess_frame(bgr)
                extracted_frames.append(prep)

                # Thumbnail
                thumb_rgb = cv2.resize(bgr, (96, 96))
                _, buf = cv2.imencode(".jpg", thumb_rgb, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                thumb_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

                frame_records.append({
                    "step": step,
                    "frame_num": int(f_idx),
                    "timestamp_sec": round(ts, 2),
                    "thumbnail_base64": thumb_b64,
                })

            cap.release()
        finally:
            Path(tmp_path).unlink(missing_ok=True)

        if not extracted_frames:
            raise RuntimeError("Failed to extract any valid frames from the video.")

        batch = np.array(extracted_frames, dtype=np.float32)

        # Baseline inference on all frames
        t0 = time.perf_counter()
        base_probs_all = self._baseline_model.predict(batch, verbose=0)
        base_elapsed = (time.perf_counter() - t0) * 1000

        # Augmented inference on all frames
        t1 = time.perf_counter()
        aug_probs_all = self._augmented_model.predict(batch, verbose=0)
        aug_elapsed = (time.perf_counter() - t1) * 1000

        # Frame-level details
        per_frame_results = []
        for i in range(len(frame_records)):
            bp = base_probs_all[i]
            ap = aug_probs_all[i]

            b_idx = int(np.argmax(bp))
            a_idx = int(np.argmax(ap))
            b_class = self._classes[b_idx]
            a_class = self._classes[a_idx]

            rec = dict(frame_records[i])
            rec.update({
                "baseline_pred": b_class,
                "baseline_conf": float(bp[b_idx]),
                "augmented_pred": a_class,
                "augmented_conf": float(ap[a_idx]),
                "agreement": b_class == a_class
            })
            per_frame_results.append(rec)

        # Video-level prediction = mean probability pooling
        base_mean_probs = np.mean(base_probs_all, axis=0)
        aug_mean_probs = np.mean(aug_probs_all, axis=0)

        base_vid_idx = int(np.argmax(base_mean_probs))
        aug_vid_idx = int(np.argmax(aug_mean_probs))

        base_vid_class = self._classes[base_vid_idx]
        aug_vid_class = self._classes[aug_vid_idx]

        return {
            "metadata": {
                "total_frames": total_frames,
                "fps": round(fps, 1),
                "duration_seconds": round(duration_sec, 2),
                "frames_sampled": len(extracted_frames),
                "sampling_strategy": f"{n_frames} evenly spaced frames (np.linspace)",
            },
            "video_prediction": {
                "is_agreement": base_vid_class == aug_vid_class,
                "baseline": {
                    "predicted_class": base_vid_class,
                    "confidence": float(base_mean_probs[base_vid_idx]),
                    "probabilities": {self._classes[i]: float(base_mean_probs[i]) for i in range(len(self._classes))},
                    "latency_ms": round(base_elapsed, 2),
                },
                "gan_augmented": {
                    "predicted_class": aug_vid_class,
                    "confidence": float(aug_mean_probs[aug_vid_idx]),
                    "probabilities": {self._classes[i]: float(aug_mean_probs[i]) for i in range(len(self._classes))},
                    "latency_ms": round(aug_elapsed, 2),
                }
            },
            "frame_predictions": per_frame_results
        }

    def generate(self, class_identifier: Union[str, int], seed: Optional[int] = None) -> Dict[str, Any]:
        """
        Synthesizes a 64x64 RGB sign image using the teammate's Conditional DCGAN Generator.
        Takes into account the GAN's specific label index ordering:
        ['small', 'short', 'bad', 'big', 'fast'].
        """
        self.load_models()
        if self._generator_model is None:
            raise RuntimeError("MobileNetV2 Conditional Generator checkpoint not available.")

        # Resolve class index into GAN order
        if isinstance(class_identifier, int):
            if 0 <= class_identifier < len(self._classes):
                # Assumed classifier order index -> map to class name first
                class_name = self._classes[class_identifier]
            else:
                raise ValueError(f"Class index out of range 0..{len(self._classes)-1}")
        elif isinstance(class_identifier, str):
            clean = class_identifier.strip().lower()
            if clean in self._class_to_idx:
                class_name = clean
            else:
                raise ValueError(f"Unknown class '{class_identifier}'. Valid classes: {self._classes}")
        else:
            raise ValueError("Invalid class identifier.")

        gan_idx = self._gan_class_to_idx[class_name]

        t0 = time.perf_counter()
        if seed is not None:
            rng = np.random.RandomState(seed)
            noise = rng.normal(0, 1, (1, 100)).astype(np.float32)
        else:
            noise = np.random.normal(0, 1, (1, 100)).astype(np.float32)

        label_arr = np.array([gan_idx], dtype=np.int32)
        fake_tensor = self._generator_model.predict([noise, label_arr], verbose=0)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        # Generator output is tanh in [-1, 1] -> convert to [0, 255] uint8
        img_np = np.clip((fake_tensor[0] + 1.0) * 127.5, 0, 255).astype(np.uint8)

        # Convert RGB to BGR for cv2 encoding
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        ok, buf = cv2.imencode(".png", img_bgr)
        if not ok:
            raise RuntimeError("Failed to encode synthesized image.")

        img_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

        return {
            "success": True,
            "class_name": class_name,
            "classifier_class_index": self._class_to_idx[class_name],
            "gan_label_index": gan_idx,
            "seed": seed,
            "latency_ms": round(elapsed_ms, 2),
            "image_size": f"{MOBILENETV2_INPUT_SIZE}x{MOBILENETV2_INPUT_SIZE}x3",
            "image_data_url": f"data:image/png;base64,{img_b64}",
            "note": "Generator output denormalized from [-1, 1] tanh to [0, 255] uint8."
        }

    def get_metadata(self) -> Dict[str, Any]:
        """
        Reads and returns all verified evaluation results, dataset split counts,
        training details, robustness, and latency data from package files.
        """
        def _read_json(path: Path) -> Dict[str, Any]:
            if path.exists():
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as e:
                    logger.warning(f"Failed to read {path.name}: {e}")
            return {}

        def _read_csv(path: Path) -> List[Dict[str, Any]]:
            if path.exists():
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        reader = csv.DictReader(f)
                        return list(reader)
                except Exception as e:
                    logger.warning(f"Failed to read {path.name}: {e}")
            return []

        eval_results = _read_json(MOBILENETV2_EVALUATION_RESULTS_PATH)
        split_counts = _read_json(MOBILENETV2_DATASET_SPLITS_PATH)
        training_details = _read_json(MOBILENETV2_TRAINING_DETAILS_PATH)
        run_config = _read_json(MOBILENETV2_RUN_CONFIG_PATH)
        classification_reports = _read_json(MOBILENETV2_CLASSIFICATION_REPORTS_PATH)
        confusion_matrices = _read_json(MOBILENETV2_CONFUSION_MATRICES_PATH)
        latency_rows = _read_csv(MOBILENETV2_LATENCY_CSV_PATH)
        robustness_rows = _read_csv(MOBILENETV2_ROBUSTNESS_CSV_PATH)
        per_class_metrics = _read_csv(MOBILENETV2_PER_CLASS_METRICS_PATH)
        per_seed_results = _read_csv(MOBILENETV2_PER_SEED_RESULTS_PATH)
        summary_mean_std = _read_csv(MOBILENETV2_SUMMARY_MEAN_STD_PATH)
        gan_losses = _read_csv(MOBILENETV2_GAN_LOSSES_PATH)

        return {
            "experiment": "Lab Evaluation 2 — Comparative GAN + MobileNetV2 for ISL",
            "classes": self._classes,
            "num_classes": len(self._classes),
            "input_shape": f"{MOBILENETV2_INPUT_SIZE}x{MOBILENETV2_INPUT_SIZE}x3",
            "internal_shape": f"{MOBILENETV2_INTERNAL_SIZE}x{MOBILENETV2_INTERNAL_SIZE}x3",
            "evaluation_results": eval_results,
            "dataset_splits": split_counts,
            "training_details": training_details,
            "run_config": run_config,
            "classification_reports": classification_reports,
            "confusion_matrices": confusion_matrices,
            "latency": latency_rows,
            "robustness": robustness_rows,
            "per_class_metrics": per_class_metrics,
            "per_seed_results": per_seed_results,
            "summary_mean_std": summary_mean_std,
            "gan_losses": gan_losses,
            "engine_status": self.status()
        }


# Singleton engine instance
gan_mobilenetv2_engine = GanMobileNetV2Engine()
