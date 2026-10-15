import React from 'react';
import { Clock, AlertCircle, ArrowLeft, Cpu, Activity, Zap } from 'lucide-react';

interface GanMobileNetV2PlaceholderProps {
  onBackToGanCnn: () => void;
}

export const GanMobileNetV2Placeholder: React.FC<GanMobileNetV2PlaceholderProps> = ({ onBackToGanCnn }) => {
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
            <span className="badge badge-neutral">Inverted Residual Transfer Backbone</span>
            <span className="badge badge-neutral">76 Classes Planned</span>
          </div>
          <h2 className="text-xl font-bold text-primary mb-1">
            GAN + MobileNetV2 Architecture (Lab Evaluation 2)
          </h2>
          <p className="text-secondary text-sm leading-relaxed">
            This module is reserved for evaluating pretrained lightweight inverted residual bottlenecks augmented by conditional GAN generated sign samples. Artifact files and evaluation metrics have not yet been provided.
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
            <div className="text-sm font-bold text-primary">MobileNetV2 Transfer Learning</div>
            <p className="text-xs text-secondary mt-1">
              Leverages depthwise separable convolutions and inverted residual bottlenecks for edge efficiency.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/40 bg-surface/40">
            <div className="text-xs font-semibold text-secondary mb-1 flex items-center gap-1.5">
              <Zap size={14} className="text-violet" /> Generative Method
            </div>
            <div className="text-sm font-bold text-primary">Conditional GAN Sample Synthesis</div>
            <p className="text-xs text-secondary mt-1">
              Investigates fine-tuning MobileNetV2 features against synthesized high-resolution hand configurations.
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
