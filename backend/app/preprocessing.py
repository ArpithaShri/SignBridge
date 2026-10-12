import cv2
import numpy as np
from pathlib import Path
from typing import Union, List

from app.config import (
    FRAMES_PER_VIDEO,
    IMAGE_SIZE_DEFAULT,
    IMAGE_SIZE_LSTM,
    normalize_model_id
)


def decode_video_frames(
    video_path: Union[str, Path],
    num_frames: int = FRAMES_PER_VIDEO
) -> List[np.ndarray]:
    """
    Decodes an input video file and uniformly samples `num_frames` RGB frames
    at their original resolution before model-specific resizing.
    """
    path_str = str(video_path)
    cap = cv2.VideoCapture(path_str)
    if not cap.isOpened():
        cap.release()
        raise ValueError(f"Cannot open video file: {path_str}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frames = []

    if total_frames <= 0:
        # Fallback for streams/containers where frame count is not in headers
        sequential = []
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                break
            sequential.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        cap.release()

        if not sequential:
            raise ValueError(f"Video file contains no readable frames: {path_str}")

        total_frames = len(sequential)
        indices = np.linspace(0, total_frames - 1, num_frames).astype(int)
        frames = [sequential[i] for i in indices]
    else:
        indices = np.linspace(0, total_frames - 1, num_frames).astype(int)
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ok, frame = cap.read()
            if ok and frame is not None:
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        cap.release()

    if not frames:
        raise ValueError(f"Failed to decode any video frames from: {path_str}")

    # Pad with last frame if needed to guarantee exact num_frames length
    while len(frames) < num_frames:
        frames.append(frames[-1].copy())

    return frames[:num_frames]


def preprocess_for_model(
    video_path: Union[str, Path],
    model_id: str = "mobilenetv2",
    num_frames: int = FRAMES_PER_VIDEO
) -> np.ndarray:
    """
    Model-specific preprocessing pipeline based on verified training protocols:
    - mobilenetv2: 33 frames, 224x224 RGB, float32 in [0, 255] (model rescales internally to [-1, 1]).
    - custom_cnn:  33 frames, 224x224 RGB, float32 in [0, 1] (divided by 255.0).
    - cnn_lstm:    33 frames, 112x112 RGB, float32 in [0, 1], shaped as 5D tensor (1, 33, 112, 112, 3).
    """
    raw_frames = decode_video_frames(video_path, num_frames=num_frames)
    target_key = normalize_model_id(model_id)

    if target_key == "cnn_lstm":
        # 112x112 RGB, scaled to [0, 1], 5D tensor (1, 33, 112, 112, 3)
        resized = [
            cv2.resize(f, (IMAGE_SIZE_LSTM, IMAGE_SIZE_LSTM), interpolation=cv2.INTER_AREA)
            for f in raw_frames
        ]
        seq = np.asarray(resized, dtype=np.float32) / 255.0
        # Expand batch dimension to produce shape (1, 33, 112, 112, 3)
        return np.expand_dims(seq, axis=0)

    elif target_key == "custom_cnn":
        # 224x224 RGB, scaled to [0, 1], 4D tensor (33, 224, 224, 3)
        resized = [
            cv2.resize(f, (IMAGE_SIZE_DEFAULT, IMAGE_SIZE_DEFAULT), interpolation=cv2.INTER_AREA)
            for f in raw_frames
        ]
        return np.asarray(resized, dtype=np.float32) / 255.0

    else:
        # mobilenetv2 (default): 224x224 RGB, kept in [0, 255], 4D tensor (33, 224, 224, 3)
        resized = [
            cv2.resize(f, (IMAGE_SIZE_DEFAULT, IMAGE_SIZE_DEFAULT), interpolation=cv2.INTER_AREA)
            for f in raw_frames
        ]
        return np.asarray(resized, dtype=np.float32)


def extract_rgb_frames(
    video_path: Union[str, Path],
    num_frames: int = 33,
    image_size: int = 224
) -> np.ndarray:
    """
    Backwards-compatible frame extractor returning (num_frames, image_size, image_size, 3)
    with float32 values in [0, 255].
    """
    raw_frames = decode_video_frames(video_path, num_frames=num_frames)
    resized = [
        cv2.resize(f, (image_size, image_size), interpolation=cv2.INTER_AREA)
        for f in raw_frames
    ]
    return np.asarray(resized, dtype=np.float32)
