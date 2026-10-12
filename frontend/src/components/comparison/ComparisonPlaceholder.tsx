import React from 'react';
import { MODELS_DATA } from '../../data/modelsData';

interface ComparisonPlaceholderProps {
  onBackToDashboard: () => void;
}

export const ComparisonPlaceholder: React.FC<ComparisonPlaceholderProps> = ({ onBackToDashboard }) => {
  return (
    <div className="comparison-page fade-in" style={{ padding: '2rem 0' }}>
      <div className="section-header" style={{ textAlign: 'center', alignItems: 'center' }}>
        <span className="section-tag">Page 3 Preview</span>
        <h2 className="section-title">Tri-Model Comparison & Agreement Matrix</h2>
        <p className="section-subtitle">
          In Phase 3, this page will display real-time comparative outputs for Custom CNN, MobileNetV2, and CNN-LSTM side-by-side,
          showing predicted words, confidence distributions, inference times, and consensus agreement analysis.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.25rem',
          maxWidth: '1000px',
          margin: '2.5rem auto 1.5rem'
        }}
      >
        {MODELS_DATA.map((m) => (
          <div key={m.id} className="glass-card" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                {m.architectureType}
              </span>
              {m.isBestPerformer && (
                <span className="badge badge-brand" style={{ fontSize: '0.7rem' }}>
                  Top Performer
                </span>
              )}
            </div>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>{m.name}</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.isBestPerformer ? 'var(--brand-400)' : 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {m.testAccuracy}%
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '0.35rem', fontWeight: 500 }}>Test Acc</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {m.tagline}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              <div style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Planned Output:</div>
              <div style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>Predicted ISL Word, Confidence Score, Inference Latency</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onBackToDashboard}>
          <span>← Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
