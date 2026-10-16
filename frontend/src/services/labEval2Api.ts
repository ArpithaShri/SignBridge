export const LAB_EVAL2_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  ENDPOINT_METADATA: '/api/v1/lab-eval2/metadata',
  ENDPOINT_METRICS: '/api/v1/lab-eval2/metrics',
  ENDPOINT_PREDICT: '/api/v1/lab-eval2/predict',
  ENDPOINT_GENERATE: '/api/v1/lab-eval2/generate',
  ENDPOINT_EXTRACT_FRAMES: '/api/v1/lab-eval2/extract-frames',
  ENDPOINT_VIDEO_INFER: '/api/v1/lab-eval2/video-infer',
  ENDPOINT_CNN_LSTM_METADATA: '/api/v1/lab-eval2/cnn-lstm/metadata',
  ENDPOINT_CNN_LSTM_PREDICT_VIDEO: '/api/v1/lab-eval2/cnn-lstm/predict-video',
  ENDPOINT_CNN_LSTM_GENERATE: '/api/v1/lab-eval2/cnn-lstm/generate',
  ENDPOINT_CNN_LSTM_HISTORY: '/api/v1/lab-eval2/cnn-lstm/history',
  ENDPOINT_MOBILENETV2_METADATA: '/api/v1/lab-eval2/mobilenetv2/metadata',
  ENDPOINT_MOBILENETV2_PREDICT_IMAGE: '/api/v1/lab-eval2/mobilenetv2/predict-image',
  ENDPOINT_MOBILENETV2_PREDICT_VIDEO: '/api/v1/lab-eval2/mobilenetv2/predict-video',
  ENDPOINT_MOBILENETV2_GENERATE: '/api/v1/lab-eval2/mobilenetv2/generate',
};

export interface LabEval2Overview {
  title: string;
  experiment: string;
  classes: string[];
  num_classes: number;
  image_size: string;
  latent_dim: number;
  frames_per_video: number;
  test_images: number;
  gan_epochs_completed: number;
  baseline_cnn_epochs: number;
  augmented_cnn_epochs: number;
  models: {
    baseline: {
      name: string;
      architecture: string;
      training_set: string;
      clean_accuracy: number;
      macro_precision: number;
      macro_recall: number;
      macro_f1: number;
      mean_latency_ms: number;
    };
    gan_augmented: {
      name: string;
      architecture: string;
      training_set: string;
      clean_accuracy: number;
      macro_precision: number;
      macro_recall: number;
      macro_f1: number;
      mean_latency_ms: number;
    };
  };
  scientific_conclusion: {
    headline: string;
    clean_accuracy_baseline: number;
    clean_accuracy_gan_augmented: number;
    summary: string;
  };
}

export interface LabEval2Metrics {
  test_comparison: Array<{
    Model: string;
    Accuracy: number;
    'Macro Precision': number;
    'Macro Recall': number;
    'Macro F1': number;
    'Weighted F1': number;
  }>;
  robustness: Array<{
    Model: string;
    Noise_STD: number;
    Accuracy: number;
    Macro_F1: number;
  }>;
  latency: Array<{
    Model: string;
    Images_Tested: number;
    Total_Time_Seconds: number;
    Latency_ms_per_image: number;
  }>;
  generalization_gap: Array<{
    Model: string;
    Train_Accuracy: number;
    Validation_Accuracy: number;
    Accuracy_Gap: number;
  }>;
  per_class_bias: Array<{
    Model: string;
    Class: string;
    Precision: number;
    Recall: number;
    F1: number;
    Support: number;
  }>;
  uncertainty: Array<{
    Model: string;
    Mean_Confidence: number;
    Median_Confidence: number;
    Low_Confidence_Count: number;
    Total_Samples: number;
    Accuracy: number;
    Low_Confidence_Percent: number;
  }>;
  training_history?: {
    baseline?: {
      accuracy?: number[];
      loss?: number[];
      val_accuracy?: number[];
      val_loss?: number[];
    };
    augmented?: {
      accuracy?: number[];
      loss?: number[];
      val_accuracy?: number[];
      val_loss?: number[];
    };
  };
}

