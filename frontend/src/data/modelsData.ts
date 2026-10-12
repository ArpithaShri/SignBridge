import type { ModelMetrics, ISLClassInfo, RecognitionAnalysis } from '../types';

export const MODELS_DATA: ModelMetrics[] = [
  {
    id: 'mobilenetv2',
    name: 'MobileNetV2',
    architectureType: 'Transfer Learning (Frozen Backbone)',
    testAccuracy: 67.78,
    macroF1: 66.42,
    inputShape: '(33, 224, 224, 3)',
    framesSampled: 33,
    frameResolution: '224 × 224 RGB',
    isBestPerformer: true,
    tagline: 'Top evaluation test accuracy across 76 ISL word classes',
    description:
      'Leverages an ImageNet-pretrained MobileNetV2 backbone as a frozen spatial feature extractor. Extracted frame features are aggregated via Global Average Pooling and classified with dense layers.',
    strengths: [
      'Highest test accuracy on the 76-class ISL dataset (67.78%)',
      'Frozen backbone prevents overfitting on limited domain video data',
      'Compact inverted residual architecture for efficient inference',
      'Strong generalized visual representation from pretrained weights'
    ],
    keyParameters: {
      backbone: 'Pretrained MobileNetV2 (Frozen)',
      pooling: 'Global Average Pooling 2D',
      classificationHead: 'Dense (128, ReLU) + Softmax (76)',
      regularization: 'Dropout (0.3)'
    }
  },
  {
    id: 'custom-cnn',
    name: 'Custom 2D CNN',
    architectureType: 'Scratch 2D CNN Baseline',
    testAccuracy: 58.33,
    macroF1: 56.15,
    inputShape: '(33, 224, 224, 3)',
    framesSampled: 33,
    frameResolution: '224 × 224 RGB',
    isBestPerformer: false,
    tagline: 'Lightweight end-to-end convolutional neural network',
    description:
      'A custom scratch-trained 3-block convolutional network (32, 64, 128 filters) with ReLU activations and 2×2 max pooling, followed by Global Average Pooling and a classification head.',
    strengths: [
      'Trained from scratch directly on ISL video frames',
      'Small memory footprint and fast forward pass',
      'Clean baseline architecture for spatial sign representation',
      'No external pretrained weights dependency'
    ],
    keyParameters: {
      backbone: '3 Conv Blocks (32, 64, 128 filters, 3×3)',
      pooling: 'Max Pooling (2×2) + Global Average Pooling',
      classificationHead: 'Dense (128, ReLU) + Softmax (76)',
      regularization: 'Dropout (0.3)'
    }
  },
  {
    id: 'cnn-lstm',
    name: 'CNN-LSTM',
    architectureType: 'Spatio-Temporal Sequential Model',
    testAccuracy: 61.11,
    macroF1: 59.80,
    inputShape: '(33, 224, 224, 3)',
    framesSampled: 33,
    frameResolution: '224 × 224 RGB',
    isBestPerformer: false,
    tagline: 'Frame feature extraction paired with temporal recurrence',
    description:
      'Extracts spatial visual feature representations from each of the 33 frames via CNN layers, feeding the ordered sequence into an LSTM network to explicitly capture sign movement trajectories over time.',
    strengths: [
      'Explicitly captures dynamic sign language hand motions across time',
      'Processes ordered 33-frame temporal sequence',
      'Recurrent cell state retains gesture transitions',
      'Captures speed and directional variation in ISL gestures'
    ],
    keyParameters: {
      backbone: 'TimeDistributed CNN Feature Extractor',
      pooling: 'TimeDistributed Global Pooling',
      classificationHead: 'LSTM (64 units) + Dense + Softmax (76)',
      regularization: 'Recurrent Dropout (0.2)'
    }
  }
];

export const LATE_FUSION_NOTE = {
  title: 'Late Prediction Fusion Insight',
  accuracy: 60.56,
  explanation:
    'Equal-weight late fusion (averaging softmax probability distributions across Custom CNN, MobileNetV2, and CNN-LSTM) achieved 60.56% on test evaluation. Because MobileNetV2 alone achieves 67.78%, late fusion is not configured as the default predictor to prevent pulling down the top model’s performance.'
};

