import React, { useState } from 'react';
import { 
  FlaskConical, 
  Cpu, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Database, 
  FileCheck2,
  TrendingUp,
  Percent,
  Sparkles
} from 'lucide-react';
import { GanCnnPage } from './GanCnnPage';
import { GanCnnLstmPlaceholder } from './GanCnnLstmPlaceholder';
import { GanMobileNetV2Placeholder } from './GanMobileNetV2Placeholder';

export type LabEval2ModelTab = 'gan-cnn' | 'gan-cnn-lstm' | 'gan-mobilenetv2';

export const LabEval2Container: React.FC = () => {
  const [activeModelTab, setActiveModelTab] = useState<LabEval2ModelTab>('gan-cnn');

  return (
    <div className="lab2-page-container">
      {/* Academic Header Banner */}
      <header className="lab2-header-card">
        <div className="lab2-header-meta">
          <div className="lab2-badge-row">
            <span className="badge badge-brand">
              <FlaskConical size={13} />
              <span>Lab Evaluation 2</span>
            </span>
            <span className="badge badge-brand-subtle">
              <Sparkles size={13} />
              <span>Generative AI Research</span>
            </span>
            <span className="badge badge-neutral">
              <span>76 Word Vocabulary</span>
            </span>
          </div>

          <h1 className="lab2-main-title">
            Comparative Generative Data Augmentation for Indian Sign Language
          </h1>

          <p className="lab2-lead-text">
            A systematic empirical investigation evaluating whether class-conditioned synthetic data synthesized 
            by Deep Convolutional Generative Adversarial Networks (DCGAN) mitigates class imbalance and improves 
            representation robustness across 76 Indian Sign Language word classes.
          </p>
        </div>

        {/* 3 Experiment Selector Cards */}
        <div className="lab2-experiments-grid" role="tablist" aria-label="Lab Evaluation 2 Experiments">
          {/* 1. GAN + CNN */}
          <button
            id="tab-lab2-gan-cnn"
            type="button"
            className={`lab2-experiment-card ${activeModelTab === 'gan-cnn' ? 'active' : ''}`}
            onClick={() => setActiveModelTab('gan-cnn')}
            role="tab"
            aria-selected={activeModelTab === 'gan-cnn'}
          >
            <div className="lab2-exp-top">
              <div className="lab2-exp-icon-wrap active-brand">
                <Cpu size={20} />
              </div>
              <span className="badge badge-success text-[11px]">
                <CheckCircle2 size={11} /> Verified Run
              </span>
            </div>
            <div className="lab2-exp-title">1. GAN + Custom 2D CNN</div>
            <p className="lab2-exp-desc">
              4-Block Conv2D backbone evaluated against 50% class-conditioned DCGAN augmentation on 900 held-out test frames.
            </p>
            <div className="lab2-exp-footer">
              <span className="font-mono text-xs font-semibold text-accent-emerald">49.89% Base</span>
              <span className="text-secondary text-xs">•</span>
              <span className="font-mono text-xs font-semibold text-accent-amber">29.00% Aug</span>
            </div>
          </button>

          {/* 2. GAN + CNN-LSTM */}
          <button
            id="tab-lab2-gan-cnn-lstm"
            type="button"
            className={`lab2-experiment-card ${activeModelTab === 'gan-cnn-lstm' ? 'active' : ''}`}
            onClick={() => setActiveModelTab('gan-cnn-lstm')}
            role="tab"
            aria-selected={activeModelTab === 'gan-cnn-lstm'}
          >
            <div className="lab2-exp-top">
              <div className="lab2-exp-icon-wrap">
                <Layers size={20} />
              </div>
              <span className="badge badge-amber text-[11px]">
                <Clock size={11} /> Pending Integration
              </span>
            </div>
            <div className="lab2-exp-title">2. GAN + CNN-LSTM</div>
            <p className="lab2-exp-desc">
              Spatio-temporal recurrent network modeling sequential frame dynamics with generative trajectory interpolation.
            </p>
            <div className="lab2-exp-footer">
              <span className="text-xs text-secondary font-medium">Awaiting Checkpoints</span>
            </div>
          </button>

          {/* 3. GAN + MobileNetV2 */}
          <button
            id="tab-lab2-gan-mobilenetv2"
            type="button"
            className={`lab2-experiment-card ${activeModelTab === 'gan-mobilenetv2' ? 'active' : ''}`}
            onClick={() => setActiveModelTab('gan-mobilenetv2')}
            role="tab"
            aria-selected={activeModelTab === 'gan-mobilenetv2'}
          >
            <div className="lab2-exp-top">
              <div className="lab2-exp-icon-wrap">
                <Zap size={20} />
              </div>
              <span className="badge badge-amber text-[11px]">
                <Clock size={11} /> Pending Integration
              </span>
            </div>
            <div className="lab2-exp-title">3. GAN + MobileNetV2</div>
            <p className="lab2-exp-desc">
              Pretrained depthwise separable inverted residual architecture fine-tuned on generative sign variations.
            </p>
            <div className="lab2-exp-footer">
              <span className="text-xs text-secondary font-medium">Awaiting Checkpoints</span>
            </div>
          </button>
        </div>

        {/* Selected Experiment KPI Summary Bar (when GAN + CNN active) */}
        {activeModelTab === 'gan-cnn' && (
          <div className="lab2-kpi-bar" aria-label="Experiment Ground Truth Metrics">
            <div className="lab2-kpi-card">
              <div className="lab2-kpi-label">
                <Database size={13} className="text-brand" />
                <span>Vocabulary</span>
              </div>
              <div className="lab2-kpi-value">76</div>
              <div className="lab2-kpi-sub">ISL Word Classes</div>
            </div>

            <div className="lab2-kpi-card">
              <div className="lab2-kpi-label">
                <FileCheck2 size={13} className="text-cyan" />
                <span>Held-Out Test</span>
              </div>
              <div className="lab2-kpi-value font-mono">900</div>
              <div className="lab2-kpi-sub">Real Isolated Frames</div>
            </div>

            <div className="lab2-kpi-card highlight-baseline">
              <div className="lab2-kpi-label">
                <Percent size={13} className="text-emerald" />
                <span>Baseline CNN</span>
              </div>
              <div className="lab2-kpi-value font-mono text-emerald">49.89%</div>
              <div className="lab2-kpi-sub">Clean Accuracy (449/900)</div>
            </div>

            <div className="lab2-kpi-card highlight-aug">
              <div className="lab2-kpi-label">
                <TrendingUp size={13} className="text-amber" />
                <span>DCGAN + CNN</span>
              </div>
              <div className="lab2-kpi-value font-mono text-amber">29.00%</div>
              <div className="lab2-kpi-sub">Clean Accuracy (261/900)</div>
            </div>

            <div className="lab2-kpi-card">
              <div className="lab2-kpi-label">
                <CheckCircle2 size={13} className="text-violet" />
                <span>Artifacts</span>
              </div>
              <div className="lab2-kpi-value">3</div>
              <div className="lab2-kpi-sub">Keras Models Loaded</div>
            </div>
          </div>
        )}
      </header>

      {/* Main Model Tab Content */}
      <main className="lab2-tab-content">
        {activeModelTab === 'gan-cnn' && (
          <GanCnnPage onNavigateToTab={setActiveModelTab} />
        )}

        {activeModelTab === 'gan-cnn-lstm' && (
          <GanCnnLstmPlaceholder onBackToGanCnn={() => setActiveModelTab('gan-cnn')} />
        )}

        {activeModelTab === 'gan-mobilenetv2' && (
          <GanMobileNetV2Placeholder onBackToGanCnn={() => setActiveModelTab('gan-cnn')} />
        )}
      </main>
    </div>
  );
};