export interface LabEval2PredictionResult {
  model_name: string;
  training_set: string;
  predicted_class: string;
  predicted_index: number;
  confidence: number;
  top5: Array<{
    class_index: number;
    class_name: string;
    confidence: number;
  }>;
  latency_ms: number;
}

export interface LabEval2PredictResponse {
  success: boolean;
  filename: string;
  input_type: string;
  input_info: string;
  classes_count: number;
  baseline?: LabEval2PredictionResult;
  gan_augmented?: LabEval2PredictionResult;
  baseline_error?: string;
  augmented_error?: string;
}

export interface LabEval2GenerateResponse {
  success: boolean;
  class_name: string;
  class_index: number;
  seed?: number;
  latency_ms: number;
  image_data_url: string;
  image_size: string;
  latent_dim: number;
  is_live: boolean;
}

// Fallback verified data directly from actual cnn_gan_results archive
export const VERIFIED_TEST_COMPARISON = [
  {
    Model: 'Baseline CNN',
    Accuracy: 0.4988888888888889,
    'Macro Precision': 0.5409533085341484,
    'Macro Recall': 0.5109649122807017,
    'Macro F1': 0.4908435913835695,
    'Weighted F1': 0.48005761927565854,
  },
  {
    Model: 'DCGAN + CNN',
    Accuracy: 0.29,
    'Macro Precision': 0.35306631044608455,
    'Macro Recall': 0.3162280701754387,
    'Macro F1': 0.2936450848721971,
    'Weighted F1': 0.2681766637781916,
  },
];

export const VERIFIED_GENERALIZATION_GAP = [
  {
    Model: 'Baseline CNN',
    Train_Accuracy: 0.9416873449131513,
    Validation_Accuracy: 0.4588888888888889,
    Accuracy_Gap: 0.4827984560242624,
  },
  {
    Model: 'DCGAN + CNN',
    Train_Accuracy: 0.44967880085653106,
    Validation_Accuracy: 0.27444444444444444,
    Accuracy_Gap: 0.17523435641208662,
  },
];

export const VERIFIED_ROBUSTNESS = [
  { Model: 'Baseline CNN', Noise_STD: 0.0, Accuracy: 0.4989, Macro_F1: 0.4908 },
  { Model: 'Baseline CNN', Noise_STD: 0.05, Accuracy: 0.3678, Macro_F1: 0.345 },
  { Model: 'Baseline CNN', Noise_STD: 0.1, Accuracy: 0.1533, Macro_F1: 0.0843 },
  { Model: 'Baseline CNN', Noise_STD: 0.2, Accuracy: 0.0444, Macro_F1: 0.0095 },
  { Model: 'DCGAN + CNN', Noise_STD: 0.0, Accuracy: 0.29, Macro_F1: 0.2936 },
  { Model: 'DCGAN + CNN', Noise_STD: 0.05, Accuracy: 0.2789, Macro_F1: 0.2769 },
  { Model: 'DCGAN + CNN', Noise_STD: 0.1, Accuracy: 0.1811, Macro_F1: 0.1484 },
  { Model: 'DCGAN + CNN', Noise_STD: 0.2, Accuracy: 0.0622, Macro_F1: 0.0194 },
];

export const VERIFIED_LATENCY = [
  { Model: 'Baseline CNN', Images_Tested: 256, Total_Time_Seconds: 1.0651, Latency_ms_per_image: 4.16 },
  { Model: 'DCGAN + CNN', Images_Tested: 256, Total_Time_Seconds: 0.8268, Latency_ms_per_image: 3.23 },
];

export const VERIFIED_UNCERTAINTY = [
  { Model: 'Baseline CNN', Mean_Confidence: 0.6479, Median_Confidence: 0.642, Low_Confidence_Percent: 44.33 },
  { Model: 'DCGAN + CNN', Mean_Confidence: 0.3471, Median_Confidence: 0.2957, Low_Confidence_Percent: 89.56 },
];

