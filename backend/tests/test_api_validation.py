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
    assert "models" in data
    assert "mobilenetv2" in data["models"]
    assert "custom_cnn" in data["models"]
    assert "cnn_lstm" in data["models"]
    assert data["default_model"] == "mobilenetv2"


def test_model_info_summary(client):
    response = client.get("/api/v1/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    model_ids = [m["id"] for m in data["models"]]
    assert "mobilenetv2" in model_ids
    assert "custom_cnn" in model_ids
    assert "cnn_lstm" in model_ids


def test_model_info_specific(client):
    for model_key in ["mobilenetv2", "custom_cnn", "cnn_lstm"]:
        response = client.get(f"/api/v1/model-info?model={model_key}")
        if response.status_code == 200:
            data = response.json()
            assert data["model_id"] == model_key
            assert data["num_classes"] == 76
            assert "architecture" in data


def test_recognize_invalid_model(client):
    response = client.post(
        "/api/v1/recognize",
        data={"model": "non_existent_fancy_model"},
        files={"video": ("test_file.mp4", b"dummy content", "video/mp4")}
    )
    assert response.status_code == 400
    assert "Unknown model" in response.json()["detail"]


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


def test_recognize_default_model_is_mobilenetv2(client):
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
            assert data["modelUsed"]["id"] == "mobilenetv2"
            assert data["modelUsed"]["testAccuracy"] == 67.78
            assert len(data["topK"]) == 5
            assert data["confidence"] >= 0.0 and data["confidence"] <= 1.0
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_recognize_custom_cnn(client):
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        create_test_video(tmp_path, num_frames=12)
        with open(tmp_path, "rb") as video_file:
            response = client.post(
                "/api/v1/recognize",
                data={"model": "custom_cnn"},
                files={"video": ("test_gesture.mp4", video_file, "video/mp4")}
            )

        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert data["isMock"] is False
            assert data["modelUsed"]["id"] == "custom_cnn"
            assert data["modelUsed"]["testAccuracy"] == 5.00
            assert len(data["topK"]) == 5
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_recognize_cnn_lstm(client):
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        create_test_video(tmp_path, num_frames=12)
        with open(tmp_path, "rb") as video_file:
            response = client.post(
                "/api/v1/recognize",
                data={"model": "cnn_lstm"},
                files={"video": ("test_gesture.mp4", video_file, "video/mp4")}
            )

        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert data["isMock"] is False
            assert data["modelUsed"]["id"] == "cnn_lstm"
            assert data["modelUsed"]["testAccuracy"] == 4.44
            assert len(data["topK"]) == 5
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_recognize_late_fusion(client):
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        create_test_video(tmp_path, num_frames=12)
        with open(tmp_path, "rb") as video_file:
            response = client.post(
                "/api/v1/recognize",
                data={"model": "late_fusion"},
                files={"video": ("test_gesture.mp4", video_file, "video/mp4")}
            )

        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert data["isMock"] is False
            assert data["modelUsed"]["id"] == "late_fusion"
            assert len(data["topK"]) == 5
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_compare_endpoint(client):
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        create_test_video(tmp_path, num_frames=12)
        with open(tmp_path, "rb") as video_file:
            response = client.post(
                "/api/v1/compare",
                files={"video": ("test_gesture.mp4", video_file, "video/mp4")}
            )

        if response.status_code == 200:
            data = response.json()
            assert data["isMockData"] is False
            assert "primaryPrediction" in data
            assert "models" in data
            assert "mobilenetv2" in data["models"]
            assert "custom-cnn" in data["models"]
            assert "cnn-lstm" in data["models"]
            assert "agreementStatus" in data
            assert isinstance(data["agreementStatus"]["allAgree"], bool)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_recognize_webm_file(client):
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        create_test_video(tmp_path, num_frames=12)
        with open(tmp_path, "rb") as video_file:
            response = client.post(
                "/api/v1/recognize",
                files={"video": ("test_webcam.webm", video_file, "video/webm")}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["isMock"] is False
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

