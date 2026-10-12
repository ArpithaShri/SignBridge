import type {
  VideoRecognitionRequest,
  VideoRecognitionResponse,
  FileValidationResult,
  RecognitionAnalysis,
  ModelPrediction
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
 * Checks connection and model status on the FastAPI backend.
 */
export async function checkBackendHealth(): Promise<{
  isOnline: boolean;
  modelLoaded: boolean;
  classesCount?: number;
  message?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT_HEALTH}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        isOnline: true,
        modelLoaded: false,
        message: `Backend returned status ${res.status}`
      };
    }

    const data = await res.json();
    return {
      isOnline: true,
      modelLoaded: Boolean(data.model_loaded),
      classesCount: data.classes_count,
      message: data.model_loaded
        ? 'MobileNetV2 Model Active'
        : 'Backend online, but model weights not loaded'
    };
  } catch (err: unknown) {
    return {
      isOnline: false,
      modelLoaded: false,
      message: 'Backend server unreachable at ' + API_CONFIG.BASE_URL
    };
  }
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
 * Primary recognition service method (MobileNetV2 individual predictor).
 * Defaults to REAL inference via FastAPI backend (simulateMock = false).
 * Never silently falls back to fabricated predictions on network failure.
 */
export async function analyzeVideo(
  request: VideoRecognitionRequest,
  simulateMock: boolean = false
): Promise<VideoRecognitionResponse> {
  const validation = validateVideoFile(request.videoFile);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Invalid video file provided');
  }

  // Explicit Mock Mode Pipeline (only when specifically requested)
  if (simulateMock) {
    await new Promise((resolve) => setTimeout(resolve, 1200));

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
        normalization: 'Normalized to [-1, 1]'
      },
      simulatedLatencyMs: 142,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // Real Backend Inference Call
  const formData = new FormData();
  formData.append('video', request.videoFile);

  let response: Response;
  try {
    response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT_RECOGNIZE}`, {
      method: 'POST',
      body: formData
    });
  } catch (err: unknown) {
    throw new Error(
      `Cannot connect to SignBridge backend at ${API_CONFIG.BASE_URL}. ` +
      `Please ensure the FastAPI server is running on port 8000.`
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
 */
export async function compareAllModels(
  request: VideoRecognitionRequest,
  simulateMock: boolean = true
): Promise<RecognitionAnalysis> {
  const validation = validateVideoFile(request.videoFile);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Invalid video file provided');
  }

  // Mock Mode Pipeline for Multi-Model comparison (Phase 3)
  if (simulateMock) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const hash = request.videoFile.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const candidate = MOCK_PREDICTION_CANDIDATES[hash % MOCK_PREDICTION_CANDIDATES.length];

    const customAgrees = hash % 2 === 0;
    const lstmAgrees = hash % 3 !== 0;

    const customWord = customAgrees ? candidate.primary : (candidate.topK[1]?.word || 'HELLO');
    const lstmWord = lstmAgrees ? candidate.primary : (candidate.topK[2]?.word || 'THANK YOU');

    const mobilenetPred: ModelPrediction = {
      modelId: 'mobilenetv2',
      modelName: 'MobileNetV2 (Frozen Backbone)',
      predictedWord: candidate.primary,
      confidence: candidate.confidence,
      inferenceTimeMs: 142,
      isBestModelOverall: true,
      status: 'success',
      topK: candidate.topK
    };

    const customPred: ModelPrediction = {
      modelId: 'custom-cnn',
      modelName: 'Custom 2D CNN',
      predictedWord: customWord,
      confidence: customAgrees ? 0.384 : 0.295,
      inferenceTimeMs: 98,
      isBestModelOverall: false,
      status: 'success',
      topK: [
        { word: customWord, confidence: customAgrees ? 0.384 : 0.295 },
        { word: candidate.topK[1]?.word || 'WATER', confidence: 0.182 },
        { word: candidate.topK[2]?.word || 'HELP', confidence: 0.141 }
      ]
    };

    const lstmPred: ModelPrediction = {
      modelId: 'cnn-lstm',
      modelName: 'CNN-LSTM',
      predictedWord: lstmWord,
      confidence: lstmAgrees ? 0.342 : 0.264,
      inferenceTimeMs: 215,
      isBestModelOverall: false,
      status: 'success',
      topK: [
        { word: lstmWord, confidence: lstmAgrees ? 0.342 : 0.264 },
        { word: candidate.primary, confidence: 0.218 },
        { word: 'NAMASTE', confidence: 0.125 }
      ]
    };

    // Calculate model agreement
    const words = [mobilenetPred.predictedWord, customPred.predictedWord, lstmPred.predictedWord];
    const wordCounts: Record<string, number> = {};
    words.forEach((w) => {
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    });

    let maxCount = 0;
    let majorityWord = mobilenetPred.predictedWord;
    Object.entries(wordCounts).forEach(([w, count]) => {
      if (count > maxCount) {
        maxCount = count;
        majorityWord = w;
      }
    });

    return {
      videoName: request.videoFile.name,
      analyzedAt: new Date().toLocaleTimeString(),
      isMockData: true,
      primaryPrediction: {
        modelId: 'mobilenetv2',
        modelName: 'MobileNetV2 (Frozen Backbone)',
        word: mobilenetPred.predictedWord,
        confidence: mobilenetPred.confidence
      },
      models: {
        mobilenetv2: mobilenetPred,
        'custom-cnn': customPred,
        'cnn-lstm': lstmPred
      },
      agreementStatus: {
        allAgree: maxCount === 3,
        majorityAgreedWord: majorityWord,
        agreementCount: maxCount
      }
    };
  }

  // Phase 4: Live multi-model backend integration
  const formData = new FormData();
  formData.append('video', request.videoFile);

  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT_COMPARE}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Comparison server error: ${response.status}`);
  }

  return response.json();
}