export async function fetchLabEval2Metadata(): Promise<LabEval2Overview> {
  try {
    const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_METADATA}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.overview;
  } catch (err) {
    console.warn('Falling back to local verified metadata:', err);
    return {
      title: 'Lab Evaluation 2 — Conditional DCGAN + CNN for 76-Class Indian Sign Language',
      experiment: 'Frame-Level ISL Word Recognition with Generative Data Augmentation',
      classes: [],
      num_classes: 76,
      image_size: '64×64×3',
      latent_dim: 100,
      frames_per_video: 5,
      test_images: 900,
      gan_epochs_completed: 100,
      baseline_cnn_epochs: 44,
      augmented_cnn_epochs: 31,
      models: {
        baseline: {
          name: 'Baseline Custom CNN',
          architecture: '4-Block Conv2D + BatchNorm + MaxPool + GAP + Dense(128)',
          training_set: 'Real video frames only (5 uniform frames/video)',
          clean_accuracy: 49.89,
          macro_precision: 54.1,
          macro_recall: 51.1,
          macro_f1: 49.08,
          mean_latency_ms: 4.16,
        },
        gan_augmented: {
          name: 'DCGAN-Augmented Custom CNN',
          architecture: 'Identical 4-Block Conv2D backbone trained on Real + 50% GAN frames',
          training_set: 'Real frames + Class-conditioned DCGAN synthetic frames',
          clean_accuracy: 29.0,
          macro_precision: 35.31,
          macro_recall: 31.62,
          macro_f1: 29.36,
          mean_latency_ms: 3.23,
        },
      },
      scientific_conclusion: {
        headline: 'Baseline CNN Outperforms DCGAN + CNN on Clean Held-Out Test Set',
        clean_accuracy_baseline: 49.89,
        clean_accuracy_gan_augmented: 29.0,
        summary:
          'The baseline CNN achieved 49.89% clean accuracy, whereas the GAN-augmented CNN achieved 29.00%. Downsampling video frames to 64×64 pixels and training DCGAN on subtle finger gestures produced blurry synthetic hand blobs that acted as label noise on clean test data. However, under severe Gaussian noise (STD=0.1 and 0.2), the GAN-augmented CNN showed slightly higher retention.',
      },
    };
  }
}

export async function fetchLabEval2Metrics(): Promise<LabEval2Metrics> {
  try {
    const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_METRICS}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Falling back to local verified metrics:', err);
    return {
      test_comparison: VERIFIED_TEST_COMPARISON,
      robustness: VERIFIED_ROBUSTNESS,
      latency: VERIFIED_LATENCY,
      generalization_gap: VERIFIED_GENERALIZATION_GAP,
      per_class_bias: [],
      uncertainty: VERIFIED_UNCERTAINTY as any,
    };
  }
}

export async function predictLabEval2(
  file: File,
  model: 'both' | 'baseline' | 'augmented' = 'both'
): Promise<LabEval2PredictResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);

  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_PREDICT}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || 'Prediction failed');
  }

  return await res.json();
}

export async function generateLabEval2Image(
  classIdentifier: string | number,
  seed?: number
): Promise<LabEval2GenerateResponse> {
  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_GENERATE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      class_identifier: classIdentifier,
      seed: seed !== undefined ? seed : null,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || 'Generation failed');
  }

  return await res.json();
}

// -------------------------------------------------------------
// Video Frame Extraction & Dual Inference Interfaces
// -------------------------------------------------------------

export interface ExtractedFrameItem {
  frame_index: number;
  video_frame_num: number;
  timestamp_sec: number;
  timestamp_formatted: string;
  thumbnail: string;
}

export interface VideoExtractionResponse {
  success: boolean;
  filename: string;
  metadata: {
    total_frames: number;
    fps: number;
    duration_seconds: number;
    sampled_count: number;
    strategy: string;
  };
  frames: ExtractedFrameItem[];
}

