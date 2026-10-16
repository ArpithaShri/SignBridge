import io
import os
import pytest
import numpy as np
from fastapi.testclient import TestClient

from app.main import app

SAMPLE_VIDEO_PATH = r"D:\SignBridge\frontend\public\samples\isl_sample_video.mp4"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_video_upload_validation_invalid_extension(client):
    """Ensure invalid file extensions are rejected with 400 Bad Request."""
    fake_txt = io.BytesIO(b"This is not a video file.")
    response = client.post(
        "/api/v1/lab-eval2/extract-frames",
        files={"video": ("test.txt", fake_txt, "text/plain")},
        data={"sampling_strategy": "uniform", "max_frames": 5}
    )
    assert response.status_code == 400
    assert "Unsupported video format" in response.json()["detail"]


def test_video_upload_validation_empty_content(client):
    """Ensure zero-byte uploads are rejected with 400 Bad Request."""
    empty_mp4 = io.BytesIO(b"")
    response = client.post(
        "/api/v1/lab-eval2/extract-frames",
        files={"video": ("empty.mp4", empty_mp4, "video/mp4")},
        data={"sampling_strategy": "uniform", "max_frames": 5}
    )
    assert response.status_code == 400
    assert "Uploaded video file is empty" in response.json()["detail"]


def test_extract_video_frames_real_sample(client):
    """Extract frames from the real ISL sample video with timestamps and base64 thumbnails."""
    assert os.path.exists(SAMPLE_VIDEO_PATH), f"Sample video missing at {SAMPLE_VIDEO_PATH}"
    with open(SAMPLE_VIDEO_PATH, "rb") as f:
        video_bytes = f.read()

    response = client.post(
        "/api/v1/lab-eval2/extract-frames",
        files={"video": ("isl_sample_video.mp4", io.BytesIO(video_bytes), "video/mp4")},
        data={"sampling_strategy": "uniform", "max_frames": 5}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["frames"]) == 5
    assert data["metadata"]["fps"] > 0
    assert data["metadata"]["duration_seconds"] > 0
    assert data["metadata"]["total_frames"] > 0

    first_frame = data["frames"][0]
    assert "frame_index" in first_frame
    assert "timestamp_sec" in first_frame
    assert "thumbnail" in first_frame
    assert len(first_frame["thumbnail"]) > 50


def test_dual_video_inference_real_sample(client):
    """Test simultaneous frame-level dual inference for Baseline CNN & DCGAN + CNN."""
    assert os.path.exists(SAMPLE_VIDEO_PATH)
    with open(SAMPLE_VIDEO_PATH, "rb") as f:
        video_bytes = f.read()

    response = client.post(
        "/api/v1/lab-eval2/video-infer",
        files={"video": ("isl_sample_video.mp4", io.BytesIO(video_bytes), "video/mp4")},
        data={
            "sampling_strategy": "uniform",
            "max_frames": 3,
            "selected_indices": "0,1,2"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_frames_evaluated"] == 3
    assert len(data["frame_results"]) == 3
    assert "agreement_rate_percent" in data

    frame_0 = data["frame_results"][0]
    assert "baseline" in frame_0
    assert "gan_augmented" in frame_0
    assert "agreement" in frame_0
    assert "top3" in frame_0["baseline"]
    assert "top3" in frame_0["gan_augmented"]
    assert len(frame_0["baseline"]["top3"]) == 3


def test_cnn_lstm_metadata(client):
    """Verify CNN-LSTM metadata endpoint and 76-class vocabulary configuration."""
    response = client.get("/api/v1/lab-eval2/cnn-lstm/metadata")
    assert response.status_code == 200
    data = response.json()
    assert "overview" in data
    assert data["overview"]["sequence_frames"] == 33
    assert "112" in data["overview"]["image_size"]
    assert data["overview"]["num_classes"] == 76
    assert len(data["overview"]["classes"]) == 76
    assert round(data["baseline_summary"]["test_accuracy_percent"], 2) == 4.44
    assert data["engine_status"]["baseline_lstm_loaded"] is True
    assert data["engine_status"]["generator_loaded"] is True


def test_cnn_lstm_video_predict_real_sample(client):
    """Test 33-frame sequence extraction and real CNN-LSTM sequence classification."""
    assert os.path.exists(SAMPLE_VIDEO_PATH)
    with open(SAMPLE_VIDEO_PATH, "rb") as f:
        video_bytes = f.read()

    response = client.post(
        "/api/v1/lab-eval2/cnn-lstm/predict-video",
        files={"video": ("isl_sample_video.mp4", io.BytesIO(video_bytes), "video/mp4")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["metadata"]["sequence_frames"] == 33
    assert data["metadata"]["frame_resolution"] == "112x112"
    assert len(data["preview_thumbnails"]) == 5

    baseline = data["baseline_cnn_lstm"]
    assert baseline["status"] == "success"
    assert isinstance(baseline["predicted_class"], str)
    assert baseline["confidence"] >= 0.0
    assert len(baseline["top5"]) == 5

    # Check honest reporting for missing augmented sequence model
    augmented = data["gan_augmented_cnn_lstm"]
    assert augmented["status"] == "awaiting_checkpoint"
    assert augmented["is_available"] is False
    assert "teammate package" in augmented["message"]


def test_cnn_lstm_generate(client):
    """Test live synthesis from the teammate's conditional DCGAN generator."""
    response = client.post(
        "/api/v1/lab-eval2/cnn-lstm/generate",
        json={"class_identifier": "afternoon", "seed": 100}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["class_name"] == "afternoon"
    assert "64" in data["image_size"]
    assert data["image_data_url"].startswith("data:image/png;base64,")


def test_cnn_lstm_history(client):
    """Test retrieval of DCGAN training history from logs."""
    response = client.get("/api/v1/lab-eval2/cnn-lstm/history")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_epochs"] >= 0


def test_original_signbridge_pipeline_preservation(client):
    """Verify that the original 4-model recognition pipeline is untouched and functional."""
    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == 200
    health = health_resp.json()
    assert health["status"] == "healthy"
    assert health["model_loaded"] is True
    assert "models" in health
    assert health["models"]["mobilenetv2"] is True
    assert health["models"]["custom_cnn"] is True
    assert health["models"]["cnn_lstm"] is True
    assert health["models"]["late_fusion"] is True
