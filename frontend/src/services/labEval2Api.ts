import type {
  LabEval2MetadataData,
  LabEval2MetricsData,
  LabEval2GalleryItem,
  LabEval2PlotItem,
  LabEval2PredictResponse,
  LabEval2GenerateResponse
} from '../types';

export const LAB_EVAL2_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  ENDPOINT_METADATA: '/api/v1/lab-eval2/metadata',
  ENDPOINT_METRICS: '/api/v1/lab-eval2/metrics',
  ENDPOINT_GALLERY: '/api/v1/lab-eval2/gallery',
  ENDPOINT_PLOTS: '/api/v1/lab-eval2/plots',
  ENDPOINT_PREDICT: '/api/v1/lab-eval2/predict',
  ENDPOINT_GENERATE: '/api/v1/lab-eval2/generate',
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.webp']
};

export const MOCK_METADATA: LabEval2MetadataData = {
  overview: {
    title: "Lab Evaluation 2 — Conditional DCGAN + CNN for ISL Image Classification",
    classes: ["small", "short", "bad", "big", "fast"],
    num_classes: 5,
    image_size: 64,
    latent_dim: 100,
    frames_per_video: 8,
    real_train_images: 616,
    synthetic_train_images: 600,
    baseline_train_images: 616,
    augmented_train_images: 1216,
    val_images: 120,
    test_images: 120,
    gan_epochs: 20,
    cnn_epochs: 30,
    models: {
      baseline_cnn: {
        id: "baseline",
        name: "Baseline CNN",
        training_samples: 616,
        training_composition: "616 Real Frames only",
        clean_accuracy: 20.0,
        architecture: "3 Conv2D blocks (32, 64, 128) + MaxPool + GlobalAvgPool + Dense(128) -> Dense(5, Softmax)",
        normalization: "Normalized to [0, 1] (/ 255.0)"
      },
      gan_augmented_cnn: {
        id: "gan_augmented",
        name: "GAN-Augmented CNN",
        training_samples: 1216,
        training_composition: "616 Real Frames + 600 Synthetic Images",
        clean_accuracy: 20.0,
        architecture: "Identical 3 Conv2D blocks (32, 64, 128) + MaxPool + GlobalAvgPool + Dense(128) -> Dense(5, Softmax)",
        normalization: "Normalized to [0, 1] (/ 255.0)"
      }
    },
    scientific_finding: {
      clean_accuracy_baseline: 20.0,
      clean_accuracy_gan_augmented: 20.0,
      mode_collapse_observed: true,
      collapsed_target_class: "small",
      key_takeaway: "Both classifiers achieved 20.0% clean test accuracy and exhibited single-class prediction collapse onto 'small'. GAN data augmentation did NOT improve clean test accuracy in this run."
    }
  },
  report: {
    experiment: "Conditional DCGAN + CNN for ISL image classification",
    train_frames: 616,
    synthetic_train_images: 600
  },
  engine_status: {
    baseline_loaded: true,
    gan_augmented_loaded: true,
    generator_loaded: true,
    all_ready: true,
    errors: {}
  }
};

