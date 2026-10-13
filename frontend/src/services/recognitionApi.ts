import type {
  VideoRecognitionRequest,
  VideoRecognitionResponse,
  FileValidationResult,
  RecognitionAnalysis
} from '../types';

/**
 * Configuration for the Python (FastAPI) inference service.
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  ENDPOINT_RECOGNIZE: '/api/v1/recognize',
  ENDPOINT_HEALTH: '/api/v1/health',
  ENDPOINT_MODEL_INFO: '/api/v1/model-info',
  ENDPOINT_COMPARE: '/api/v1/compare',
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100 MB
  ALLOWED_EXTENSIONS: ['.mov', '.mp4', '.avi', '.webm'],
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
 * Active base URL state (defaults to configured env or port 8000).
 * Dynamically updates to any live local backend port (8000, 8001, etc.).
 */
let activeBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function getActiveBackendUrl(): string {
  return activeBaseUrl;
}

const CANDIDATE_PORTS = ['8000', '8001'];
const getCandidateUrls = () => {
  const list = [activeBaseUrl];
  if (import.meta.env.VITE_API_BASE_URL) {
    list.push(import.meta.env.VITE_API_BASE_URL);
  }
  CANDIDATE_PORTS.forEach((p) => {
    list.push(`http://localhost:${p}`);
    list.push(`http://127.0.0.1:${p}`);
  });
  return Array.from(new Set(list));
};

/**
 * Checks connection and model status on the FastAPI backend.
 * Checks the configured URL first, and smoothly falls back to any live local port.
 */
export async function checkBackendHealth(): Promise<{
  isOnline: boolean;
  modelLoaded: boolean;
  classesCount?: number;
  message?: string;
  activeUrl?: string;
  models?: Record<string, boolean>;
}> {
  const candidates = getCandidateUrls();

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${url}${API_CONFIG.ENDPOINT_HEALTH}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        activeBaseUrl = url;
        return {
          isOnline: true,
          modelLoaded: Boolean(data.model_loaded),
          classesCount: data.classes_count,
          activeUrl: url,
          models: data.models,
          message: data.model_loaded
            ? `SignBridge Neural Engine Active (${url})`
            : `Backend online at ${url}, but model weights not loaded`
        };
      }
    } catch {
      // Continue to next candidate port
    }
  }

  return {
    isOnline: false,
    modelLoaded: false,
    activeUrl: activeBaseUrl,
    message: `Backend unreachable at ${activeBaseUrl}. Please ensure FastAPI is running on port 8000 or 8001.`
  };
}

/**
 * Primary recognition service method.
 * Runs REAL neural inference via the FastAPI backend on the requested model:
 * - mobilenetv2 (Default)
 * - custom_cnn
 * - cnn_lstm
 * - late_fusion (Optional equal-weight ensemble)
 * Never fabricates or falls back to simulated predictions.
 */
export async function analyzeVideo(
  request: VideoRecognitionRequest
): Promise<VideoRecognitionResponse> {
  const validation = validateVideoFile(request.videoFile);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Invalid video file provided');
  }

  const formData = new FormData();
  formData.append('video', request.videoFile);
  if (request.targetModel) {
    formData.append('model', request.targetModel);
  }

  let response: Response;
  try {
    response = await fetch(`${activeBaseUrl}${API_CONFIG.ENDPOINT_RECOGNIZE}`, {
      method: 'POST',
      body: formData
    });
  } catch (err: unknown) {
    throw new Error(
      `Cannot connect to SignBridge backend at ${activeBaseUrl}. ` +
      `Please ensure the FastAPI server is running with: cd backend && venv\\Scripts\\python -m uvicorn app.main:app --port 8000`
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Server returned error ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  return {
    ...data,
    isMock: false
  };
}

/**
 * Multi-model comparison service method.
 * Sends the video to POST /api/v1/compare to execute real inference across
 * MobileNetV2, Custom CNN, and CNN-LSTM simultaneously and compute cross-model consensus.
 */
export async function compareAllModels(
  request: VideoRecognitionRequest
): Promise<RecognitionAnalysis> {
  const validation = validateVideoFile(request.videoFile);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Invalid video file provided');
  }

  const formData = new FormData();
  formData.append('video', request.videoFile);

  let response: Response;
  try {
    response = await fetch(`${activeBaseUrl}${API_CONFIG.ENDPOINT_COMPARE}`, {
      method: 'POST',
      body: formData
    });
  } catch (err: unknown) {
    throw new Error(
      `Cannot connect to SignBridge backend at ${activeBaseUrl}. ` +
      `Please ensure the FastAPI server is running.`
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Comparison server error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    isMockData: false
  };
}

