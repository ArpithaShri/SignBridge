import { Award, BarChart3, GitMerge } from 'lucide-react';
import { MODELS_DATA, LATE_FUSION_NOTE } from '../../data/modelsData';

export const BenchmarkSummarySection = () => {
  return (
    <section className="benchmark-section" aria-labelledby="benchmark-heading">
      {/* Benchmark Disclaimer Banner */}
      <div className="benchmark-banner-box">
        <div className="benchmark-banner-title">
          <BarChart3 size={20} style={{ color: 'var(--brand-400)' }} />
          <span>Established Evaluation Benchmark (Offline Held-Out Test Set)</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-brand">180 Test Videos</span>
          <span className="badge badge-muted">76 Classes</span>
          <span className="badge badge-amber">Offline Evaluation Metrics</span>
        </div>
      </div>

      {/* 4 Benchmark Metric Cards */}
      <div className="benchmark-grid">
        {MODELS_DATA.map((model) => (
          <div
            key={model.id}
            className={`benchmark-card ${model.isBestPerformer ? 'highlight' : ''}`}
          >
            <div className="benchmark-model-name">
              <span>{model.name}</span>
              {model.isBestPerformer && (
                <span className="badge badge-brand" style={{ fontSize: '0.65rem' }}>
                  <Award size={10} />
                  <span>Top Model</span>
                </span>
              )}
            </div>

            <div className={`benchmark-acc-value ${model.isBestPerformer ? 'accent' : ''}`}>
              {model.testAccuracy.toFixed(2)}%
            </div>

            <div className="benchmark-acc-label">Offline Test Accuracy</div>

            <p className="benchmark-context-note">
              {model.id === 'mobilenetv2'
                ? 'Frozen ImageNet backbone provides strong spatial features without overfitting limited sign videos.'
                : model.id === 'custom-cnn'
                ? 'Trained from scratch without visual priors; faces severe representation bottlenecks on 76 classes.'
                : 'Recurrent sequence model trained from scratch; struggles with temporal sample efficiency.'}
            </p>
          </div>
        ))}

        {/* 4th Card: Equal-Weight Late Fusion */}
        <div className="benchmark-card">
          <div className="benchmark-model-name">
            <span>Equal-Weight Late Fusion</span>
            <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>
              <GitMerge size={10} />
              <span>Ensemble</span>
            </span>
          </div>

          <div className="benchmark-acc-value" style={{ color: 'var(--accent-cyan)' }}>
            {LATE_FUSION_NOTE.accuracy.toFixed(2)}%
          </div>

          <div className="benchmark-acc-label">Offline Test Accuracy</div>

          <p className="benchmark-context-note">
            Softmax average across all 3 models. Pulled down below MobileNetV2 (67.78%) by the lower scratch models,
            confirming why late fusion is not default.
          </p>
        </div>
      </div>
    </section>
  );
};