export const ISL_SAMPLE_CLASSES: ISLClassInfo[] = [
  { index: 0, word: 'NAMASTE', category: 'Greetings' },
  { index: 1, word: 'HELLO', category: 'Greetings' },
  { index: 2, word: 'THANK YOU', category: 'Greetings' },
  { index: 3, word: 'WELCOME', category: 'Greetings' },
  { index: 4, word: 'PLEASE', category: 'Greetings' },
  { index: 5, word: 'FATHER', category: 'Relations' },
  { index: 6, word: 'MOTHER', category: 'Relations' },
  { index: 7, word: 'BROTHER', category: 'Relations' },
  { index: 8, word: 'SISTER', category: 'Relations' },
  { index: 9, word: 'FAMILY', category: 'Relations' },
  { index: 10, word: 'FRIEND', category: 'Relations' },
  { index: 11, word: 'TEACHER', category: 'Relations' },
  { index: 12, word: 'WATER', category: 'Nouns' },
  { index: 13, word: 'FOOD', category: 'Nouns' },
  { index: 14, word: 'HOME', category: 'Nouns' },
  { index: 15, word: 'SCHOOL', category: 'Nouns' },
  { index: 16, word: 'COLLEGE', category: 'Nouns' },
  { index: 17, word: 'HOSPITAL', category: 'Nouns' },
  { index: 18, word: 'DOCTOR', category: 'Nouns' },
  { index: 19, word: 'MEDICINE', category: 'Nouns' },
  { index: 20, word: 'BOOK', category: 'Nouns' },
  { index: 21, word: 'TIME', category: 'Nouns' },
  { index: 22, word: 'MONEY', category: 'Nouns' },
  { index: 23, word: 'HELP', category: 'Actions' },
  { index: 24, word: 'LEARN', category: 'Actions' },
  { index: 25, word: 'UNDERSTAND', category: 'Actions' },
  { index: 26, word: 'READ', category: 'Actions' },
  { index: 27, word: 'WRITE', category: 'Actions' },
  { index: 28, word: 'WALK', category: 'Actions' },
  { index: 29, word: 'TALK', category: 'Actions' },
  { index: 30, word: 'EAT', category: 'Actions' },
  { index: 31, word: 'DRINK', category: 'Actions' },
  { index: 32, word: 'SLEEP', category: 'Actions' },
  { index: 33, word: 'WASH', category: 'Actions' },
  { index: 34, word: 'GOOD', category: 'Common Phrases' },
  { index: 35, word: 'BAD', category: 'Common Phrases' },
  { index: 36, word: 'YES', category: 'Common Phrases' },
  { index: 37, word: 'NO', category: 'Common Phrases' },
  { index: 38, word: 'TODAY', category: 'Common Phrases' },
  { index: 39, word: 'TOMORROW', category: 'Common Phrases' },
  { index: 40, word: 'YESTERDAY', category: 'Common Phrases' },
  { index: 41, word: 'MORNING', category: 'Common Phrases' },
  { index: 42, word: 'NIGHT', category: 'Common Phrases' },
  { index: 43, word: 'ONE', category: 'Numbers' },
  { index: 44, word: 'TWO', category: 'Numbers' },
  { index: 45, word: 'THREE', category: 'Numbers' },
  { index: 46, word: 'FOUR', category: 'Numbers' },
  { index: 47, word: 'FIVE', category: 'Numbers' },
  { index: 48, word: 'SIX', category: 'Numbers' },
  { index: 49, word: 'SEVEN', category: 'Numbers' },
  { index: 50, word: 'EIGHT', category: 'Numbers' },
  { index: 51, word: 'NINE', category: 'Numbers' },
  { index: 52, word: 'TEN', category: 'Numbers' },
];

export const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'Video Ingestion',
    description: 'Accepts short RGB video clips (.MOV, .MP4, .AVI) captured with varying lighting and backgrounds.',
    specs: 'Formats: .MOV, .MP4, .AVI | Up to 100MB'
  },
  {
    step: '02',
    title: 'Uniform Frame Sampling',
    description: 'Samples exactly 33 representative frames across the clip timeline to capture dynamic sign continuity.',
    specs: 'Sample count: 33 frames | Temporal normalization'
  },
  {
    step: '03',
    title: 'Spatial Preprocessing',
    description: 'Resizes each frame to 224 × 224 pixels and normalizes RGB intensity values into [0, 1] range.',
    specs: 'Resolution: 224 × 224 × 3 | Scale: [0, 1]'
  },
  {
    step: '04',
    title: 'Multi-Model Inference',
    description: 'Feeds preprocessed frames simultaneously to Custom CNN, MobileNetV2, and CNN-LSTM architectures.',
    specs: 'Parallel evaluation | 76-way Softmax output'
  },
  {
    step: '05',
    title: 'Consensus & Prediction',
    description: 'Outputs top ISL word class, per-model confidence distributions, latency metrics, and model agreement.',
    specs: 'Default: MobileNetV2 (67.78% best) + Multi-model agreement'
  }
];

export const MOCK_ANALYSIS_PREVIEW: RecognitionAnalysis = {
  videoName: 'sample_namaste_sign.MOV',
  analyzedAt: 'Just now (Mock Simulation)',
  isMockData: true,
  primaryPrediction: {
    modelId: 'mobilenetv2',
    modelName: 'MobileNetV2',
    word: 'NAMASTE',
    confidence: 0.884
  },
  models: {
    mobilenetv2: {
      modelId: 'mobilenetv2',
      modelName: 'MobileNetV2',
      predictedWord: 'NAMASTE',
      confidence: 0.884,
      inferenceTimeMs: 142,
      isBestModelOverall: true,
      status: 'success',
      topK: [
        { word: 'NAMASTE', confidence: 0.884 },
        { word: 'THANK YOU', confidence: 0.052 },
        { word: 'HELLO', confidence: 0.038 }
      ]
    },
    'custom-cnn': {
      modelId: 'custom-cnn',
      modelName: 'Custom 2D CNN',
      predictedWord: 'NAMASTE',
      confidence: 0.742,
      inferenceTimeMs: 98,
      isBestModelOverall: false,
      status: 'success',
      topK: [
        { word: 'NAMASTE', confidence: 0.742 },
        { word: 'WELCOME', confidence: 0.121 },
        { word: 'HELLO', confidence: 0.076 }
      ]
    },
    'cnn-lstm': {
      modelId: 'cnn-lstm',
      modelName: 'CNN-LSTM',
      predictedWord: 'NAMASTE',
      confidence: 0.819,
      inferenceTimeMs: 215,
      isBestModelOverall: false,
      status: 'success',
      topK: [
        { word: 'NAMASTE', confidence: 0.819 },
        { word: 'HELLO', confidence: 0.087 },
        { word: 'THANK YOU', confidence: 0.094 }
      ]
    }
  },
  agreementStatus: {
    allAgree: true,
    majorityAgreedWord: 'NAMASTE',
    agreementCount: 3
  }
};