export interface FramePredictionItem {
  frame_index: number;
  video_frame_num: number;
  timestamp_sec: number;
  timestamp_formatted: string;
  thumbnail: string;
  agreement: boolean;
  baseline: {
    predicted_class: string;
    confidence: number;
    top3: Array<{ class_name: string; confidence: number }>;
  };
  gan_augmented: {
    predicted_class: string;
    confidence: number;
    top3: Array<{ class_name: string; confidence: number }>;
  };
}

export interface VideoDualInferResponse {
  success: boolean;
  filename: string;
  metadata: {
    total_frames: number;
    fps: number;
    duration_seconds: number;
    sampled_count: number;
    strategy: string;
  };
  total_frames_evaluated: number;
  agreement_count: number;
  agreement_rate_percent: number;
  frame_results: FramePredictionItem[];
  aggregated_summary: {
    baseline_consensus: string;
    baseline_distribution: Record<string, number>;
    augmented_consensus: string;
    augmented_distribution: Record<string, number>;
    consensus_agreement: boolean;
    disclaimer: string;
  };
  latencies: {
    baseline_total_ms: number;
    augmented_total_ms: number;
    per_frame_baseline_ms: number;
    per_frame_augmented_ms: number;
  };
}

export async function extractVideoFrames(
  videoFile: File,
  strategy: 'uniform' | 'interval' = 'uniform',
  maxFrames: number = 5
): Promise<VideoExtractionResponse> {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('strategy', strategy);
  formData.append('max_frames', maxFrames.toString());

  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_EXTRACT_FRAMES}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || 'Frame extraction failed');
  }

  return await res.json();
}

export async function predictVideoFramesDual(
  videoFile: File,
  strategy: 'uniform' | 'interval' = 'uniform',
  maxFrames: number = 5,
  selectedIndices?: number[]
): Promise<VideoDualInferResponse> {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('strategy', strategy);
  formData.append('max_frames', maxFrames.toString());
  if (selectedIndices && selectedIndices.length > 0) {
    formData.append('selected_indices', JSON.stringify(selectedIndices));
  }

  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_VIDEO_INFER}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || 'Video frame inference failed');
  }

  return await res.json();
}

// -------------------------------------------------------------
// GAN + CNN-LSTM Interfaces and API Client
// -------------------------------------------------------------

export interface GanCnnLstmOverview {
  title: string;
  experiment: string;
  classes: string[];
  num_classes: number;
  image_size: string;
  sequence_frames: number;
  latent_dim: number;
  training_images: number;
  test_videos: number;
  models: {
    baseline_cnn_lstm: {
      name: string;
      architecture: string;
      training_set: string;
      clean_accuracy: number;
      macro_f1: number;
      weighted_f1: number;
      status: string;
    };
    conditional_dcgan: {
      name: string;
      architecture: string;
      training_set: string;
      saved_epochs: number;
      status: string;
    };
    gan_augmented_cnn_lstm: {
      name: string;
      architecture: string;
      status: string;
      clean_accuracy: number | null;
      note: string;
    };
  };
  scientific_findings: {
    headline: string;
    clean_accuracy_baseline: number;
    summary: string;
  };
}

export interface GanCnnLstmMetadataResponse {
  overview: GanCnnLstmOverview;
  baseline_summary: {
    model: string;
    test_videos_expected: number;
    test_videos_evaluated: number;
    test_accuracy: number;
    test_accuracy_percent: number;
    macro_f1: number;
    weighted_f1: number;
  };
  model_info: {
    model_path: string;
    input_shape: string;
    output_shape: string;
    total_parameters: number;
  };
  pixel_stats: {
    sample_grids_analyzed: number;
    epochs_analyzed: number[];
    metric_note: string;
  };
  sample_grid_stats: Array<{
    Epoch: number;
    GridWidth: number;
    GridHeight: number;
    PixelMean: number;
    PixelStd: number;
    UniquePixelValues: number;
  }>;
  classification_report: Record<string, {
    precision: number;
    recall: number;
    'f1-score': number;
    support: number;
  }>;
  engine_status: {
    baseline_lstm_loaded: boolean;
    augmented_lstm_loaded: boolean;
    generator_loaded: boolean;
    classes_count: number;
    artifacts_dir_exists: boolean;
  };
}

