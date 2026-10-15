import React from 'react';
import { Clock, ArrowLeft, Cpu, Activity, Sparkles } from 'lucide-react';

interface GanCnnLstmPlaceholderProps {
  onBackToGanCnn: () => void;
}

export const GanCnnLstmPlaceholder: React.FC<GanCnnLstmPlaceholderProps> = ({ onBackToGanCnn }) => {
  return (
    <div className="lab2-model-page">
      {/* Header Card */}
      <div className="lab2-card mb-6">
        <div className="flex items-start gap-4">
          <div className="lab2-mini-icon-badge amber shrink-0 mt-1">
            <Clock size={22} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="badge badge-amber text-xs">Phase 2: Pending Integration</span>
              <span className="badge badge-neutral text-xs">Spatio-Temporal Sequence Model</span>
              <span className="badge badge-neutral text-xs">76 Classes Planned</span>
            </div>
            <h2 className="text-xl font-bold text-primary">
              2. GAN + CNN-LSTM Architecture (Lab Evaluation 2)
            </h2>
            <p className="text-secondary text-sm leading-relaxed max-w-3xl">
              This module is reserved for evaluating sequence-level temporal dynamics augmented by generative sequence models 
              or GAN frame interpolations. Checkpoints and evaluation result archives are awaiting independent verification.
            </p>
          </div>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="lab2-card-grid mb-6">
        <div className="lab2-card">
          <div className="lab2-card-header">
            <div className="lab2-mini-icon-badge brand">
              <Cpu size={18} />
            </div>
            <h3 className="lab2-card-title">Planned Architecture</h3>
          </div>
          <p className="text-sm font-semibold text-primary mb-1">TimeDistributed 2D CNN + LSTM Backbone</p>
          <p className="text-xs text-secondary leading-relaxed">
            Extracts 2D spatial feature vectors across 16 sampled frames per sign gesture, feeding recurrent LSTM units 
            to capture transition velocity and hand trajectories.
          </p>
        </div>

        <div className="lab2-card">
          <div className="lab2-card-header">
            <div className="lab2-mini-icon-badge violet">
              <Sparkles size={18} />
            </div>
            <h3 className="lab2-card-title">Generative Augmentation</h3>
          </div>
          <p className="text-sm font-semibold text-primary mb-1">Temporal Sequence Interpolation</p>
          <p className="text-xs text-secondary leading-relaxed">
            Explores latent trajectory synthesis and intermediate frame generation to alleviate gesture speed 
            variations and infrequent sign samples.
          </p>
        </div>

        <div className="lab2-card">
          <div className="lab2-card-header">
            <div className="lab2-mini-icon-badge amber">
              <Activity size={18} />
            </div>
            <h3 className="lab2-card-title">Integration Status</h3>
          </div>
          <p className="text-sm font-semibold text-amber mb-1">Awaiting Experiment Artifacts</p>
          <p className="text-xs text-secondary leading-relaxed">
            Strictly maintained as an unpopulated placeholder to guarantee zero fabricated metrics. 
            Will be populated once notebook training finishes.
          </p>
        </div>
      </div>

      {/* Navigation Return Box */}
      <div className="lab2-card flex items-center justify-between flex-wrap gap-4">
        <div>
          <h4 className="text-sm font-bold text-primary">Looking for verified experiment results?</h4>
          <p className="text-xs text-secondary mt-0.5">The GAN + Custom 2D CNN experiment has fully verified models and held-out test data.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary text-xs font-semibold flex items-center gap-2"
          onClick={onBackToGanCnn}
        >
          <ArrowLeft size={14} />
          <span>Switch to Active GAN + CNN Tab</span>
        </button>
      </div>
    </div>
  );
};
