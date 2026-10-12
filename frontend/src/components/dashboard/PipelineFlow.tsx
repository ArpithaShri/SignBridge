import React from 'react';
import { PIPELINE_STEPS } from '../../data/modelsData';

export const PipelineFlow: React.FC = () => {
  return (
    <section className="pipeline-flow-section" aria-labelledby="pipeline-heading" style={{ marginBottom: '3.5rem' }}>
      <div className="section-header">
        <span className="section-tag">End-to-End Workflow</span>
        <h2 id="pipeline-heading" className="section-title">ISL Recognition Inference Pipeline</h2>
        <p className="section-subtitle">
          From raw video clip capture to multi-model consensus prediction, each stage mirrors the evaluation preprocessing protocol.
        </p>
      </div>

      <div className="pipeline-flow-grid">
        {PIPELINE_STEPS.map((step) => (
          <div key={step.step} className="pipeline-step-card">
            <span className="step-num-pill">{step.step}</span>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-desc">{step.description}</p>
            <div className="step-specs">{step.specs}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