export interface CnnLstmVideoPredictResponse {
  success: boolean;
  filename: string;
  metadata: {
    total_frames: number;
    fps: number;
    duration_seconds: number;
    sequence_frames: number;
    frame_resolution: string;
  };
  preview_thumbnails: Array<{
    sequence_step: number;
    frame_num: number;
    timestamp_sec: number;
    thumbnail: string;
  }>;
  baseline_cnn_lstm: {
    status: string;
    model_name: string;
    architecture: string;
    input_shape: string;
    clean_test_accuracy: number;
    predicted_class: string;
    predicted_index: number;
    confidence: number;
    top5: Array<{ class_index: number; class_name: string; confidence: number }>;
    latency_ms: number;
  };
  gan_augmented_cnn_lstm: {
    status: string;
    model_name: string;
    message: string;
    is_available: boolean;
    predicted_class?: string;
    confidence?: number;
    latency_ms?: number;
  };
}

export async function fetchCnnLstmMetadata(): Promise<GanCnnLstmMetadataResponse> {
  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_CNN_LSTM_METADATA}`);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} fetching CNN-LSTM metadata`);
  }
  return await res.json();
}

export async function predictCnnLstmVideo(videoFile: File): Promise<CnnLstmVideoPredictResponse> {
  const formData = new FormData();
  formData.append('video', videoFile);

  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_CNN_LSTM_PREDICT_VIDEO}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || 'CNN-LSTM prediction failed');
  }

  return await res.json();
}

export async function generateCnnLstmImage(
  classIdentifier: string | number,
  seed?: number
): Promise<LabEval2GenerateResponse> {
  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_CNN_LSTM_GENERATE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      class_identifier: classIdentifier,
      seed: seed !== undefined ? seed : null,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || 'CNN-LSTM generation failed');
  }

  return await res.json();
}

export async function fetchCnnLstmHistory(): Promise<{
  success: boolean;
  total_epochs: number;
  history: Array<{ epoch: number; generator_loss: number; discriminator_loss: number }>;
}> {
  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_CNN_LSTM_HISTORY}`);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} fetching history`);
  }
  return await res.json();
}

// -------------------------------------------------------------
// MobileNetV2 GAN Experiment Interfaces & API Client Functions
// -------------------------------------------------------------

export interface MobileNetV2MetricStats {
  mean: number;
  std: number;
}

export interface MobileNetV2EvaluationResults {
  test_set: {
    frames: number;
    videos: number;
  };
  summary_mean_std_over_seeds: {
    baseline: {
      accuracy: MobileNetV2MetricStats;
      macro_precision: MobileNetV2MetricStats;
      macro_recall: MobileNetV2MetricStats;
      macro_f1: MobileNetV2MetricStats;
      weighted_precision: MobileNetV2MetricStats;
      weighted_recall: MobileNetV2MetricStats;
      weighted_f1: MobileNetV2MetricStats;
      video_accuracy: MobileNetV2MetricStats;
      video_macro_f1: MobileNetV2MetricStats;
    };
    gan_augmented: {
      accuracy: MobileNetV2MetricStats;
      macro_precision: MobileNetV2MetricStats;
      macro_recall: MobileNetV2MetricStats;
      macro_f1: MobileNetV2MetricStats;
      weighted_precision: MobileNetV2MetricStats;
      weighted_recall: MobileNetV2MetricStats;
      weighted_f1: MobileNetV2MetricStats;
      video_accuracy: MobileNetV2MetricStats;
      video_macro_f1: MobileNetV2MetricStats;
    };
  };
  paired_difference_gan_minus_baseline: Record<string, MobileNetV2MetricStats>;
  robustness_accuracy_mean_std: {
    baseline: Record<string, MobileNetV2MetricStats>;
    gan_augmented: Record<string, MobileNetV2MetricStats>;
  };
  latency: Array<{
    condition: string;
    device: string;
    params: number;
    file_MB: number;
    batch_size: number;
    ms_per_image: number;
    p95_ms_per_image: number;
  }>;
  gan_label_fidelity: {
    real_trained_model_accuracy_on_gan_images: number;
    chance: number;
  };
}

