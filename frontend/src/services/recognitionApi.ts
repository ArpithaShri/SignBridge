import type {
  VideoRecognitionRequest,
  VideoRecognitionResponse,
  FileValidationResult
} from '../types';

/**
 * Configuration for the future Python (FastAPI / Flask) inference service.
 * In Phase 2, mock simulation is the active pipeline until the Python backend is integrated.
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  ENDPOINT_RECOGNIZE: '/api/v1/recognize',
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100 MB
  ALLOWED_EXTENSIONS: ['.mov', '.mp4', '.avi'],
  DEFAULT_SAMPLE_FRAMES: 33,
  DEFAULT_RESOLUTION: '224 × 224 RGB'
};

/**
 * Validates the uploaded file against allowed video formats and size limits.
 */
export function validateVideoFile(file: File): FileValidationResult {
  if (!file || file.size === 0) {
    return {
      isValid: false,
      code: 'EMPTY_FILE',
      errorMessage: 'The selected file is empty. Please choose a valid video file.'
    };
  }

  const filename = file.name.toLowerCase();
  const matchedExtension = API_CONFIG.ALLOWED_EXTENSIONS.find((ext) => filename.endsWith(ext));

  if (!matchedExtension) {
    return {
      isValid: false,
      code: 'INVALID_FORMAT',
      errorMessage: `Unsupported file format. Please upload an ISL video in ${API_CONFIG.ALLOWED_EXTENSIONS.join(', ')} format.`
    };
  }

  if (file.size > API_CONFIG.MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      code: 'FILE_TOO_LARGE',
      errorMessage: `File size (${sizeMB} MB) exceeds the 100 MB limit. Please select a shorter sign video clip.`
    };
  }

  return {
    isValid: true,
    code: 'VALID',
    extension: matchedExtension
  };
}

/**
 * Helper to format file byte sizes into human-readable strings.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Sample pool of authentic ISL words from the 76-class dataset used for mock testing.
 */
const MOCK_PREDICTION_CANDIDATES = [
  {
    primary: 'NAMASTE',
    confidence: 0.884,
    topK: [
      { word: 'NAMASTE', confidence: 0.884 },
      { word: 'THANK YOU', confidence: 0.052 },
      { word: 'HELLO', confidence: 0.038 }
    ]
  },
  {
    primary: 'THANK YOU',
    confidence: 0.912,
    topK: [
      { word: 'THANK YOU', confidence: 0.912 },
      { word: 'WELCOME', confidence: 0.046 },
      { word: 'PLEASE', confidence: 0.021 }
    ]
  },
  {
    primary: 'HELLO',
    confidence: 0.847,
    topK: [
      { word: 'HELLO', confidence: 0.847 },
      { word: 'NAMASTE', confidence: 0.091 },
      { word: 'MORNING', confidence: 0.034 }
    ]
  },
  {
    primary: 'WATER',
    confidence: 0.875,
    topK: [
      { word: 'WATER', confidence: 0.875 },
      { word: 'DRINK', confidence: 0.078 },
      { word: 'FOOD', confidence: 0.025 }
    ]
  },
  {
    primary: 'HELP',
    confidence: 0.863,
    topK: [
      { word: 'HELP', confidence: 0.863 },
      { word: 'DOCTOR', confidence: 0.068 },
      { word: 'HOSPITAL', confidence: 0.042 }
    ]
  },
  {
    primary: 'FAMILY',
    confidence: 0.829,
    topK: [
      { word: 'FAMILY', confidence: 0.829 },
      { word: 'FRIEND', confidence: 0.098 },
      { word: 'FATHER', confidence: 0.045 }
    ]
  }
];

/**
 * Primary recognition service method.
 * In Phase 2, returns simulated mock prediction data with realistic async processing delay.
 * In Phase 4, will connect to the live Python backend endpoint.
 */
export async function analyzeVideo(
  request: VideoRecognitionRequest,
  simulateMock: boolean = true
): Promise<VideoRecognitionResponse> {
  const validation = validateVideoFile(request.videoFile);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Invalid video file provided');
  }

  // Phase 2: Mock Mode Pipeline
  if (simulateMock) {
    // Simulate 33-frame extraction and neural forward pass latency (1.4s)
    await new Promise((resolve) => setTimeout(resolve, 1400));

    // Choose candidate based on filename hash for consistent repeatability on the same video
    const hash = request.videoFile.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const candidate = MOCK_PREDICTION_CANDIDATES[hash % MOCK_PREDICTION_CANDIDATES.length];

    return {
      success: true,
      isMock: true,
      videoName: request.videoFile.name,
      predictedWord: candidate.primary,
      confidence: candidate.confidence,
      modelUsed: {
        id: 'mobilenetv2',
        name: 'MobileNetV2 (Frozen Backbone)',
        testAccuracy: 67.78,
        architecture: 'Pretrained ImageNet Visual Extractor + Global Avg Pooling'
      },
      topK: candidate.topK,
      preprocessing: {
        framesSampled: API_CONFIG.DEFAULT_SAMPLE_FRAMES,
        frameResolution: API_CONFIG.DEFAULT_RESOLUTION,
        colorSpace: 'RGB',
        normalization: 'Normalized to [0, 1]'
      },
      simulatedLatencyMs: 142,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // Phase 4: Real Backend Fetch Architecture (Prepared for FastAPI integration)
  const formData = new FormData();
  formData.append('video', request.videoFile);
  formData.append('sampling_frames', String(request.samplingFrames || API_CONFIG.DEFAULT_SAMPLE_FRAMES));
  if (request.targetModel) {
    formData.append('target_model', request.targetModel);
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT_RECOGNIZE}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Inference server returned error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    isMock: false
  };
}
