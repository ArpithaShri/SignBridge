import { useState, useEffect } from 'react';
import { AlertCircle, Info, Film } from 'lucide-react';
import { BenchmarkSummarySection } from './BenchmarkSummarySection';
import { ModelComparisonCard } from './ModelComparisonCard';
import { AgreementAnalysisSection } from './AgreementAnalysisSection';
import { compareAllModels, validateVideoFile } from '../../services/recognitionApi';
import { MODELS_DATA } from '../../data/modelsData';
import type { RecognitionAnalysis } from '../../types';

/**
 * Creates a synthetic video file in-memory for testing the comparison page.
 */
function createSyntheticComparisonFile(filename: string): File {
  const blob = new Blob(['sample-isl-video-binary-content'], { type: 'video/quicktime' });
  return new File([blob], filename, { type: 'video/quicktime', lastModified: Date.now() });
}

export const ComparisonPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(() =>
    createSyntheticComparisonFile('namaste_sign_clip.MOV')
  );
  const [isComparing, setIsComparing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RecognitionAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically perform comparison on initial load with the default sample file
  useEffect(() => {
    if (selectedFile && !analysisResult) {
      handleRunComparison(selectedFile);
    }
  }, []);

  const handleRunComparison = async (fileToAnalyze: File) => {
    setIsComparing(true);
    setErrorMessage(null);

    try {
      const result = await compareAllModels({
        videoFile: fileToAnalyze,
        samplingFrames: 33
      });
      setAnalysisResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during multi-model comparison';
      setErrorMessage(msg);
    } finally {
      setIsComparing(false);
    }
  };

  const handleSelectSampleClip = (name: string) => {
    const file = createSyntheticComparisonFile(name);
    setSelectedFile(file);
    handleRunComparison(file);
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validation = validateVideoFile(file);
      if (!validation.isValid) {
        setErrorMessage(validation.errorMessage || 'Invalid video file');
        return;
      }
      setSelectedFile(file);
      handleRunComparison(file);
    }
  };

  return (
    <div className="comparison-workspace fade-in">
      {/* Header */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <span className="section-tag">Model Benchmarking & Inference</span>
          <span className="badge badge-brand">3 DL Architectures</span>
          <span className="badge badge-muted">Cross-Model Comparison</span>
        </div>
        <h2 className="section-title">Tri-Model ISL Comparison & Agreement Matrix</h2>
        <p className="section-subtitle">
          Side-by-side comparative analysis of MobileNetV2 (Frozen Backbone), Custom 2D CNN, and CNN-LSTM models.
          Evaluates prediction consensus, confidence distributions, and agreement on 76 Indian Sign Language classes.
        </p>
      </div>

      {/* Part 1: Offline Test-Set Benchmark Section */}
      <BenchmarkSummarySection />

      {/* Part 2: Video Selection & Analysis Action Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Film size={20} style={{ color: 'var(--brand-400)' }} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
              Active Video Sequence: <code style={{ color: 'var(--brand-400)' }}>{selectedFile?.name || 'None selected'}</code>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Uniform 33-frame sampling across video timeline at 224×224 RGB
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Test Clips:
          </span>
          <button
            id="btn-compare-namaste"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleSelectSampleClip('namaste_sign_clip.MOV')}
            disabled={isComparing}
          >
            <code>namaste.MOV</code>
          </button>
          <button
            id="btn-compare-thankyou"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleSelectSampleClip('thank_you_sign_clip.MOV')}
            disabled={isComparing}
          >
            <code>thank_you.MOV</code>
          </button>
          <button
            id="btn-compare-water"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleSelectSampleClip('water_sign_clip.MOV')}
            disabled={isComparing}
          >
            <code>water.MOV</code>
          </button>

          <label
            className="btn btn-secondary btn-sm"
            style={{ cursor: 'pointer', margin: 0 }}
            title="Upload a local .MOV, .MP4, or .AVI file"
          >
            <span>Upload Custom Video</span>
            <input
              type="file"
              accept=".mov,.mp4,.avi,video/*"
              style={{ display: 'none' }}
              onChange={handleFileUploadChange}
            />
          </label>

          {selectedFile && (
            <button
              id="btn-run-comparison"
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleRunComparison(selectedFile)}
              disabled={isComparing}
            >
              {isComparing ? 'Running 3 Models...' : 'Re-run Comparison'}
            </button>
          )}
        </div>
      </div>

      {/* Simulated Mock Alert Banner */}
      <div className="mock-notice-box" role="status">
        <Info size={22} style={{ flexShrink: 0, color: 'var(--accent-amber)' }} />
        <div>
          <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>
            Simulated Prediction Demonstration (Phase 3 Mock Mode)
          </strong>
          <p>
            The per-video predicted words, confidence percentages, and latencies below are simulated mock data to demonstrate
            the multi-model comparison interface and agreement analysis. Real neural inferences will be generated in Phase 4
            once the Python backend loads the saved Keras model checkpoints.
          </p>
        </div>
      </div>

      {/* Part 3: Tri-Model Cards Grid */}
      <div className="comparison-tri-grid">
        {MODELS_DATA.map((model) => (
          <ModelComparisonCard
            key={model.id}
            modelMeta={model}
            prediction={analysisResult?.models[model.id]}
            isLoading={isComparing}
          />
        ))}
      </div>

      {/* Part 4: Consensus & Cross-Model Agreement Matrix */}
      {analysisResult && !isComparing && (
        <AgreementAnalysisSection analysis={analysisResult} />
      )}

      {errorMessage && (
        <div className="validation-error-alert" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <h5>Comparison Error</h5>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
