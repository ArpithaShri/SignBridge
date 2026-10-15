import React from 'react';
import { Clock, AlertCircle, ArrowLeft, Cpu, Activity, Sparkles } from 'lucide-react';

interface GanCnnLstmPlaceholderProps {
  onBackToGanCnn: () => void;
}

export const GanCnnLstmPlaceholder: React.FC<GanCnnLstmPlaceholderProps> = ({ onBackToGanCnn }) => {
  return (
    <div className="lab2-model-page">
      {/* Header Banner */}
      <div className="lab2-phase1-status-card border-amber/30 bg-amber/5">
        <div className="lab2-phase1-status-icon text-amber">
          <Clock size={28} />
        </div>
        <div className="lab2-phase1-status-content">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="badge badge-amber">Phase 2: Pending Integration</span>
            <span className="badge badge-neutral">Spatio-Temporal Sequence Model</span>
            <span className="badge badge-neutral">76 Classes Planned</span>
          </div>
          <h2 className="text-xl font-bold text-primary mb-1">
            GAN + CNN-LSTM Architecture (Lab Evaluation 2)
          </h2>
          <p className="text-secondary text-sm leading-relaxed">
            This module is reserved for evaluating sequence-level temporal dynamics augmented by generative sequence models or GAN frame interpolations. Artifact files and evaluation metrics have not yet been provided.
          </p>
        </div>
      </div>

      {/* Placeholder Details Card */}
      <div className="lab2-card mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-amber mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-primary">Awaiting Model Checkpoints & Evaluation Artifacts</h3>
            <p className="text-sm text-secondary leading-relaxed">
              In accordance with Phase 2 specifications, this tab is strictly maintained as an unpopulated placeholder to prevent synthetic results fabrication. Only the <strong>GAN + CNN</strong> model has verified weights and evaluation metrics.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border/40 bg-surface/40">
            <div className="text-xs font-semibold text-secondary mb-1 flex items-center gap-1.5">
              <Cpu size={14} className="text-brand" /> Planned Architecture
            </div>
            <div className="text-sm font-bold text-primary">TimeDistributed CNN + LSTM</div>
            <p className="text-xs text-secondary mt-1">
              Extracts 2D spatial features per sampled frame and models gesture sequence transitions across time.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/40 bg-surface/40">
            <div className="text-xs font-semibold text-secondary mb-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet" /> Generative Method
            </div>
            <div className="text-sm font-bold text-primary">Temporal Sequence Augmentation</div>
            <p className="text-xs text-secondary mt-1">
              Synthesizes intermediate sequence frames or video latent trajectories to enrich training variations.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/40 bg-surface/40">
            <div className="text-xs font-semibold text-secondary mb-1 flex items-center gap-1.5">
              <Activity size={14} className="text-cyan" /> Status
            </div>
            <div className="text-sm font-bold text-amber">Pending Checkpoint Upload</div>
            <p className="text-xs text-secondary mt-1">
              Notebook and evaluation results archive will be integrated in subsequent phases.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs text-secondary">
            Looking for active experiment results?
          </span>
          <button
            type="button"
            className="btn btn-primary text-xs flex items-center gap-1.5"
            onClick={onBackToGanCnn}
          >
            <ArrowLeft size={14} />
            <span>Switch to Active GAN + CNN Tab</span>
          </button>
        </div>
      </div>
    </div>
  );
};