export const MOCK_METRICS: LabEval2MetricsData = {
  clean_test_metrics: [
    {
      "Model": "Baseline CNN",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    },
    {
      "Model": "GAN-augmented CNN",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    }
  ],
  final_model_comparison: [
    {
      "Model": "Baseline CNN",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67,
      "Mean batch latency (ms)": 69.89,
      "Mean latency per image (ms)": 2.18
    },
    {
      "Model": "GAN-augmented CNN",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67,
      "Mean batch latency (ms)": 105.11,
      "Mean latency per image (ms)": 3.28
    }
  ],
  latency_metrics: [
    {
      "Model": "Baseline CNN",
      "Batch size": 32,
      "Runs": 10,
      "Mean batch latency (ms)": 69.89,
      "Std batch latency (ms)": 1.19,
      "Mean latency per image (ms)": 2.18
    },
    {
      "Model": "GAN-augmented CNN",
      "Batch size": 32,
      "Runs": 10,
      "Mean batch latency (ms)": 105.11,
      "Std batch latency (ms)": 27.71,
      "Mean latency per image (ms)": 3.28
    }
  ],
  robustness_metrics: [
    {
      "Condition": "Clean",
      "Model": "Baseline CNN | Clean",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    },
    {
      "Condition": "Clean",
      "Model": "GAN-augmented CNN | Clean",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    },
    {
      "Condition": "Brightness reduced (0.6x)",
      "Model": "Baseline CNN | Brightness reduced (0.6x)",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    },
    {
      "Condition": "Brightness reduced (0.6x)",
      "Model": "GAN-augmented CNN | Brightness reduced (0.6x)",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    },
    {
      "Condition": "Gaussian noise (sigma=0.08)",
      "Model": "Baseline CNN | Gaussian noise (sigma=0.08)",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    },
    {
      "Condition": "Gaussian noise (sigma=0.08)",
      "Model": "GAN-augmented CNN | Gaussian noise (sigma=0.08)",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    },
    {
      "Condition": "Gaussian blur (5x5)",
      "Model": "Baseline CNN | Gaussian blur (5x5)",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    },
    {
      "Condition": "Gaussian blur (5x5)",
      "Model": "GAN-augmented CNN | Gaussian blur (5x5)",
      "Test images": 120,
      "Correct / total": "24 / 120",
      "Accuracy (%)": 20.0,
      "Balanced accuracy (%)": 20.0,
      "Macro precision (%)": 4.0,
      "Macro recall (%)": 20.0,
      "Macro F1 (%)": 6.67
    }
  ],
  per_class_breakdown: [
    { "class": "small", "support": 24, "baseline_precision": 20.0, "baseline_recall": 100.0, "baseline_f1": 33.33, "gan_precision": 20.0, "gan_recall": 100.0, "gan_f1": 33.33 },
    { "class": "short", "support": 24, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1": 0.0, "gan_precision": 0.0, "gan_recall": 0.0, "gan_f1": 0.0 },
    { "class": "bad", "support": 24, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1": 0.0, "gan_precision": 0.0, "gan_recall": 0.0, "gan_f1": 0.0 },
    { "class": "big", "support": 24, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1": 0.0, "gan_precision": 0.0, "gan_recall": 0.0, "gan_f1": 0.0 },
    { "class": "fast", "support": 24, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1": 0.0, "gan_precision": 0.0, "gan_recall": 0.0, "gan_f1": 0.0 }
  ],
  scientific_conclusion: {
    clean_accuracy: 20.0,
    mode_collapse: true,
    collapsed_class: "small",
    gan_augmented_better: false,
    summary: "Empirical evaluation shows both Baseline CNN and GAN-augmented CNN achieved 20.0% clean test accuracy, which matches random chance for 5 balanced classes. Both networks collapsed entirely into predicting class 'small' (120/120 predictions). Consequently, GAN data augmentation did not provide a statistically significant accuracy or robustness benefit over the baseline."
  }
};

/**
 * Validates uploaded image file format and size.
 */
export function validateImageFile(file: File): { isValid: boolean; errorMessage?: string } {
  if (!file || file.size === 0) {
    return { isValid: false, errorMessage: "Selected file is empty." };
  }
  if (file.size > LAB_EVAL2_CONFIG.MAX_FILE_SIZE_BYTES) {
    return { isValid: false, errorMessage: `File exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).` };
  }
  const name = file.name.toLowerCase();
  const validExt = LAB_EVAL2_CONFIG.ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!validExt) {
    return {
      isValid: false,
      errorMessage: `Unsupported format. Please upload PNG, JPG, JPEG, or WebP.`
    };
  }
  return { isValid: true };
}

/**
 * Fetch Lab Evaluation 2 metadata.
 */
export async function getLabEval2Metadata(): Promise<LabEval2MetadataData> {
  try {
    const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_METADATA}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Using mock LabEval2 metadata:", err);
    return MOCK_METADATA;
  }
}

/**
 * Fetch experimental metrics from exported CSVs.
 */
export async function getLabEval2Metrics(): Promise<LabEval2MetricsData> {
  try {
    const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_METRICS}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Using mock LabEval2 metrics:", err);
    return MOCK_METRICS;
  }
}

/**
 * Fetch gallery items (real & synthetic samples).
 */
export async function getLabEval2Gallery(classFilter?: string, typeFilter?: string): Promise<{ count: number; classes: string[]; items: LabEval2GalleryItem[] }> {
  try {
    let url = `${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_GALLERY}`;
    const params = new URLSearchParams();
    if (classFilter && classFilter !== "all") params.append("class_filter", classFilter);
    if (typeFilter && typeFilter !== "all") params.append("type_filter", typeFilter);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Map absolute URL to backend base
    data.items = data.items.map((item: LabEval2GalleryItem) => ({
      ...item,
      url: item.url.startsWith("http") ? item.url : `${LAB_EVAL2_CONFIG.BASE_URL}${item.url}`
    }));

    return data;
  } catch (err) {
    console.warn("Failed to fetch gallery:", err);
    return { count: 0, classes: ["small", "short", "bad", "big", "fast"], items: [] };
  }
}

/**
 * Fetch list of extracted experiment plots.
 */
export async function getLabEval2Plots(): Promise<{ plots: LabEval2PlotItem[] }> {
  try {
    const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_PLOTS}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    data.plots = data.plots.map((plot: LabEval2PlotItem) => ({
      ...plot,
      url: plot.url.startsWith("http") ? plot.url : `${LAB_EVAL2_CONFIG.BASE_URL}${plot.url}`
    }));

    return data;
  } catch (err) {
    console.warn("Failed to fetch plots:", err);
    return { plots: [] };
  }
}

/**
 * Execute single-image prediction on Baseline CNN, GAN-augmented CNN, or both.
 */
export async function predictLabEval2(
  imageFile: File | Blob,
  modelType: 'baseline' | 'gan_augmented' | 'both' = 'both'
): Promise<LabEval2PredictResponse> {
  const formData = new FormData();
  formData.append('image', imageFile, (imageFile as File).name || 'sample.png');
  formData.append('model', modelType);

  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_PREDICT}`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Inference failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * Generate a class-conditioned synthetic image using Conditional DCGAN Generator.
 */
export async function generateLabEval2Image(
  className: string,
  seed?: number
): Promise<LabEval2GenerateResponse> {
  const res = await fetch(`${LAB_EVAL2_CONFIG.BASE_URL}${LAB_EVAL2_CONFIG.ENDPOINT_GENERATE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_name: className, seed })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Image generation failed with status ${res.status}`);
  }

  return await res.json();
}
