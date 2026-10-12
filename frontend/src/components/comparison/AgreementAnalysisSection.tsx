import { CheckCircle2, AlertCircle, GitCompare, Award } from 'lucide-react';
import type { RecognitionAnalysis } from '../../types';
import { MODELS_DATA } from '../../data/modelsData';

interface AgreementAnalysisSectionProps {
  analysis: RecognitionAnalysis;
}

export const AgreementAnalysisSection = ({ analysis }: AgreementAnalysisSectionProps) => {
  const { agreementStatus, models } = analysis;
  const isConsensus = agreementStatus.allAgree;
  const isMajority = !isConsensus && agreementStatus.agreementCount === 2;

  const mobilenetWord = models.mobilenetv2.predictedWord;

  return (
    <section className="agreement-section fade-in" aria-labelledby="agreement-heading">
      <div className="section-header" style={{ marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="section-tag">Consensus Analysis</span>
          <span className="badge badge-brand">Cross-Architecture Verification</span>
        </div>
        <h3 id="agreement-heading" className="section-title" style={{ fontSize: '1.45rem' }}>
          Multi-Model Prediction Agreement
        </h3>
      </div>

      {/* Agreement Visual Banner */}
      <div
        className={`agreement-banner ${
          isConsensus ? 'consensus' : isMajority ? 'majority' : 'divergent'
        }`}
      >
        <div className="agreement-banner-content">
          <div className="agreement-icon-circle">
            {isConsensus ? (
              <CheckCircle2 size={26} />
            ) : isMajority ? (
              <GitCompare size={26} />
            ) : (
              <AlertCircle size={26} />
            )}
          </div>
          <div>
            <h4 className="agreement-title">
              {isConsensus
                ? `Full Model Consensus: 3 / 3 Architectures Agree on "${agreementStatus.majorityAgreedWord}"`
                : isMajority
                ? `Majority Agreement: 2 / 3 Models Agree on "${agreementStatus.majorityAgreedWord}"`
                : `Divergent Predictions: All 3 Models Predicted Different Classes`}
            </h4>
            <p className="agreement-sub">
              {isConsensus
                ? 'All three architectures converged to the identical ISL class prediction for this video sequence.'
                : isMajority
                ? `Two models concurred on "${agreementStatus.majorityAgreedWord}", while one architecture produced an alternate prediction.`
                : 'No majority consensus reached across the models. MobileNetV2 remains the recommended baseline prediction (67.78% test accuracy).'}
            </p>
          </div>
        </div>

        <span className="badge badge-muted" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          Agreement Count: {agreementStatus.agreementCount} / 3
        </span>
      </div>

      {/* Cross-Model Comparison Table */}
      <div className="glass-card comparison-table-card">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Architecture</th>
              <th>Offline Benchmark Acc</th>
              <th>Predicted Word</th>
              <th>Confidence</th>
              <th>Inference Time</th>
              <th>Agreement with Top Model</th>
            </tr>
          </thead>
          <tbody>
            {MODELS_DATA.map((meta) => {
              const pred = models[meta.id];
              const agreesWithTop = pred.predictedWord === mobilenetWord;

              return (
                <tr key={meta.id}>
                  <td>
                    <div className="table-model-name">
                      <span>{meta.name}</span>
                      {meta.isBestPerformer && (
                        <span className="badge badge-brand" style={{ fontSize: '0.65rem' }}>
                          <Award size={10} />
                          <span>Leader</span>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>
                      {meta.architectureType}
                    </div>
                  </td>

                  <td>
                    <span className="table-acc-badge" style={{ color: meta.isBestPerformer ? 'var(--brand-400)' : '#fff' }}>
                      {meta.testAccuracy.toFixed(2)}%
                    </span>
                  </td>

                  <td>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                      {pred.predictedWord}
                    </strong>
                  </td>

                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {(pred.confidence * 100).toFixed(1)}%
                    </span>
                  </td>

                  <td>
                    <span className="latency-badge">
                      ~{pred.inferenceTimeMs} ms (Simulated)
                    </span>
                  </td>

                  <td>
                    {meta.id === 'mobilenetv2' ? (
                      <span className="badge badge-brand">Baseline Leader</span>
                    ) : agreesWithTop ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} />
                        <span>Agrees</span>
                      </span>
                    ) : (
                      <span className="badge badge-amber">
                        <AlertCircle size={12} />
                        <span>Differs</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
