import React from 'react';
import { Clock, ArrowLeft, Cpu, Activity, Zap } from 'lucide-react';

interface GanMobileNetV2PlaceholderProps {
  onBackToGanCnn: () => void;
}

export const GanMobileNetV2Placeholder: React.FC<GanMobileNetV2PlaceholderProps> = ({ onBackToGanCnn }) => {
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
              <span className="badge badge-neutral text-xs">Inverted Residual Transfer Model</span>
              <span className="badge badge-neutral text-xs">76 Classes Planned</span>
            </div>
            <h2 className="text-xl font-bold text-primary">
              3. GAN + MobileNetV2 Architecture (Lab Evaluation 2)
            </h2>
            <p className="text-secondary text-sm leading-relaxed max-w-3xl">
              This module is reserved for evaluating pretrained depthwise separable convolutions fine-tuned 
              with class-conditioned GAN synthesized hand configurations. Checkpoints and evaluation result archives are awaiting independent verification.
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
          <p className="text-sm font-semibold text-primary mb-1">Pretrained MobileNetV2 Transfer Learning</p>
          <p className="text-xs text-secondary leading-relaxed">
            Leverages inverted residual bottlenecks and depthwise separable convolutions pre-trained on ImageNet, 
            adapting high-level visual features for 76 ISL signs.
          </p>
        </div>

        <div className="lab2-card">
          <div className="lab2-card-header">
            <div className="lab2-mini-icon-badge violet">
              <Zap size={18} />
            </div>
            <h3 className="lab2-card-title">Generative Augmentation</h3>
          </div>
          <p className="text-sm font-semibold text-primary mb-1">High-Resolution Conditional GAN</p>
          <p className="text-xs text-secondary leading-relaxed">
            Investigates fine-tuning MobileNetV2 against synthesized high-resolution hand configurations to bridge 
            representation disparity between common and scarce signs.
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
