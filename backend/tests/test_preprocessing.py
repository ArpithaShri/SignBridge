import os
import tempfile
import cv2
import numpy as np
import pytest
from pathlib import Path

from app.preprocessing import extract_rgb_frames


def create_synthetic_test_video(output_path: str, num_frames: int = 15, width: int = 320, height: int = 240) -> str:
    """Helper to generate a valid MPEG-4 test video using OpenCV."""
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, 10.0, (width, height))
    
    for i in range(num_frames):
        # Generate varied RGB gradient frames
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        frame[:, :, 0] = (i * 15) % 256
        frame[:, :, 1] = 128
        frame[:, :, 2] = 200
        writer.write(frame)
    
    writer.release()
    return output_path


def test_extract_rgb_frames_success():
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        create_synthetic_test_video(tmp_path, num_frames=20)
        frames = extract_rgb_frames(tmp_path, num_frames=33, image_size=224)

        # Assert shape, dimensions and dtype
        assert isinstance(frames, np.ndarray)
        assert frames.shape == (33, 224, 224, 3)
        assert frames.dtype == np.float32
        assert frames.min() >= 0.0
        assert frames.max() <= 255.0
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_extract_rgb_frames_invalid_file():
    with pytest.raises(ValueError):
        extract_rgb_frames("non_existent_video_file_xyz.mp4", num_frames=33)
