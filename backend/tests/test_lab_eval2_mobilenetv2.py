import io
import os
import pytest
import numpy as np
import cv2
from fastapi.testclient import TestClient

from app.main import app

SAMPLE_VIDEO_PATH = r"D:\SignBridge\frontend\public\samples\isl_sample_video.mp4"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def create_test_image_bytes(size: int = 64) -> bytes:
    img = np.full((size, size, 3), 120, dtype=np.uint8)
    # Draw simple contrast shapes
    cv2.circle(img, (size // 2, size // 2), size // 4, (255, 180, 160), -1)
    ok, buf = cv2.imencode(".png", img)
    assert ok
    return buf.tobytes()


def test_mobilenetv2_metadata_endpoint(client):
    """Verify MobileNetV2 metadata endpoint returns verified 5-class evaluation results."""
    response = client.get("/api/v1/lab-eval2/mobilenetv2/metadata")
    assert response.status_code == 200
    data = response.json()

    assert data["num_classes"] == 5
    assert data["classes"] == ["bad", "big", "fast", "short", "small"]
    assert "evaluation_results" in data
    assert "dataset_splits" in data
    assert "engine_status" in data

    status = data["engine_status"]
    assert status["baseline_loaded"] is True
    assert status["augmented_loaded"] is True
    assert status["generator_loaded"] is True

    # Check verified evaluation metrics from 3-seed run
    eval_res = data["evaluation_results"]
    assert eval_res["test_set"]["frames"] == 120
    assert eval_res["test_set"]["videos"] == 15
    baseline_acc = eval_res["summary_mean_std_over_seeds"]["baseline"]["accuracy"]["mean"]
    aug_acc = eval_res["summary_mean_std_over_seeds"]["gan_augmented"]["accuracy"]["mean"]
    assert round(baseline_acc, 4) == 0.5556
    assert round(aug_acc, 4) == 0.5556

    # Verify label-fidelity check
    assert "gan_label_fidelity" in eval_res
    fidelity = eval_res["gan_label_fidelity"]["real_trained_model_accuracy_on_gan_images"]
    assert round(fidelity, 4) == 0.1883


def test_mobilenetv2_generate_endpoint(client):
    """Verify live synthetic generation with class-conditional DCGAN."""
    response = client.post(
        "/api/v1/lab-eval2/mobilenetv2/generate",
        json={"class_identifier": "fast", "seed": 42}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["class_name"] == "fast"
    assert data["classifier_class_index"] == 2
    assert data["gan_label_index"] == 4  # 'fast' is index 4 in GAN order: small(0), short(1), bad(2), big(3), fast(4)
    assert data["image_data_url"].startswith("data:image/png;base64,")


def test_mobilenetv2_predict_image_endpoint(client):
    """Verify dual inference on a static frame image with raw pixel values."""
    img_bytes = create_test_image_bytes(size=64)
    response = client.post(
        "/api/v1/lab-eval2/mobilenetv2/predict-image",
        files={"file": ("test_frame.png", img_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "baseline" in data
    assert "gan_augmented" in data
    assert "is_agreement" in data

    b = data["baseline"]
    a = data["gan_augmented"]
    assert b["predicted_class"] in ["bad", "big", "fast", "short", "small"]
    assert a["predicted_class"] in ["bad", "big", "fast", "short", "small"]
    assert 0.0 <= b["confidence"] <= 1.0
    assert 0.0 <= a["confidence"] <= 1.0
    assert b["latency_ms"] > 0
    assert a["latency_ms"] > 0


def test_mobilenetv2_predict_video_real_sample(client):
    """Verify video inference extracting 8 evenly spaced frames and pooling probabilities."""
    assert os.path.exists(SAMPLE_VIDEO_PATH), f"Sample video missing at {SAMPLE_VIDEO_PATH}"
    with open(SAMPLE_VIDEO_PATH, "rb") as f:
        video_bytes = f.read()

    response = client.post(
        "/api/v1/lab-eval2/mobilenetv2/predict-video",
        files={"video": ("isl_sample_video.mp4", io.BytesIO(video_bytes), "video/mp4")},
        data={"n_frames": 8}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["metadata"]["frames_sampled"] == 8
    assert "video_prediction" in data
    assert "frame_predictions" in data
    assert len(data["frame_predictions"]) == 8

    vid_pred = data["video_prediction"]
    assert "baseline" in vid_pred
    assert "gan_augmented" in vid_pred
    assert vid_pred["baseline"]["predicted_class"] in ["bad", "big", "fast", "short", "small"]
    assert vid_pred["gan_augmented"]["predicted_class"] in ["bad", "big", "fast", "short", "small"]
    assert len(vid_pred["baseline"]["probabilities"]) == 5


def test_original_pipeline_preservation(client):
    """Ensure original SignBridge models remain loaded and separate."""
    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == 200
    health = health_resp.json()
    assert health["status"] == "healthy"
    assert health["model_loaded"] is True
    assert health["models"]["mobilenetv2"] is True
    assert health["models"]["custom_cnn"] is True
    assert health["models"]["cnn_lstm"] is True
    assert health["models"]["late_fusion"] is True
