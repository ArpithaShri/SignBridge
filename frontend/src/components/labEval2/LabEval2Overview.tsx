import React from 'react';
import { 
  Database, 
  Cpu, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';
import type { LabEval2MetadataData } from '../../types';

interface LabEval2OverviewProps {
  metadata: LabEval2MetadataData;
  onNavigateSection: (section: 'overview' | 'gallery' | 'classifier' | 'dashboard') => void;
}

export const LabEval2Overview: React.FC<LabEval2OverviewProps> = ({
  metadata,
  onNavigateSection
}) => {
  const { overview } = metadata;

  return (
    <div className="lab2-overview-section">
      {/* Hero Headline & Summary Banner */}
      <div className="lab2-hero-card">
        <div className="lab2-hero-badge">
          <Sparkles size={14} />
          <span>Research Experiment • 5 Selected ISL Word Classes</span>
        </div>
        <h1 className="lab2-hero-title">
          Conditional DCGAN Data Augmentation vs. Baseline CNN
        </h1>
        <p className="lab2-hero-desc">
          Investigating whether class-conditioned generative adversarial synthesis at 64×64 RGB resolution
          enhances convolutional feature learning and classification accuracy under severe low-data constraints
          in Indian Sign Language video frames.
        </p>

        {/* Highlight Stats Row */}
        <div className="lab2-stats-grid">
          <div className="lab2-stat-card">
            <span className="lab2-stat-label">Target Classes</span>
            <span className="lab2-stat-val text-brand">5 Classes</span>
            <span className="lab2-stat-sub">bad, big, fast, short, small</span>
          </div>
          <div className="lab2-stat-card">
            <span className="lab2-stat-label">Real Training Frames</span>
            <span className="lab2-stat-val text-cyan">616</span>
            <span className="lab2-stat-sub">8 uniform frames / video</span>
          </div>
          <div className="lab2-stat-card">
            <span className="lab2-stat-label">Synthetic DCGAN Images</span>
            <span className="lab2-stat-val text-violet">600</span>
            <span className="lab2-stat-sub">120 generated / class</span>
          </div>
          <div className="lab2-stat-card">
            <span className="lab2-stat-label">GAN-Augmented Pool</span>
            <span className="lab2-stat-val text-emerald">1,216</span>
            <span className="lab2-stat-sub">616 Real + 600 Synthetic</span>
          </div>
          <div className="lab2-stat-card">
            <span className="lab2-stat-label">Clean Test Accuracy</span>
            <span className="lab2-stat-val text-amber">20.0%</span>
            <span className="lab2-stat-sub">Both Models (Random = 20%)</span>
          </div>
        </div>
      </div>

      {/* Critical Scientific Finding Banner (Honest Reporting) */}
      <div className="lab2-collapse-card">
        <div className="lab2-collapse-icon">
          <AlertTriangle size={24} />
        </div>
        <div className="lab2-collapse-content">
          <div className="lab2-collapse-header">
            <h3>Empirical Finding: Single-Class Mode Collapse (Zero Net Gain)</h3>
            <span className="badge badge-amber">Honest Research Reporting</span>
          </div>
          <p>
            Both the <strong>Baseline CNN</strong> (trained on 616 real images) and the{' '}
            <strong>GAN-Augmented CNN</strong> (trained on 1,216 combined images) achieved exactly{' '}
            <strong className="text-amber">20.0% clean test accuracy</strong> (24 / 120 correct).
            Rigorous confusion matrix analysis confirms that both classifiers collapsed completely into predicting{' '}
            <code>small</code> (class index 0) for 100% of the 120 test frames.
          </p>
          <div className="lab2-collapse-bullets">
            <div className="lab2-bullet-item">
              <span className="lab2-dot text-amber">•</span>
              <span><strong>No Clean Accuracy Gain:</strong> GAN data augmentation yielded 0.0% improvement (20.0% vs. 20.0%).</span>
            </div>
            <div className="lab2-bullet-item">
              <span className="lab2-dot text-amber">•</span>
              <span><strong>Macro F1 Plateau:</strong> Both architectures registered a Macro F1 score of only 6.67%.</span>
            </div>
            <div className="lab2-bullet-item">
              <span className="lab2-dot text-amber">•</span>
              <span><strong>Resolution & Artifact Limits:</strong> 64×64 DCGAN frames lacked fine articulation details of hand sign gestures.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Experimental Setup & Architecture Comparison */}
      <div className="lab2-grid-2col">
        {/* Baseline CNN Card */}
        <div className="lab2-model-spec-card">
          <div className="lab2-spec-header">
            <div className="lab2-spec-icon-wrap bg-cyan-subtle">
              <Cpu size={20} className="text-cyan" />
            </div>
            <div>
              <h3 className="lab2-spec-title">1. Baseline CNN</h3>
              <span className="lab2-spec-subtitle">Standard Convolutional Architecture</span>
            </div>
            <span className="badge badge-brand">Control Model</span>
          </div>

          <div className="lab2-spec-body">
            <div className="lab2-spec-row">
              <span className="text-secondary">Training Data:</span>
              <span className="font-semibold text-primary">616 Real Frames</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Input Resolution:</span>
              <span className="font-mono text-primary">64 × 64 × 3 RGB</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Pixel Normalization:</span>
              <span className="font-mono text-primary">[0, 1] (/ 255.0)</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Backbone Layers:</span>
              <span className="text-primary">Conv2D(32, 64, 128) + MaxPool</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Dense Classifier Head:</span>
              <span className="text-primary">GlobalAvgPool + Dense(128) + Dropout(0.4)</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Output Activation:</span>
              <span className="font-mono text-primary">5 Units, Softmax</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Mean Per-Image Latency:</span>
              <span className="font-mono text-emerald">2.18 ms</span>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary w-full mt-4"
            onClick={() => onNavigateSection('classifier')}
          >
            <span>Test Baseline Inference</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* GAN-Augmented CNN Card */}
        <div className="lab2-model-spec-card">
          <div className="lab2-spec-header">
            <div className="lab2-spec-icon-wrap bg-violet-subtle">
              <Sparkles size={20} className="text-violet" />
            </div>
            <div>
              <h3 className="lab2-spec-title">2. GAN-Augmented CNN</h3>
              <span className="lab2-spec-subtitle">Synthetic Hybrid Architecture</span>
            </div>
            <span className="badge badge-violet">Experimental Model</span>
          </div>

          <div className="lab2-spec-body">
            <div className="lab2-spec-row">
              <span className="text-secondary">Training Data:</span>
              <span className="font-semibold text-primary">1,216 Images (616 Real + 600 Synthetic)</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Input Resolution:</span>
              <span className="font-mono text-primary">64 × 64 × 3 RGB</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Synthetic Ratio:</span>
              <span className="font-semibold text-violet">49.3% Synthetic Augmented</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Generator Architecture:</span>
              <span className="text-primary">Latent(100) + Class(5) → Dense → 4x Conv2DTranspose</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Classifier Backbone:</span>
              <span className="text-primary">Identical 3-block CNN (for controlled comparison)</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Output Activation:</span>
              <span className="font-mono text-primary">5 Units, Softmax</span>
            </div>
            <div className="lab2-spec-row">
              <span className="text-secondary">Mean Per-Image Latency:</span>
              <span className="font-mono text-emerald">3.28 ms</span>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary w-full mt-4"
            onClick={() => onNavigateSection('gallery')}
          >
            <span>View Synthetic Gallery</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Dataset & Frame Extraction Protocol */}
      <div className="lab2-dataset-panel">
        <div className="lab2-panel-header">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-brand" />
            <h3 className="text-lg font-semibold text-primary">Dataset Extraction & Partition Protocol</h3>
          </div>
          <span className="text-xs font-mono text-secondary">8 Frames Uniform Temporal Sampling</span>
        </div>

        <div className="lab2-table-wrapper">
          <table className="lab2-table">
            <thead>
              <tr>
                <th>Data Split</th>
                <th>Real Video Frames</th>
                <th>Synthetic DCGAN Frames</th>
                <th>Total Training Pool</th>
                <th>Purpose in Experiment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-primary">Train (Baseline)</td>
                <td className="font-mono">616</td>
                <td className="font-mono text-secondary">0</td>
                <td className="font-mono font-bold text-cyan">616</td>
                <td className="text-secondary">Train baseline feature extractor without generative augmentation</td>
              </tr>
              <tr>
                <td className="font-semibold text-primary">Train (GAN-Augmented)</td>
                <td className="font-mono">616</td>
                <td className="font-mono text-violet">600 (120/class)</td>
                <td className="font-mono font-bold text-violet">1,216</td>
                <td className="text-secondary">Train identical CNN with synthetic distribution augmentation</td>
              </tr>
              <tr>
                <td className="font-semibold text-primary">Validation</td>
                <td className="font-mono">120</td>
                <td className="font-mono text-secondary">0</td>
                <td className="font-mono">120</td>
                <td className="text-secondary">Early stopping monitoring and learning rate scheduler adjustment</td>
              </tr>
              <tr>
                <td className="font-semibold text-primary">Held-Out Test</td>
                <td className="font-mono">120</td>
                <td className="font-mono text-secondary">0</td>
                <td className="font-mono font-bold text-emerald">120</td>
                <td className="text-secondary">Final unbiased evaluation: 24 frames per class across all 5 signs</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5 Classes Badge List */}
        <div className="lab2-classes-bar">
          <span className="text-xs uppercase tracking-wider font-semibold text-secondary">
            5 Evaluated Classes:
          </span>
          <div className="flex flex-wrap gap-2">
            {overview.classes.map((c, i) => (
              <span key={c} className="badge badge-brand">
                Class {i}: <strong>{c}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
