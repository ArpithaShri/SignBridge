import { Award, Clock } from 'lucide-react';
import type { ModelPrediction, ModelMetrics } from '../../types';

interface ModelComparisonCardProps {
  modelMeta: ModelMetrics;
  prediction?: ModelPrediction;
  isLoading: boolean;
}

export const ModelComparisonCard = ({
  modelMeta,
  prediction,
  isLoading
}: ModelComparisonCardProps) => {
  const isBest = modelMeta.isBestPerformer;
  const confidencePercent = prediction ? (prediction.confidence * 100).toFixed(1) : null;

  return (
    <div
      className={`glass-card comparison-model-card ${isBest ? 'top-performer' : ''} fade-in`}
    >
      <div>
        {/* Card Header */}
        <div className="comparison-card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="comparison-model-tag">{modelMeta.architectureType}</span>
            {isBest && (
              <span className="badge badge-brand" style={{ fontSize: '0.65rem' }}>
                <Award size={11} />
                <span>Top Evaluation Model</span>
              </span>
            )}
          </div>
          <h3 className="comparison-model-title">{modelMeta.name}</h3>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isBest ? 'var(--brand-400)' : '#fff' }}>
              {modelMeta.testAccuracy.toFixed(2)}%
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Offline Test Accuracy
            </span>
          </div>

          {isBest && (
            <p style={{ fontSize: '0.725rem', color: 'var(--brand-400)', margin: '0.2rem 0 0' }}>
              *Best overall test benchmark; not assumed superior on every single clip.
            </p>
          )}
        </div>

        {/* Prediction Display Box */}
        <div className="comparison-pred-box">
          {isLoading ? (
            <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div className="loading-spinner-ring" style={{ width: '32px', height: '32px' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Running forward pass...
              </span>
            </div>
          ) : prediction && prediction.status === 'success' ? (
            <>
              <span style={{ fontSize: '0.725rem', color: 'var(--brand-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                Predicted Word
              </span>
              <div className="comparison-pred-word">{prediction.predictedWord}</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.4rem' }}>
                <span className="latency-badge" title="Simulated processing time for mock testing">
                  <Clock size={12} />
                  <span>~{prediction.inferenceTimeMs} ms (Simulated)</span>
                </span>
              </div>
            </>
          ) : (
            <div style={{ padding: '1.5rem 0', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              Awaiting video analysis
            </div>
          )}
        </div>

        {/* Confidence Meter (When prediction is available) */}
        {prediction && prediction.status === 'success' && confidencePercent && (
          <div className="confidence-box" style={{ marginBottom: '1.25rem' }}>
            <div className="confidence-header-row">
              <span className="confidence-label">Prediction Confidence</span>
              <span className="confidence-percentage">{confidencePercent}%</span>
            </div>
            <div className="confidence-bar-track">
              <div
                className="confidence-bar-fill"
                style={{
                  width: `${confidencePercent}%`,
                  background: isBest
                    ? 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)'
                    : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
                }}
              />
            </div>
          </div>
        )}

        {/* Top-K Candidates */}
        {prediction && prediction.topK && prediction.topK.length > 1 && (
          <div className="topk-container" style={{ marginBottom: '1.25rem' }}>
            <span className="topk-title">Top Candidates</span>
            {prediction.topK.map((item, idx) => (
              <div key={idx} className="topk-item">
                <span className="topk-word">#{idx + 1} {item.word}</span>
                <span className="topk-score">{(item.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Specs Footer */}
      <div className="result-specs-footer">
        <span>Shape: {modelMeta.inputShape}</span>
        <span>Resolution: {modelMeta.frameResolution}</span>
      </div>
    </div>
  );
};
