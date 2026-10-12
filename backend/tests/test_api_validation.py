import os
import tempfile
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def create_test_video(output_path: str, num_frames: int = 10) -> str:
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, 10.0, (224, 224))
    for i in range(num_frames):
        frame = np.full((224, 224, 3), (i * 20) % 256, dtype=np.uint8)
        writer.write(frame)
    writer.release()
    return output_path


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data


def test_model_info(client):
    response = client.get("/api/v1/model-info")
    # If model is loaded, status is 200; if missing, 503
    if response.status_code == 200:
        data = response.json()
        assert data["num_classes"] == 76
        assert data["model_id"] == "mobilenetv2"
        assert data["offline_test_accuracy"] == 67.78


def test_recognize_invalid_extension(client):
    response = client.post(
        "/api/v1/recognize",
        files={"video": ("test_file.txt", b"dummy content", "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported video format" in response.json()["detail"]


def test_recognize_empty_file(client):
    response = client.post(
        "/api/v1/recognize",
        files={"video": ("empty_video.mov", b"", "video/quicktime")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_recognize_valid_video_prediction(client):
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        create_test_video(tmp_path, num_frames=12)
        with open(tmp_path, "rb") as video_file:
            response = client.post(
                "/api/v1/recognize",
                files={"video": ("test_gesture.mp4", video_file, "video/mp4")}
            )

        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert data["isMock"] is False
            assert "predictedWord" in data
            assert isinstance(data["predictedWord"], str)
            assert data["confidence"] >= 0.0 and data["confidence"] <= 1.0
            assert data["modelUsed"]["id"] == "mobilenetv2"
            assert len(data["topK"]) == 5
            assert data["preprocessing"]["framesSampled"] == 33
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
