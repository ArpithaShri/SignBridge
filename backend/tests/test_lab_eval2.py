import io
import pytest
from fastapi.testclient import TestClient
import numpy as np
import cv2

from app.main import app

client = TestClient(app)


def test_lab_eval2_metadata():
    """Verify Lab Evaluation 2 metadata matches experiment specification."""
    response = client.get("/api/v1/lab-eval2/metadata")
    assert response.status_code == 200
    data = response.json()
    
    overview = data["overview"]
    assert overview["num_classes"] == 5
    assert set(overview["classes"]) == {"small", "short", "bad", "big", "fast"}
    assert overview["real_train_images"] == 616
    assert overview["synthetic_train_images"] == 600
    assert overview["augmented_train_images"] == 1216
    assert overview["image_size"] == 64
    assert overview["latent_dim"] == 100


def test_lab_eval2_metrics():
    """Verify authentic experimental metrics are served accurately."""
    response = client.get("/api/v1/lab-eval2/metrics")
    assert response.status_code == 200
    data = response.json()

    clean_metrics = data["clean_test_metrics"]
    assert len(clean_metrics) >= 2

    # Verify both models achieved 20% clean accuracy
    models_found = {row["Model"]: row["Accuracy (%)"] for row in clean_metrics}
    assert "Baseline CNN" in models_found
    assert "GAN-augmented CNN" in models_found
    assert models_found["Baseline CNN"] == 20.0
    assert models_found["GAN-augmented CNN"] == 20.0

    # Verify conclusion reports mode collapse
    conclusion = data["scientific_conclusion"]
    assert conclusion["mode_collapse"] is True
    assert conclusion["clean_accuracy"] == 20.0
    assert conclusion["gan_augmented_better"] is False


def test_lab_eval2_gallery():
    """Verify gallery endpoint returns indexed samples with valid URLs."""
    response = client.get("/api/v1/lab-eval2/gallery")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    assert len(data["items"]) == data["count"]

    first_item = data["items"][0]
    assert "filename" in first_item
    assert "class_name" in first_item
    assert "url" in first_item
    assert first_item["url"].startswith("/api/v1/lab-eval2/artifact-image/gallery/")


def test_lab_eval2_plots():
    """Verify plots catalog endpoint returns confusion matrices and training curves."""
    response = client.get("/api/v1/lab-eval2/plots")
    assert response.status_code == 200
    data = response.json()
    plots = data["plots"]
    plot_ids = [p["id"] for p in plots]

    assert "baseline_confusion_matrix" in plot_ids
    assert "gan_augmented_confusion_matrix" in plot_ids
    assert "training_curves_accuracy" in plot_ids
    assert "training_curves_loss" in plot_ids
    assert "dcgan_training_loss" in plot_ids


def test_lab_eval2_artifact_image_serving_and_security():
    """Verify secure artifact image serving and path traversal prevention."""
    # Valid plot serving
    res_valid = client.get("/api/v1/lab-eval2/artifact-image/plots/training_curves_accuracy.png")
    assert res_valid.status_code == 200
    assert res_valid.headers["content-type"] == "image/png"

    # Non-existent image
    res_404 = client.get("/api/v1/lab-eval2/artifact-image/plots/non_existent_plot_12345.png")
    assert res_404.status_code == 404

    # Invalid category
    res_bad_cat = client.get("/api/v1/lab-eval2/artifact-image/passwords/file.png")
    assert res_bad_cat.status_code == 400

    # Path traversal attack attempt
    res_traversal = client.get("/api/v1/lab-eval2/artifact-image/plots/..%2F..%2Fmain.py")
    assert res_traversal.status_code in [400, 403, 404]


def test_lab_eval2_conditional_generation():
    """Verify class-conditioned synthetic image generation produces valid 64x64 PNG."""
    payload = {"class_name": "bad", "seed": 42}
    response = client.post("/api/v1/lab-eval2/generate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["class_name"] == "bad"
    assert data["class_index"] == 2
    assert data["image_size"] == "64x64"
    assert data["is_live"] is True
    assert data["image_data_url"].startswith("data:image/png;base64,")

    # Invalid class name rejected
    res_invalid = client.post("/api/v1/lab-eval2/generate", json={"class_name": "unknown_class"})
    assert res_invalid.status_code == 400


def test_lab_eval2_predict_validation():
    """Verify input validation on image classification endpoint."""
    # Unsupported extension
    res_invalid_ext = client.post(
        "/api/v1/lab-eval2/predict",
        files={"image": ("test.txt", b"plain text content", "text/plain")}
    )
    assert res_invalid_ext.status_code == 400

    # Empty file
    res_empty = client.post(
        "/api/v1/lab-eval2/predict",
        files={"image": ("empty.png", b"", "image/png")}
    )
    assert res_empty.status_code == 400


def test_lab_eval2_predict_live_inference():
    """Verify live classifier prediction on a synthetic 64x64 RGB image."""
    # Create a synthetic 64x64 dummy PNG
    img = np.zeros((64, 64, 3), dtype=np.uint8)
    img[16:48, 16:48] = [120, 200, 255]
    success, encoded = cv2.imencode(".png", img)
    assert success

    response = client.post(
        "/api/v1/lab-eval2/predict",
        files={"image": ("sample.png", encoded.tobytes(), "image/png")},
        data={"model": "both"}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "baseline" in data
    assert "gan_augmented" in data

    baseline = data["baseline"]
    assert "predicted_class" in baseline
    assert baseline["predicted_class"] in ["small", "short", "bad", "big", "fast"]
    assert "confidence" in baseline
    assert "probabilities" in baseline
    assert len(baseline["probabilities"]) == 5
    assert baseline["latency_ms"] >= 0

    gan_aug = data["gan_augmented"]
    assert "predicted_class" in gan_aug
    assert gan_aug["predicted_class"] in ["small", "short", "bad", "big", "fast"]
    assert "confidence" in gan_aug
    assert "probabilities" in gan_aug
    assert len(gan_aug["probabilities"]) == 5
    assert gan_aug["latency_ms"] >= 0
