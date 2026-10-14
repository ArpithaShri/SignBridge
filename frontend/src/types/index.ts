export type NavigationTab = 'dashboard' | 'recognition' | 'comparison' | 'lab-eval2';

export interface ModelMetrics {
  id: 'custom-cnn' | 'mobilenetv2' | 'cnn-lstm';
  name: string;
  architectureType: string;
  testAccuracy: number; // percentage (e.g. 67.78)
  macroF1?: number;
  inputShape: string;
  framesSampled: number;
  frameResolution: string;
  isBestPerformer?: boolean;
  tagline: string;
  description: string;
  strengths: string[];
  keyParameters: {
    backbone: string;
    pooling: string;
    classificationHead: string;
    regularization: string;
  };
}

export interface VideoMetadata {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  format: string;
  durationSeconds?: number;
  previewUrl: string;
}

export interface TopKPrediction {
  word: string;
  confidence: number;
}

export interface ModelPrediction {
  modelId: 'custom-cnn' | 'mobilenetv2' | 'cnn-lstm';
  modelName: string;
  predictedWord: string;
  confidence: number; // 0 to 1
  inferenceTimeMs: number;
  isBestModelOverall: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  topK?: TopKPrediction[];
}

export interface RecognitionAnalysis {
  videoName: string;
  analyzedAt: string;
  isMockData: boolean;
  primaryPrediction: {
    modelId: string;
    modelName: string;
    word: string;
    confidence: number;
  };
  models: Record<'custom-cnn' | 'mobilenetv2' | 'cnn-lstm', ModelPrediction>;
  agreementStatus: {
    allAgree: boolean;
    majorityAgreedWord?: string;
    agreementCount: number; // e.g. 3 out of 3, 2 out of 3, 1 out of 3
  };
}

export interface ISLClassInfo {
  index: number;
  word: string;
  category: 'Greetings' | 'Relations' | 'Actions' | 'Nouns' | 'Common Phrases' | 'Numbers';
}

/* =========================================================================
   Phase 2: Video Upload, API Contract, and Recognition Response Types
   ========================================================================= */

export interface VideoRecognitionRequest {
  videoFile: File;
  targetModel?: 'mobilenetv2' | 'custom-cnn' | 'custom_cnn' | 'cnn-lstm' | 'cnn_lstm' | 'late_fusion' | string;
  samplingFrames?: number; // default: 33
}

export interface VideoRecognitionResponse {
  success: boolean;
  isMock: boolean;
  videoName: string;
  predictedWord: string;
  confidence: number; // 0.0 to 1.0
  modelUsed: {
    id: string;
    name: string;
    testAccuracy: number;
    architecture: string;
  };
  topK: TopKPrediction[];
  preprocessing: {
    framesSampled: number;
    frameResolution: string;
    colorSpace: string;
    normalization: string;
  };
  inferenceTimeMs?: number;
  simulatedLatencyMs?: number;
  timestamp: string;
  error?: string;
}

export type UploadValidationCode = 
  | 'VALID'
  | 'INVALID_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE';

export interface FileValidationResult {
  isValid: boolean;
  code: UploadValidationCode;
  errorMessage?: string;
  extension?: string;
}

/* =========================================================================
   Lab Evaluation 2: Conditional DCGAN + CNN Module Types
   ========================================================================= */

export interface LabEval2ClassBreakdown {
  class: string;
  support: number;
  baseline_precision: number;
  baseline_recall: number;
  baseline_f1: number;
  gan_precision: number;
  gan_recall: number;
  gan_f1: number;
}

export interface LabEval2MetricsData {
  clean_test_metrics: Array<{
    Model: string;
    "Test images": number;
    "Correct / total": string;
    "Accuracy (%)": number;
    "Balanced accuracy (%)": number;
    "Macro precision (%)": number;
    "Macro recall (%)": number;
    "Macro F1 (%)": number;
  }>;
  final_model_comparison: Array<{
    Model: string;
    "Test images": number;
    "Correct / total": string;
    "Accuracy (%)": number;
    "Balanced accuracy (%)": number;
    "Macro precision (%)": number;
    "Macro recall (%)": number;
    "Macro F1 (%)": number;
    "Mean batch latency (ms)": number;
    "Mean latency per image (ms)": number;
  }>;
  latency_metrics: Array<{
    Model: string;
    "Batch size": number;
    Runs: number;
    "Mean batch latency (ms)": number;
    "Std batch latency (ms)": number;
    "Mean latency per image (ms)": number;
  }>;
  robustness_metrics: Array<{
    Condition: string;
    Model: string;
    "Test images": number;
    "Correct / total": string;
    "Accuracy (%)": number;
    "Balanced accuracy (%)": number;
    "Macro precision (%)": number;
    "Macro recall (%)": number;
    "Macro F1 (%)": number;
  }>;
  per_class_breakdown: LabEval2ClassBreakdown[];
  scientific_conclusion: {
    clean_accuracy: number;
    mode_collapse: boolean;
    collapsed_class: string;
    gan_augmented_better: boolean;
    summary: string;
  };
}

export interface LabEval2ModelInfo {
  id: string;
  name: string;
  training_samples: number;
  training_composition: string;
  clean_accuracy: number;
  architecture: string;
  normalization: string;
}

export interface LabEval2MetadataData {
  overview: {
    title: string;
    classes: string[];
    num_classes: number;
    image_size: number;
    latent_dim: number;
    frames_per_video: number;
    real_train_images: number;
    synthetic_train_images: number;
    baseline_train_images: number;
    augmented_train_images: number;
    val_images: number;
    test_images: number;
    gan_epochs: number;
    cnn_epochs: number;
    models: Record<string, LabEval2ModelInfo>;
    scientific_finding: {
      clean_accuracy_baseline: number;
      clean_accuracy_gan_augmented: number;
      mode_collapse_observed: boolean;
      collapsed_target_class: string;
      key_takeaway: string;
    };
  };
  report: Record<string, any>;
  engine_status: {
    baseline_loaded: boolean;
    gan_augmented_loaded: boolean;
    generator_loaded: boolean;
    all_ready: boolean;
    errors: Record<string, string>;
  };
}

export interface LabEval2GalleryItem {
  filename: string;
  class_index: number;
  class_name: string;
  type: 'synthetic' | 'real';
  source: string;
  is_live: boolean;
  url: string;
}

export interface LabEval2PlotItem {
  id: string;
  filename: string;
  title: string;
  description: string;
  category: 'evaluation' | 'training' | 'gan' | 'robustness' | 'samples' | 'qualitative';
  url: string;
}

export interface LabEval2PredictionSingle {
  model_name: string;
  training_set: string;
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  latency_ms: number;
}

export interface LabEval2PredictResponse {
  success: boolean;
  filename: string;
  image_size: string;
  normalization: string;
  classes: string[];
  collapse_note: string;
  baseline?: LabEval2PredictionSingle;
  gan_augmented?: LabEval2PredictionSingle;
}

export interface LabEval2GenerateResponse {
  success: boolean;
  class_name: string;
  class_index: number;
  seed: number;
  latency_ms: number;
  image_data_url: string;
  image_size: string;
  latent_dim: number;
  is_live: boolean;
  source: string;
}
