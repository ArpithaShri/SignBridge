import React from 'react';
import { UploadCloud } from 'lucide-react';

interface RecognitionPlaceholderProps {
  onBackToDashboard: () => void;
}

export const RecognitionPlaceholder: React.FC<RecognitionPlaceholderProps> = ({ onBackToDashboard }) => {
  return (
    <div className="recognition-page fade-in" style={{ padding: '2rem 0' }}>
      <div className="section-header" style={{ textAlign: 'center', alignItems: 'center' }}>
        <span className="section-tag">Page 2 Preview</span>
        <h2 className="section-title">ISL Video Word Recognition</h2>
        <p className="section-subtitle">
          In Phase 2, this page will host the drag-and-drop video uploader supporting .MOV, .MP4, and .AVI files,
          real-time video preview, 33-frame sampling indicator, and recognized ISL word output.
        </p>
      </div>

      <div
        className="glass-card"
        style={{
          maxWidth: '720px',
          margin: '2rem auto',
          textAlign: 'center',
          padding: '3rem 2rem',
          border: '2px dashed var(--border-medium)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--brand-400)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <UploadCloud size={32} />
        </div>

        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: '#fff' }}>
          Drag & Drop ISL Video (.MOV, .MP4)
        </h3>
        <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
          Will support file validation (max 100MB), video player preview, uniform 33-frame extraction,
          and inference with our top model (MobileNetV2: 67.78% accuracy).
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-muted">Phase 2 Planned Features:</span>
          <span className="badge badge-brand">.MOV Video Ingestion</span>
          <span className="badge badge-brand">HTML5 Video Preview</span>
          <span className="badge badge-brand">Analyze & Reset Controls</span>
          <span className="badge badge-brand">Confidence Score Gauge</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onBackToDashboard}>
          <span>← Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
