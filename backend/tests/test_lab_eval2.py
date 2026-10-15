import io
import cv2
import pytest
import numpy as np
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def create_test_image_bytes(size: int = 64) -> bytes:
    img = np.full((size, size, 3), 128, dtype=np.uint8)
    # Add a simple shape to simulate a hand pattern
    cv2.circle(img, (size // 2, size // 2), size // 4, (255, 200, 180), -1)
    ok, buf = cv2.imencode(".png", img)
    assert ok
    return buf.tobytes()


def test_lab_eval2_metadata(client):
    response = client.get("/api/v1/lab-eval2/metadata")
    assert response.status_code == 200
    data = response.json()
    assert "overview" in data
    overview = data["overview"]
    assert overview["num_classes"] == 76
    assert len(overview["classes"]) == 76
    assert overview["models"]["baseline"]["clean_accuracy"] == 49.89
    assert overview["models"]["gan_augmented"]["clean_accuracy"] == 29.00


def test_lab_eval2_metrics(client):
    response = client.get("/api/v1/lab-eval2/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "test_comparison" in data
    assert len(data["test_comparison"]) == 2
    assert "robustness" in data
    assert len(data["robustness"]) > 0
    assert "per_class_bias" in data
    assert len(data["per_class_bias"]) > 0


def test_lab_eval2_generation(client):
    response = client.post(
        "/api/v1/lab-eval2/generate",
        json={"class_identifier": "afternoon", "seed": 42}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["class_name"] == "afternoon"
    assert data["class_index"] == 0
    assert data["image_data_url"].startswith("data:image/png;base64,")


def test_lab_eval2_predict_image(client):
    img_bytes = create_test_image_bytes()
    response = client.post(
        "/api/v1/lab-eval2/predict",
        files={"file": ("test_frame.png", img_bytes, "image/png")},
        data={"model": "both"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "baseline" in data
    assert "gan_augmented" in data
    assert "predicted_class" in data["baseline"]
    assert "confidence" in data["baseline"]
    assert "top5" in data["baseline"]
