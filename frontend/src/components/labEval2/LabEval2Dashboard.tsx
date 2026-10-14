import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Clock, 
  ShieldAlert, 
  Image as ImageIcon,
  TrendingDown,
  Info,
  RefreshCw
} from 'lucide-react';
import type { LabEval2MetricsData, LabEval2PlotItem } from '../../types';
import { getLabEval2Metrics, getLabEval2Plots } from '../../services/labEval2Api';

export const LabEval2Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<LabEval2MetricsData | null>(null);
  const [plots, setPlots] = useState<LabEval2PlotItem[]>([]);
  const [activePlotTab, setActivePlotTab] = useState<'confusion' | 'training' | 'gan' | 'robustness' | 'qualitative'>('confusion');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [m, p] = await Promise.all([
          getLabEval2Metrics(),
          getLabEval2Plots()
        ]);
        setMetrics(m);
        setPlots(p.plots);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPlotByFilename = (filename: string): LabEval2PlotItem | undefined => {
    return plots.find((p) => p.filename === filename);
  };

  if (loading) {
    return (
      <div className="lab2-loading-box py-16">
        <RefreshCw size={28} className="animate-spin text-brand mb-3" />
        <span className="text-secondary text-sm">Loading experiment results and plots...</span>
      </div>
    );
  }

  return (
    <div className="lab2-dashboard-section">
      {/* Clean Test Evaluation Metrics Table */}
      <div className="lab2-card mb-6">
        <div className="lab2-card-header">
          <div className="flex items-center gap-2">
            <div className="lab2-spec-icon-wrap bg-cyan-subtle">
              <FileSpreadsheet size={18} className="text-cyan" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Clean Test Set Performance Metrics</h3>
              <span className="text-xs text-secondary">
                Evaluated on 120 held-out real test frames (24 frames per class across all 5 signs)
              </span>
            </div>
          </div>
          <span className="badge badge-brand">Authentic CSV Data</span>
        </div>

        <div className="lab2-table-wrapper mt-4">
          <table className="lab2-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Test Samples</th>
                <th>Correct / Total</th>
                <th>Accuracy (%)</th>
                <th>Balanced Acc (%)</th>
                <th>Macro Precision (%)</th>
                <th>Macro Recall (%)</th>
                <th>Macro F1 (%)</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.clean_test_metrics.map((row) => (
                <tr key={row.Model}>
                  <td className="font-semibold text-primary">{row.Model}</td>
                  <td className="font-mono">{row["Test images"]}</td>
                  <td className="font-mono text-amber font-semibold">{row["Correct / total"]}</td>
                  <td className="font-mono font-bold text-amber">{row["Accuracy (%)"].toFixed(1)}%</td>
                  <td className="font-mono">{row["Balanced accuracy (%)"].toFixed(1)}%</td>
                  <td className="font-mono">{row["Macro precision (%)"].toFixed(1)}%</td>
                  <td className="font-mono">{row["Macro recall (%)"].toFixed(1)}%</td>
                  <td className="font-mono font-semibold">{row["Macro F1 (%)"].toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Per-Class Classification Report Breakdown */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
            <Info size={14} className="text-brand" />
            <span>Per-Class Breakdown (Class Collapse Verification)</span>
          </h4>
          <div className="lab2-table-wrapper">
            <table className="lab2-table text-xs">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Test Support</th>
                  <th>Baseline Precision</th>
                  <th>Baseline Recall</th>
                  <th>Baseline F1</th>
                  <th>GAN Precision</th>
                  <th>GAN Recall</th>
                  <th>GAN F1</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.per_class_breakdown.map((row) => (
                  <tr key={row.class} className={row.class === 'small' ? 'bg-amber-subtle' : ''}>
                    <td className="font-bold uppercase text-primary">
                      {row.class} {row.class === 'small' && <span className="badge badge-amber ml-1">Collapsed Target</span>}
                    </td>
                    <td className="font-mono">{row.support}</td>
                    <td className="font-mono">{row.baseline_precision.toFixed(1)}%</td>
                    <td className="font-mono font-bold text-amber">{row.baseline_recall.toFixed(1)}%</td>
                    <td className="font-mono">{row.baseline_f1.toFixed(1)}%</td>
                    <td className="font-mono">{row.gan_precision.toFixed(1)}%</td>
                    <td className="font-mono font-bold text-amber">{row.gan_recall.toFixed(1)}%</td>
                    <td className="font-mono">{row.gan_f1.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Latency & Robustness Benchmarks Grid */}
      <div className="lab2-grid-2col mb-6">
        {/* Latency Metrics Card */}
        <div className="lab2-card">
          <div className="lab2-card-header">
            <div className="flex items-center gap-2">
              <div className="lab2-spec-icon-wrap bg-emerald-subtle">
                <Clock size={18} className="text-emerald" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Inference Latency Benchmark</h3>
                <span className="text-xs text-secondary">Batch size 32 across 10 evaluation runs</span>
              </div>
            </div>
          </div>

          <div className="lab2-table-wrapper mt-3">
            <table className="lab2-table text-xs">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Batch Latency (ms)</th>
                  <th>Per-Image Latency (ms)</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.latency_metrics.map((row) => (
                  <tr key={row.Model}>
                    <td className="font-semibold text-primary">{row.Model}</td>
                    <td className="font-mono">{row["Mean batch latency (ms)"].toFixed(2)} ± {row["Std batch latency (ms)"].toFixed(2)}</td>
                    <td className="font-mono text-emerald font-bold">{row["Mean latency per image (ms)"].toFixed(2)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-secondary mt-3">
            Note: Baseline CNN achieved slightly lower per-image inference latency (2.18 ms vs 3.28 ms) due to runtime cache locality.
          </p>
        </div>

        {/* Robustness Perturbation Card */}
        <div className="lab2-card">
          <div className="lab2-card-header">
            <div className="flex items-center gap-2">
              <div className="lab2-spec-icon-wrap bg-amber-subtle">
                <ShieldAlert size={18} className="text-amber" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Robustness Stress Testing</h3>
                <span className="text-xs text-secondary">
                  Accuracy under synthetic noise, blur, and lighting shifts
                </span>
              </div>
            </div>
          </div>

          <div className="lab2-table-wrapper mt-3">
            <table className="lab2-table text-xs">
              <thead>
                <tr>
                  <th>Perturbation Condition</th>
                  <th>Baseline CNN</th>
                  <th>GAN-Augmented CNN</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold text-primary">Clean Test Baseline</td>
                  <td className="font-mono font-bold text-amber">20.0%</td>
                  <td className="font-mono font-bold text-amber">20.0%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-primary">Brightness Reduced (0.6×)</td>
                  <td className="font-mono text-amber">20.0%</td>
                  <td className="font-mono text-amber">20.0%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-primary">Gaussian Noise (σ = 0.08)</td>
                  <td className="font-mono text-amber">20.0%</td>
                  <td className="font-mono text-amber">20.0%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-primary">Gaussian Blur (5×5 Kernel)</td>
                  <td className="font-mono text-amber">20.0%</td>
                  <td className="font-mono text-amber">20.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-secondary mt-3">
            Due to the complete invariant collapse onto class <code>small</code>, perturbation testing resulted in an identical 20.0% across all conditions.
          </p>
        </div>
      </div>

      {/* Authentic Notebook Plots & Visual Evidence */}
      <div className="lab2-card mb-6">
        <div className="lab2-card-header">
          <div className="flex items-center gap-2">
            <div className="lab2-spec-icon-wrap bg-violet-subtle">
              <ImageIcon size={18} className="text-violet" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Authentic Experimental Plots & Evidence</h3>
              <span className="text-xs text-secondary">
                Directly extracted from the Google Colab evaluation session
              </span>
            </div>
          </div>
        </div>

        {/* Plot Category Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 pb-3 border-b border-border">
          <button
            type="button"
            className={`btn-pill ${activePlotTab === 'confusion' ? 'active' : ''}`}
            onClick={() => setActivePlotTab('confusion')}
          >
            Confusion Matrices
          </button>
          <button
            type="button"
            className={`btn-pill ${activePlotTab === 'training' ? 'active' : ''}`}
            onClick={() => setActivePlotTab('training')}
          >
            Training Curves (Acc & Loss)
          </button>
          <button
            type="button"
            className={`btn-pill ${activePlotTab === 'gan' ? 'active' : ''}`}
            onClick={() => setActivePlotTab('gan')}
          >
            DCGAN Loss Curves
          </button>
          <button
            type="button"
            className={`btn-pill ${activePlotTab === 'robustness' ? 'active' : ''}`}
            onClick={() => setActivePlotTab('robustness')}
          >
            Robustness Comparison
          </button>
          <button
            type="button"
            className={`btn-pill ${activePlotTab === 'qualitative' ? 'active' : ''}`}
            onClick={() => setActivePlotTab('qualitative')}
          >
            Qualitative Predictions
          </button>
        </div>

        {/* Plot Display Area */}
        <div className="lab2-plot-display-area mt-4">
          {activePlotTab === 'confusion' && (
            <div className="lab2-grid-2col">
              <div className="lab2-plot-card">
                <h4 className="text-sm font-semibold text-primary mb-1">Baseline CNN Confusion Matrix</h4>
                <p className="text-xs text-secondary mb-3">All 120 predictions fall in column 0 (small).</p>
                {getPlotByFilename('baseline_cnn_confusion_matrix.png') ? (
                  <img
                    src={getPlotByFilename('baseline_cnn_confusion_matrix.png')?.url}
                    alt="Baseline CNN Confusion Matrix"
                    className="lab2-plot-img"
                  />
                ) : (
                  <div className="lab2-empty-img">Plot loading...</div>
                )}
              </div>

              <div className="lab2-plot-card">
                <h4 className="text-sm font-semibold text-primary mb-1">GAN-Augmented CNN Confusion Matrix</h4>
                <p className="text-xs text-secondary mb-3">Identical single-column collapse in column 0 (small).</p>
                {getPlotByFilename('gan_augmented_cnn_confusion_matrix.png') ? (
                  <img
                    src={getPlotByFilename('gan_augmented_cnn_confusion_matrix.png')?.url}
                    alt="GAN-Augmented CNN Confusion Matrix"
                    className="lab2-plot-img"
                  />
                ) : (
                  <div className="lab2-empty-img">Plot loading...</div>
                )}
              </div>
            </div>
          )}

          {activePlotTab === 'training' && (
            <div className="lab2-grid-2col">
              <div className="lab2-plot-card">
                <h4 className="text-sm font-semibold text-primary mb-1">Training & Validation Accuracy (30 Epochs)</h4>
                <p className="text-xs text-secondary mb-3">Early plateau at ~20% validation accuracy.</p>
                {getPlotByFilename('training_curves_accuracy.png') ? (
                  <img
                    src={getPlotByFilename('training_curves_accuracy.png')?.url}
                    alt="Training curves: accuracy"
                    className="lab2-plot-img"
                  />
                ) : (
                  <div className="lab2-empty-img">Plot loading...</div>
                )}
              </div>

              <div className="lab2-plot-card">
                <h4 className="text-sm font-semibold text-primary mb-1">Training & Validation Loss (30 Epochs)</h4>
                <p className="text-xs text-secondary mb-3">Validation loss plateauing around 1.61 (ln(5) = 1.609).</p>
                {getPlotByFilename('training_curves_loss.png') ? (
                  <img
                    src={getPlotByFilename('training_curves_loss.png')?.url}
                    alt="Training curves: loss"
                    className="lab2-plot-img"
                  />
                ) : (
                  <div className="lab2-empty-img">Plot loading...</div>
                )}
              </div>
            </div>
          )}

          {activePlotTab === 'gan' && (
            <div className="lab2-plot-card max-w-2xl mx-auto">
              <h4 className="text-sm font-semibold text-primary mb-1">Conditional DCGAN Loss Progression</h4>
              <p className="text-xs text-secondary mb-3">
                Discriminator loss vs Generator loss across 20 adversarial training epochs.
              </p>
              {getPlotByFilename('dcgan_training_loss.png') ? (
                <img
                  src={getPlotByFilename('dcgan_training_loss.png')?.url}
                  alt="DCGAN training loss"
                  className="lab2-plot-img"
                />
              ) : (
                <div className="lab2-empty-img">Plot loading...</div>
              )}
            </div>
          )}

          {activePlotTab === 'robustness' && (
            <div className="lab2-plot-card max-w-2xl mx-auto">
              <h4 className="text-sm font-semibold text-primary mb-1">Robustness Test Comparisons</h4>
              <p className="text-xs text-secondary mb-3">
                Model accuracy across perturbations (Clean, Brightness 0.6x, Noise sigma=0.08, Blur 5x5).
              </p>
              {getPlotByFilename('robustness_comparison.png') ? (
                <img
                  src={getPlotByFilename('robustness_comparison.png')?.url}
                  alt="Robustness comparison"
                  className="lab2-plot-img"
                />
              ) : (
                <div className="lab2-empty-img">Plot loading...</div>
              )}
            </div>
          )}

          {activePlotTab === 'qualitative' && (
            <div className="lab2-grid-2col">
              <div className="lab2-plot-card">
                <h4 className="text-sm font-semibold text-primary mb-1">Baseline CNN Sample Predictions</h4>
                <p className="text-xs text-secondary mb-3">Qualitative predictions with reported confidences.</p>
                {getPlotByFilename('baseline_cnn_predictions.png') ? (
                  <img
                    src={getPlotByFilename('baseline_cnn_predictions.png')?.url}
                    alt="Baseline CNN predictions"
                    className="lab2-plot-img"
                  />
                ) : (
                  <div className="lab2-empty-img">Plot loading...</div>
                )}
              </div>

              <div className="lab2-plot-card">
                <h4 className="text-sm font-semibold text-primary mb-1">GAN-Augmented CNN Sample Predictions</h4>
                <p className="text-xs text-secondary mb-3">Qualitative predictions with reported confidences.</p>
                {getPlotByFilename('gan_augmented_cnn_predictions.png') ? (
                  <img
                    src={getPlotByFilename('gan_augmented_cnn_predictions.png')?.url}
                    alt="GAN-augmented CNN predictions"
                    className="lab2-plot-img"
                  />
                ) : (
                  <div className="lab2-empty-img">Plot loading...</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Objective Academic Post-Mortem & Architecture Insights */}
      <div className="lab2-card">
        <div className="lab2-card-header">
          <div className="flex items-center gap-2">
            <div className="lab2-spec-icon-wrap bg-amber-subtle">
              <TrendingDown size={18} className="text-amber" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Scientific Discussion: Why GAN Augmentation Failed Here</h3>
              <span className="text-xs text-secondary">
                Rigorous diagnosis of the empirical representation bottleneck
              </span>
            </div>
          </div>
        </div>

        <div className="lab2-discussion-grid mt-4">
          <div className="lab2-discussion-box">
            <h4 className="text-sm font-semibold text-primary mb-1">1. Resolution & Hand Articulation Loss</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Sign language gestures fundamentally depend on minute spatial configurations: finger flexion, orientation, and contact points.
              Downsampling video frames to <strong>64×64 pixels</strong> strips high-frequency hand edge information. The DCGAN synthesized indistinct hand blobs, confusing the downstream classifier rather than reinforcing boundary margins.
            </p>
          </div>

          <div className="lab2-discussion-box">
            <h4 className="text-sm font-semibold text-primary mb-1">2. Loss Plateau at Entropy Equilibrium</h4>
            <p className="text-xs text-secondary leading-relaxed">
              For a 5-class balanced problem, a completely random guess yields a cross-entropy loss of <code>-ln(1/5) = 1.6094</code>.
              Both networks settled at validation loss values near 1.61, indicating the optimization gradient reached a flat minimum where predicting class <code>small</code> was minimally penalizing.
            </p>
          </div>

          <div className="lab2-discussion-box">
            <h4 className="text-sm font-semibold text-primary mb-1">3. Lack of Pretrained Visual Priors</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Training a 3-block convolutional network from scratch on only 616 frames causes severe overfitting or collapse.
              In contrast, SignBridge's primary 76-class engine achieves <strong>67.78% accuracy</strong> by leveraging <strong>MobileNetV2 ImageNet pretrained weights</strong> at 224×224 resolution, proving that deep transfer learning far outperforms scratch GAN augmentation in small-sample regimes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
