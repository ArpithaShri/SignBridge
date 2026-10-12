export type NavigationTab = 'dashboard' | 'recognition' | 'comparison';

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
  sizeMB: number;
  format: string;
  durationSeconds?: number;
  previewUrl: string;
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
  topK?: { word: string; confidence: number }[];
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
