import type { ModelMetrics, ISLClassInfo, RecognitionAnalysis } from '../types';

export const MODELS_DATA: ModelMetrics[] = [
  {
    id: 'mobilenetv2',
    name: 'MobileNetV2 (Frozen Backbone)',
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
      'Frozen pretrained backbone prevents severe overfitting on limited video data',
      'Compact inverted residual architecture with efficient inference footprint',
      'Robust generalized visual representation across sign handshapes and motion'
    ],
    keyParameters: {
      backbone: 'Pretrained MobileNetV2 (ImageNet weights, Frozen)',
      pooling: 'Global Average Pooling 2D',
      classificationHead: 'Dense (128, ReLU) + Dropout (0.3) + Softmax (76)',
      regularization: 'Dropout (0.3) + Frozen Backbone'
    }
  },
  {
    id: 'custom-cnn',
    name: 'Custom 2D CNN',
    architectureType: 'Scratch 2D CNN Baseline',
    testAccuracy: 5.00,
    macroF1: 4.82,
    inputShape: '(33, 224, 224, 3)',
    framesSampled: 33,
    frameResolution: '224 × 224 RGB',
    isBestPerformer: false,
    tagline: 'Scratch-trained 3-block convolutional neural network',
    description:
      'A custom 3-block convolutional network (32, 64, 128 filters) trained entirely from scratch on raw sign frames. Demonstrates the difficulty of training deep spatial features without pretrained visual priors on 76 classes.',
    strengths: [
      'Lightweight model footprint with low parameter count',
      'Serves as baseline scratch benchmark for 2D spatial learning',
      'Zero external dependency on pretrained weights',
      'Fast per-frame forward pass latency'
    ],
    keyParameters: {
      backbone: '3 Conv Blocks (32, 64, 128 filters, 3×3 + ReLU)',
      pooling: 'Max Pooling (2×2) + Global Average Pooling',
      classificationHead: 'Dense (128, ReLU) + Dropout (0.3) + Softmax (76)',
      regularization: 'Dropout (0.3)'
    }
  },
  {
    id: 'cnn-lstm',
    name: 'CNN-LSTM',
    architectureType: 'Spatio-Temporal Sequential Model',
    testAccuracy: 4.44,
    macroF1: 4.15,
    inputShape: '(33, 224, 224, 3)',
    framesSampled: 33,
    frameResolution: '224 × 224 RGB',
    isBestPerformer: false,
    tagline: 'Frame feature extraction paired with temporal recurrence',
    description:
      'Extracts spatial features from each of the 33 frames via CNN layers, feeding the ordered sequence into an LSTM network. Without pretrained feature extractors, joint spatial and temporal optimization from scratch faces severe sample-efficiency bottlenecks on 76 classes.',
    strengths: [
      'Explicitly processes ordered 33-frame temporal sequence',
      'Designed to model gesture trajectories and sign velocity transitions',
      'Provides empirical benchmark for recurrent temporal architectures',
      'TimeDistributed spatial feature aggregation'
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
  title: 'Late Prediction Fusion Benchmark',
  accuracy: 60.56,
  explanation:
    'Equal-weight late fusion (averaging softmax probability distributions across MobileNetV2, Custom CNN, and CNN-LSTM) achieved 60.56% on the test set. Because MobileNetV2 alone achieves 67.78%, equal-weight fusion is pulled down by the scratch models (5.00% and 4.44%) and is therefore not the default predictor.'
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
    description: 'Feeds preprocessed frames to Custom CNN, MobileNetV2, and CNN-LSTM architectures for comparative analysis.',
    specs: 'Parallel evaluation | 76-way Softmax output'
  },
  {
    step: '05',
    title: 'Consensus & Prediction',
    description: 'Outputs per-model predicted classes, confidence distributions, and consensus agreement analysis.',
    specs: 'Default: MobileNetV2 (67.78% best) + Consensus check'
  }
];

export const MOCK_ANALYSIS_PREVIEW: RecognitionAnalysis = {
  videoName: 'sample_namaste_sign.MOV',
  analyzedAt: 'Just now (Mock Simulation)',
  isMockData: true,
  primaryPrediction: {
    modelId: 'mobilenetv2',
    modelName: 'MobileNetV2 (Frozen Backbone)',
    word: 'NAMASTE',
    confidence: 0.884
  },
  models: {
    mobilenetv2: {
      modelId: 'mobilenetv2',
      modelName: 'MobileNetV2 (Frozen Backbone)',
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
      confidence: 0.324,
      inferenceTimeMs: 98,
      isBestModelOverall: false,
      status: 'success',
      topK: [
        { word: 'NAMASTE', confidence: 0.324 },
        { word: 'HELLO', confidence: 0.185 },
        { word: 'WELCOME', confidence: 0.142 }
      ]
    },
    'cnn-lstm': {
      modelId: 'cnn-lstm',
      modelName: 'CNN-LSTM',
      predictedWord: 'HELLO',
      confidence: 0.281,
      inferenceTimeMs: 215,
      isBestModelOverall: false,
      status: 'success',
      topK: [
        { word: 'HELLO', confidence: 0.281 },
        { word: 'NAMASTE', confidence: 0.245 },
        { word: 'THANK YOU', confidence: 0.114 }
      ]
    }
  },
  agreementStatus: {
    allAgree: false,
    majorityAgreedWord: 'NAMASTE',
    agreementCount: 2
  }
};
