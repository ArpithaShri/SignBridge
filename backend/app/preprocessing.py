import cv2
import numpy as np
from pathlib import Path
from typing import Union


def extract_rgb_frames(
    video_path: Union[str, Path],
    num_frames: int = 33,
    image_size: int = 224
) -> np.ndarray:
    """
    Decodes an input video file and uniformly samples exactly `num_frames` RGB frames,
    resizing each frame to (image_size, image_size).

    This preprocessing mirrors the exact pipeline used during MobileNetV2 evaluation:
    - Uniform index spacing via np.linspace(0, total - 1, num_frames)
    - Color conversion from BGR to RGB
    - Downsampling interpolation via cv2.INTER_AREA
    - Values kept in [0, 255] as float32; the MobileNetV2 model's built-in Rescaling layer
      handles mapping to [-1, 1].
    """
    path_str = str(video_path)
    cap = cv2.VideoCapture(path_str)
    if not cap.isOpened():
        cap.release()
        raise ValueError(f"Cannot open video file: {path_str}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        # Fallback for streams where frame count isn't in headers: read sequentially
        sequential_frames = []
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                break
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = cv2.resize(frame, (image_size, image_size), interpolation=cv2.INTER_AREA)
            sequential_frames.append(frame)
        cap.release()

        if not sequential_frames:
            raise ValueError(f"Video file contains no valid readable video frames: {path_str}")

        total_frames = len(sequential_frames)
        indices = np.linspace(0, total_frames - 1, num_frames).astype(int)
        sampled = [sequential_frames[i] for i in indices]
        return np.asarray(sampled, dtype=np.float32)

    indices = np.linspace(0, total_frames - 1, num_frames).astype(int)
    frames = []

    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ok, frame = cap.read()
        if ok and frame is not None:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = cv2.resize(frame, (image_size, image_size), interpolation=cv2.INTER_AREA)
            frames.append(frame)

    cap.release()

    if not frames:
        raise ValueError(f"Failed to decode any video frames from: {path_str}")

    # Pad with last frame if needed to guarantee exact num_frames length
    while len(frames) < num_frames:
        frames.append(frames[-1].copy())

    return np.asarray(frames[:num_frames], dtype=np.float32)
