/**
 * DEMO FIXTURE — ILLUSTRATIVE DATA FOR PRESENTATION PREVIEW ONLY
 * 
 * IMPORTANT DISCLAIMER:
 * These values are hypothetical illustrative figures created solely for visual UI
 * demonstration during presentations when requested.
 * 
 * THEY ARE NOT MEASURED, ACHIEVED, TESTED, OR VALIDATED IN ANY EMPIRICAL TRAINING RUN.
 * 
 * The default view of the SignBridge application ALWAYS uses the real evaluation
 * state where unmeasured augmented metrics are displayed as "Pending evaluation"
 * or "Not measured".
 */

export interface NoiseRobustnessPoint {
  noiseStd: number;
  accuracy: number;
  f1: number;
  label: string;
}

export interface CnnLstmMetricSet {
  accuracy: number;
  accuracyDisplay: string;
  top3Accuracy: number;
  top3Display: string;
  macroF1: number;
  macroF1Display: string;
  weightedF1: number;
  weightedF1Display: string;
  latencyMs: number;
  latencyDisplay: string;
  crossEntropyLoss: number;
  testVideosEvaluated: number;
  trainingSampleCount: string;
  trainingEpochs: number;
  noiseRobustness: NoiseRobustnessPoint[];
}

export interface CnnLstmDemoFixture {
  disclaimerText: string;
  baseline: CnnLstmMetricSet;
  illustrativeAugmented: CnnLstmMetricSet;
}

export const CNN_LSTM_DEMO_FIXTURE: CnnLstmDemoFixture = {
  disclaimerText:
    'DEMO — ILLUSTRATIVE DATA ONLY. These values are simulated mock projections for UI demonstration and are NOT measured, achieved, or empirically validated.',
  
  // Real measured baseline metrics (from cnn_lstm_baseline_summary.json)
  baseline: {
    accuracy: 4.44,
    accuracyDisplay: '4.44%',
    top3Accuracy: 12.78,
    top3Display: '12.78%',
    macroF1: 0.0100,
    macroF1Display: '0.0100 (1.00%)',
    weightedF1: 0.0097,
    weightedF1Display: '0.0097 (0.97%)',
    latencyMs: 45.6,
    latencyDisplay: '~45.6 ms / sequence',
    crossEntropyLoss: 4.218,
    testVideosEvaluated: 180,
    trainingSampleCount: '4,030 real frames (76 classes, 33 frames/sequence)',
    trainingEpochs: 40,
    noiseRobustness: [
      { noiseStd: 0.00, accuracy: 4.44, f1: 0.0100, label: 'Clean (σ=0.0)' },
      { noiseStd: 0.05, accuracy: 3.89, f1: 0.0089, label: 'Light (σ=0.05)' },
      { noiseStd: 0.10, accuracy: 2.78, f1: 0.0065, label: 'Moderate (σ=0.10)' },
      { noiseStd: 0.15, accuracy: 2.22, f1: 0.0051, label: 'Heavy (σ=0.15)' },
      { noiseStd: 0.20, accuracy: 1.67, f1: 0.0038, label: 'Severe (σ=0.20)' },
    ],
  },

  // Purely illustrative demo figures (clearly labeled as simulated/projected)
  illustrativeAugmented: {
    accuracy: 4.12,
    accuracyDisplay: '4.12% [DEMO]',
    top3Accuracy: 11.95,
    top3Display: '11.95% [DEMO]',
    macroF1: 0.0091,
    macroF1Display: '0.0091 (0.91%) [DEMO]',
    weightedF1: 0.0088,
    weightedF1Display: '0.0088 (0.88%) [DEMO]',
    latencyMs: 46.1,
    latencyDisplay: '~46.1 ms / sequence [DEMO]',
    crossEntropyLoss: 4.305,
    testVideosEvaluated: 180,
    trainingSampleCount: '4,030 Real + 1,800 Synthetic (Hypothetical Projection)',
    trainingEpochs: 40,
    noiseRobustness: [
      { noiseStd: 0.00, accuracy: 4.12, f1: 0.0091, label: 'Clean (σ=0.0) [DEMO]' },
      { noiseStd: 0.05, accuracy: 3.65, f1: 0.0081, label: 'Light (σ=0.05) [DEMO]' },
      { noiseStd: 0.10, accuracy: 2.60, f1: 0.0058, label: 'Moderate (σ=0.10) [DEMO]' },
      { noiseStd: 0.15, accuracy: 2.10, f1: 0.0046, label: 'Heavy (σ=0.15) [DEMO]' },
      { noiseStd: 0.20, accuracy: 1.55, f1: 0.0034, label: 'Severe (σ=0.20) [DEMO]' },
    ],
  },
};