export interface MobileNetV2DatasetSplits {
  videos_per_class: {
    train: Record<string, number>;
    val: Record<string, number>;
    test: Record<string, number>;
  };
  frames_per_class: {
    train: Record<string, number>;
    val: Record<string, number>;
    test: Record<string, number>;
  };
  synthetic_frames_per_class: Record<string, number>;
  total_frames: {
    train_real: number;
    synthetic: number;
    train_real_plus_synthetic: number;
    val: number;
    test: number;
  };
  synthetic_to_real_ratio: number;
  frames_per_video: number;
  validation_and_test_contain_synthetic_images: boolean;
}

export interface MobileNetV2MetadataResponse {
  experiment: string;
  classes: string[];
  num_classes: number;
  input_shape: string;
  internal_shape: string;
  evaluation_results: MobileNetV2EvaluationResults;
  dataset_splits: MobileNetV2DatasetSplits;
  training_details: any;
  run_config: any;
  classification_reports: any;
  confusion_matrices: any;
  latency: any[];
  robustness: any[];
  per_class_metrics: any[];
  per_seed_results: any[];
  summary_mean_std: any[];
  gan_losses: any[];
  engine_status: {
    baseline_loaded: boolean;
    augmented_loaded: boolean;
    generator_loaded: boolean;
    classes_count: number;
    classes: string[];
  };
}

export interface MobileNetV2PredictImageResponse {
  success: boolean;
  filename: string;
  is_agreement: boolean;
  baseline: {
    predicted_class: string;
    predicted_index: number;
    confidence: number;
    top_k: Array<{ class_name: string; confidence: number }>;
    latency_ms: number;
  };
  gan_augmented: {
    predicted_class: string;
    predicted_index: number;
    confidence: number;
    top_k: Array<{ class_name: string; confidence: number }>;
    latency_ms: number;
  };
  thumbnail_base64: string;
  preprocessing: {
    input_resolution: string;
    scaling: string;
  };
}

export interface MobileNetV2PredictVideoResponse {
  success: boolean;
  filename: string;
  metadata: {
    total_frames: number;
    fps: number;
    duration_seconds: number;
    frames_sampled: number;
    sampling_strategy: string;
  };
  video_prediction: {
    is_agreement: boolean;
    baseline: {
      predicted_class: string;
      confidence: number;
      probabilities: Record<string, number>;
      latency_ms: number;
    };
    gan_augmented: {
      predicted_class: string;
      confidence: number;
      probabilities: Record<string, number>;
      latency_ms: number;
    };
  };
  frame_predictions: Array<{
    step: number;
    frame_num: number;
    timestamp_sec: number;
    thumbnail_base64: string;
    baseline_pred: string;
    baseline_conf: number;
    augmented_pred: string;
    augmented_conf: number;
    agreement: boolean;
  }>;
}

export async function fetchMobileNetV2Metadata(): Promise<MobileNetV2MetadataResponse> {
  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_MOBILENETV2_METADATA}`);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} fetching MobileNetV2 metadata`);
  }
  return await res.json();
}

export async function predictMobileNetV2Image(file: File): Promise<MobileNetV2PredictImageResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_MOBILENETV2_PREDICT_IMAGE}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || 'MobileNetV2 image prediction failed');
  }
  return await res.json();
}

export async function predictMobileNetV2Video(videoFile: File, nFrames: number = 8): Promise<MobileNetV2PredictVideoResponse> {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('n_frames', nFrames.toString());
  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_MOBILENETV2_PREDICT_VIDEO}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || 'MobileNetV2 video prediction failed');
  }
  return await res.json();
}

export async function generateMobileNetV2Image(
  classIdentifier: string | number,
  seed?: number
): Promise<LabEval2GenerateResponse> {
  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_MOBILENETV2_GENERATE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      class_identifier: classIdentifier,
      seed: seed !== undefined ? seed : null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || 'MobileNetV2 generation failed');
  }
  return await res.json();
}


