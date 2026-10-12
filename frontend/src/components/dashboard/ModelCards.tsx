import React from 'react';
import { Award, CheckCircle2, Info } from 'lucide-react';
import { MODELS_DATA, LATE_FUSION_NOTE } from '../../data/modelsData';

export const ModelCards: React.FC = () => {
  return (
    <section className="model-cards-section" aria-labelledby="models-heading" style={{ marginBottom: '3.5rem' }}>
      <div className="section-header">
        <span className="section-tag">Evaluated Architectures</span>
        <h2 id="models-heading" className="section-title">Deep Learning Models in SignBridge</h2>
        <p className="section-subtitle">
          Three distinct deep learning paradigms evaluated on the identical 76-class ISL train, validation, and test splits
          with 33-frame sampling and 224×224 input preprocessing.
        </p>
      </div>

      <div className="models-grid">
        {MODELS_DATA.map((model) => {
          const isBest = model.isBestPerformer;

          return (
            <div
              key={model.id}
              className={`glass-card model-card ${isBest ? 'best-performer' : ''}`}
            >
              {isBest && (
                <div className="best-badge-ribbon">
                  <span className="badge badge-brand">
                    <Award size={13} />
                    <span>Best Test Accuracy</span>
                  </span>
                </div>
              )}

              <div className="model-card-header">
                <span className="model-card-type">{model.architectureType}</span>
                <h3 className="model-card-name">
                  {model.name}
                </h3>

                <div className="accuracy-badge-box">
                  <span className={`accuracy-big-num ${isBest ? 'highlight' : ''}`}>
                    {model.testAccuracy}%
                  </span>
                  <span className="accuracy-label-text">Test Accuracy (76 Classes)</span>
                </div>

                <p className="model-card-description">{model.description}</p>
              </div>

              <div className="model-card-body">
                <div className="model-specs-list">
                  <div className="spec-item">
                    <span className="spec-key">Input Shape:</span>
                    <span className="spec-val">{model.inputShape}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-key">Preprocessing:</span>
                    <span className="spec-val">{model.frameResolution}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-key">Backbone:</span>
                    <span className="spec-val" style={{ fontSize: '0.75rem' }}>{model.keyParameters.backbone}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-key">Pooling & Head:</span>
                    <span className="spec-val" style={{ fontSize: '0.75rem' }}>{model.keyParameters.pooling}</span>
                  </div>
                </div>

                <div className="model-strengths-group">
                  <span className="strengths-title">Architectural Strengths</span>
                  <ul className="strengths-list">
                    {model.strengths.map((str, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={15} />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Late Fusion Insight Callout */}
      <div className="glass-card fusion-callout" role="note" aria-label="Late fusion note">
        <div className="fusion-callout-inner">
          <div className="fusion-icon-box">
            <Info size={24} />
          </div>
          <div className="fusion-content">
            <h4>{LATE_FUSION_NOTE.title} — {LATE_FUSION_NOTE.accuracy}% Evaluation Accuracy</h4>
            <p>{LATE_FUSION_NOTE.explanation}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
