import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  BarChart2, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Table, 
  Cpu, 
  ArrowRight,
  Database,
  RefreshCw,
  Wand2,
  Clock,
  Maximize2,
  X,
  HelpCircle,
  Video,
  Film,
  Play,
  Download,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import {
  fetchCnnLstmMetadata,
  predictCnnLstmVideo,
  generateCnnLstmImage
} from '../../services/labEval2Api';
import type {
  GanCnnLstmMetadataResponse,
  CnnLstmVideoPredictResponse,
  LabEval2GenerateResponse
} from '../../services/labEval2Api';
import { CNN_LSTM_DEMO_FIXTURE } from '../../data/cnnLstmDemoFixture';

interface GanCnnLstmPageProps {
  onNavigateToTab?: (tab: 'gan-cnn' | 'gan-cnn-lstm' | 'gan-mobilenetv2') => void;
}

export const GanCnnLstmPage: React.FC<GanCnnLstmPageProps> = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'training' | 'samples' | 'results' | 'findings' | 'prediction' | 'comparison'>('overview');
  const [metadata, setMetadata] = useState<GanCnnLstmMetadataResponse | null>(null);

  // Optional Presentation Demonstration Mode (Defaults to Real Evaluation State)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Live Generator State (Section C)
  const [selectedClassForGen, setSelectedClassForGen] = useState<string>('ABOUT');
  const [generatorSeed, setGeneratorSeed] = useState<number>(42);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<LabEval2GenerateResponse | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Interactive Video Sequence Testing State (Section F)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictResult, setPredictResult] = useState<CnnLstmVideoPredictResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Plot Lightbox State
  const [lightboxPlot, setLightboxPlot] = useState<{ src: string; title: string; desc: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadMetadata = async () => {
      try {
        const data = await fetchCnnLstmMetadata();
        if (mounted) {
          setMetadata(data);
          if (data.overview?.classes && data.overview.classes.length > 0) {
            setSelectedClassForGen(data.overview.classes[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load CNN-LSTM metadata:', err);
      }
    };
    loadMetadata();
    return () => { mounted = false; };
  }, []);

  // Handle ESC key for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxPlot(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedVideoFile(file);
      setPredictError(null);
      setPredictResult(null);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    }
  };

  const handleLoadSampleVideo = async () => {
    try {
      setPredictError(null);
      const res = await fetch('/samples/isl_sample_video.mp4');
      if (!res.ok) throw new Error('Sample video not found in /samples/isl_sample_video.mp4');
      const blob = await res.blob();
      const file = new File([blob], 'isl_sample_video.mp4', { type: 'video/mp4' });
      setSelectedVideoFile(file);
      setPredictResult(null);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    } catch (err: any) {
      setPredictError(err.message || 'Could not load sample video');
    }
  };

  const handleRunSequenceInference = async () => {
    if (!selectedVideoFile) return;
    setIsPredicting(true);
    setPredictError(null);
    try {
      const res = await predictCnnLstmVideo(selectedVideoFile);
      setPredictResult(res);
    } catch (err: any) {
      setPredictError(err.message || 'Sequence inference failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleGenerateSample = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await generateCnnLstmImage(selectedClassForGen, generatorSeed);
      setGeneratedResult(res);
    } catch (err: any) {
      setGenError(err.message || 'Synthesis failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadInferenceJson = () => {
    if (!predictResult) return;
    const exportPayload = {
      ...predictResult,
      evaluation_mode: isDemoMode ? 'DEMO_MODE_ILLUSTRATIVE_DATA_ONLY' : 'REAL_VERIFIED_EMPIRICAL_STATE',
      disclaimer: isDemoMode ? CNN_LSTM_DEMO_FIXTURE.disclaimerText : 'Verified Ground Truth Evaluation Data'
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cnn_lstm_inference_${isDemoMode ? 'demo_' : 'real_'}${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEvaluationReport = () => {
    const reportPayload = {
      project: 'SignBridge Lab Evaluation 2 — Spatio-Temporal CNN-LSTM & DCGAN',
      timestamp: new Date().toISOString(),
      evaluation_mode: isDemoMode ? 'DEMO_MODE_ILLUSTRATIVE_DATA_ONLY' : 'REAL_VERIFIED_EMPIRICAL_STATE',
      disclaimer: isDemoMode 
        ? CNN_LSTM_DEMO_FIXTURE.disclaimerText 
        : 'All baseline metrics are verified ground truth values from cnn_lstm_baseline_summary.json. The GAN-augmented model is pending sequence checkpoint delivery.',
      vocabulary_classes: 76,
      test_videos_evaluated: 180,
      sequence_length_frames: 33,
      baseline_cnn_lstm: {
        checkpoint: 'signbridge_cnn_lstm_best.keras',
        status: 'Verified Checkpoint',
        clean_test_accuracy_top1: '4.44%',
        clean_test_accuracy_top3: '12.78%',
        macro_f1: 0.0100,
        weighted_f1: 0.0097,
        cross_entropy_loss: 4.218,
        mean_latency_ms: 45.6,
        train_samples: 4030,
        noise_robustness: CNN_LSTM_DEMO_FIXTURE.baseline.noiseRobustness
      },
      gan_augmented_cnn_lstm: isDemoMode ? {
        checkpoint: 'gan_cnn_lstm_augmented.keras (Hypothetical)',
        status: 'ILLUSTRATIVE DEMO PROJECTION (NOT EMPIRICAL)',
        clean_test_accuracy_top1: CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.accuracyDisplay,
        clean_test_accuracy_top3: CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.top3Display,
        macro_f1: CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.macroF1,
        weighted_f1: CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.weightedF1,
        cross_entropy_loss: CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.crossEntropyLoss,
        mean_latency_ms: CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.latencyMs,
        train_samples: CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.trainingSampleCount,
        noise_robustness: CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.noiseRobustness
      } : {
        checkpoint: 'gan_cnn_lstm_augmented.keras (Pending)',
        status: 'Pending evaluation / Awaiting sequence checkpoint',
        clean_test_accuracy_top1: 'Pending evaluation',
        clean_test_accuracy_top3: 'Pending evaluation',
        macro_f1: 'Not measured',
        weighted_f1: 'Not measured',
        cross_entropy_loss: 'Not measured',
        mean_latency_ms: 'Not measured',
        train_samples: 'Awaiting VideoGAN Trajectory Synthesis',
        noise_robustness: 'Pending evaluation'
      },
      scientific_integrity_guarantee: {
        zero_metric_fabrication: true,
        reason: '2D DCGAN generates isolated 64x64 images without temporal motion continuity. CNN-LSTM requires 33 continuous 112x112 frames.'
      }
    };

    const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cnn_lstm_eval_report_${isDemoMode ? 'demo_' : 'real_'}${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="lab2-model-page">
      {/* Lightbox Modal */}
      {lightboxPlot && (
        <div 
          className="lab2-lightbox-backdrop"
          onClick={() => setLightboxPlot(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lab2-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lab2-lightbox-header">
              <div>
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <ImageIcon size={18} className="text-brand" />
                  <span>{lightboxPlot.title}</span>
                </h3>
                <p className="text-xs text-secondary mt-0.5">{lightboxPlot.desc}</p>
              </div>
              <button 
                type="button" 
                className="lab2-lightbox-close-btn"
                onClick={() => setLightboxPlot(null)}
                aria-label="Close zoomed view"
              >
                <X size={20} />
              </button>
            </div>
            <div className="lab2-lightbox-img-wrap">
              <img src={lightboxPlot.src} alt={lightboxPlot.title} className="lab2-lightbox-img" />
            </div>
            <div className="lab2-lightbox-footer">
              <span className="text-xs text-secondary">Experimental artifact from teammate notebook • Press ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Internal Section Navigation Tabs */}
      <div className="lab2-section-nav-wrap">
        <nav className="lab2-section-nav" role="tablist" aria-label="GAN + CNN-LSTM Experiment Navigation">
          <button
            type="button"
            className={`lab2-section-nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
            role="tab"
            aria-selected={activeSection === 'overview'}
          >
            <Cpu size={15} />
            <span>A. Architecture & Overview</span>
          </button>

          <button
            type="button"
            className={`lab2-section-nav-btn ${activeSection === 'training' ? 'active' : ''}`}
            onClick={() => setActiveSection('training')}
            role="tab"
            aria-selected={activeSection === 'training'}
          >
            <Database size={15} />
            <span>B. Dataset & Training</span>
          </button>

          <button
            type="button"
            className={`lab2-section-nav-btn ${activeSection === 'samples' ? 'active' : ''}`}
            onClick={() => setActiveSection('samples')}
            role="tab"
            aria-selected={activeSection === 'samples'}
          >
            <ImageIcon size={15} />
            <span>C. Generated Samples</span>
          </button>

          <button
            type="button"
            className={`lab2-section-nav-btn ${activeSection === 'results' ? 'active' : ''}`}
            onClick={() => setActiveSection('results')}
            role="tab"
            aria-selected={activeSection === 'results'}
          >
            <BarChart2 size={15} />
            <span>D. Evaluation Results</span>
          </button>

          <button
            type="button"
            className={`lab2-section-nav-btn ${activeSection === 'findings' ? 'active' : ''}`}
            onClick={() => setActiveSection('findings')}
            role="tab"
            aria-selected={activeSection === 'findings'}
          >
            <HelpCircle size={15} />
            <span>E. Scientific Findings</span>
          </button>

          <button
            type="button"
            className={`lab2-section-nav-btn ${activeSection === 'prediction' ? 'active' : ''}`}
            onClick={() => setActiveSection('prediction')}
            role="tab"
            aria-selected={activeSection === 'prediction'}
          >
            <Upload size={15} />
            <span>F. Interactive Video Testing</span>
          </button>

          <button
            type="button"
            className={`lab2-section-nav-btn ${activeSection === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveSection('comparison')}
            role="tab"
            aria-selected={activeSection === 'comparison'}
          >
            <Table size={15} />
            <span>G. Tri-Model Comparison</span>
          </button>
        </nav>
      </div>

      {/* SECTION A: Architecture & Overview */}
      {activeSection === 'overview' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-a">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-a" className="lab2-section-title">
                <Cpu size={20} className="text-brand" />
                <span>Section A: Spatio-Temporal CNN-LSTM & DCGAN Architecture</span>
              </h2>
              <p className="lab2-section-subtitle">
                TimeDistributed 2D convolutional spatial feature extraction coupled with recurrent LSTM sequence integration, 
                alongside class-conditional DCGAN generation.
              </p>
            </div>
            <span className="badge badge-amber text-xs">
              <CheckCircle2 size={12} /> Baseline & Generator Verified • Aug Pending
            </span>
          </div>

          {/* Quick Parameters Summary Grid */}
          <div className="lab2-spec-cards-grid mb-6">
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Sequence Input Shape</span>
              <span className="lab2-spec-card-value font-mono">33 × 112 × 112 × 3</span>
              <span className="lab2-spec-card-hint">RGB Video Temporal Reel</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Sequence Normalization</span>
              <span className="lab2-spec-card-value font-mono">[0.0, 1.0]</span>
              <span className="lab2-spec-card-hint">frame / 255.0</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Temporal Backbone</span>
              <span className="lab2-spec-card-value font-mono">TimeDist(Conv2D) + LSTM</span>
              <span className="lab2-spec-card-hint">Recurrent State Tracking</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">DCGAN Output Shape</span>
              <span className="lab2-spec-card-value font-mono">64 × 64 × 3</span>
              <span className="lab2-spec-card-hint">Static 2D Spatial Frame</span>
            </div>
          </div>

          {/* 3 Architecture Cards */}
          <div className="lab2-card-grid mb-6">
            {/* Card 1: Baseline CNN-LSTM */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div className="lab2-mini-icon-badge brand">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="lab2-card-title">1. Baseline CNN-LSTM Classifier</h3>
                  <span className="badge badge-success text-[10px] mt-0.5">Loaded & Verified Checkpoint</span>
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Pretrained spatio-temporal neural network evaluated on real ISL video sequences. Extracts per-frame spatial features 
                via TimeDistributed 2D CNN layers, which are fed into recurrent LSTM units to encode motion velocity.
              </p>
              <div className="space-y-1.5 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Checkpoint:</span>
                  <span className="font-mono text-primary font-medium">signbridge_cnn_lstm_best.keras</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Input Tensor:</span>
                  <span className="font-mono text-primary font-medium">(1, 33, 112, 112, 3)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Recurrent Units:</span>
                  <span className="font-mono text-primary font-medium">128 LSTM Units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Held-Out Test Acc:</span>
                  <span className="font-mono text-accent-emerald font-semibold">4.44% (180 videos)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Conditional DCGAN Generator */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div className="lab2-mini-icon-badge violet">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="lab2-card-title">2. Conditional DCGAN Generator</h3>
                  <span className="badge badge-brand text-[10px] mt-0.5">Loaded & Verified Checkpoint</span>
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Class-conditioned generative adversarial network trained by teammate for 50 epochs. Accepts a 100-dimensional 
                latent noise vector and a class ID (0–75) to synthesize static 64×64 sign gesture representations.
              </p>
              <div className="space-y-1.5 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Checkpoint:</span>
                  <span className="font-mono text-primary font-medium">conditional_generator.keras</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Latent Input:</span>
                  <span className="font-mono text-primary font-medium">z ~ N(0,1) ∈ R^100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Output Resolution:</span>
                  <span className="font-mono text-primary font-medium">64 × 64 × 3 (RGB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">File Size:</span>
                  <span className="font-mono text-primary font-medium">16.1 MB</span>
                </div>
              </div>
            </div>

            {/* Card 3: Augmented CNN-LSTM Status */}
            <div className="lab2-card border-amber-subtle">
              <div className="lab2-card-header">
                <div className="lab2-mini-icon-badge amber">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="lab2-card-title">3. GAN-Augmented CNN-LSTM</h3>
                  <span className="badge badge-amber text-[10px] mt-0.5">Pending Checkpoint</span>
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Target architecture intended to evaluate whether synthetic generative sequences improve spatio-temporal sign recognition. 
                Zero fabricated metrics are reported; awaiting teammate sequence-level trained weights.
              </p>
              <div className="space-y-1.5 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Status:</span>
                  <span className="badge badge-amber text-[10px]">Awaiting Classifier Checkpoint</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Theoretical Gap:</span>
                  <span className="font-mono text-accent-amber font-medium">2D Frame vs 3D Sequence</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Augmented Acc:</span>
                  <span className="font-mono text-tertiary">N/A (Unmeasured)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Integrity Policy:</span>
                  <span className="font-mono text-primary font-medium">Zero Metric Fabrication</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theoretical Divergence Notice */}
          <div className="lab2-card bg-amber-subtle-alpha border-amber mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber shrink-0 mt-0.5" size={18} />
              <div className="text-xs space-y-1">
                <div className="font-bold text-primary">Dimensional & Modality Mismatch in the Experiment</div>
                <p className="text-secondary leading-relaxed">
                  The teammate's DCGAN produces independent <strong>64×64 static frames</strong>, whereas the CNN-LSTM sequence model 
                  requires <strong>33 temporally continuous 112×112 frames</strong>. Because the generator does not model inter-frame motion or 
                  temporal trajectory dynamics, simply feeding randomized synthetic 2D frames into an LSTM destroys recurrent hidden-state coherence. 
                  A true sequence-augmented classifier requires a video-level generator (such as MoCoGAN) or keyframe trajectory interpolation.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION B: Dataset & Training */}
      {activeSection === 'training' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-b">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-b" className="lab2-section-title">
                <Database size={20} className="text-brand" />
                <span>Section B: Dataset & Training Configuration</span>
              </h2>
              <p className="lab2-section-subtitle">
                Analysis of training data partitions, 76-class vocabulary representation, and hyperparameter specifications.
              </p>
            </div>
          </div>

          <div className="lab2-spec-cards-grid mb-6">
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">ISL Word Classes</span>
              <span className="lab2-spec-card-value font-mono">76</span>
              <span className="lab2-spec-card-hint">Vocabulary Size</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">DCGAN Training Frames</span>
              <span className="lab2-spec-card-value font-mono">4,030</span>
              <span className="lab2-spec-card-hint">Mean ~53 frames / class</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Sequence Evaluation Set</span>
              <span className="lab2-spec-card-value font-mono">180</span>
              <span className="lab2-spec-card-hint">Real Video Sequences</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Sequence Frame Count</span>
              <span className="lab2-spec-card-value font-mono">33</span>
              <span className="lab2-spec-card-hint">Uniformly Sampled</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="lab2-card">
              <h3 className="lab2-card-title mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-violet" />
                <span>DCGAN Training Hyperparameters</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="lab2-table text-xs">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-primary">Optimizer</td>
                      <td className="font-mono text-secondary">Adam (lr=0.0002, β1=0.5, β2=0.999)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Latent Dimension</td>
                      <td className="font-mono text-secondary">100 dimensions (Gaussian noise)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Batch Size</td>
                      <td className="font-mono text-secondary">64 samples</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Loss Function</td>
                      <td className="font-mono text-secondary">Binary Cross-Entropy with One-Sided Label Smoothing</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Saved Epochs</td>
                      <td className="font-mono text-secondary">50 epochs (checkpointed at epoch 50)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Output Range</td>
                      <td className="font-mono text-secondary">[-1.0, 1.0] (tanh activation)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lab2-card">
              <h3 className="lab2-card-title mb-3 flex items-center gap-2">
                <Layers size={16} className="text-brand" />
                <span>CNN-LSTM Baseline Hyperparameters</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="lab2-table text-xs">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-primary">Sequence Length</td>
                      <td className="font-mono text-secondary">33 frames (linspace temporal sampling)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Frame Resolution</td>
                      <td className="font-mono text-secondary">112 × 112 × 3 RGB</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Input Normalization</td>
                      <td className="font-mono text-secondary">[0.0, 1.0] (pixel / 255.0)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Spatial Layers</td>
                      <td className="font-mono text-secondary">TimeDistributed Conv2D + MaxPool + BatchNorm</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Recurrent Head</td>
                      <td className="font-mono text-secondary">LSTM (128 units) + Dropout(0.5)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Output Layer</td>
                      <td className="font-mono text-secondary">Dense(76, activation='softmax')</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION C: Generated Samples & Interactive DCGAN Synthesis */}
      {activeSection === 'samples' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-c">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-c" className="lab2-section-title">
                <ImageIcon size={20} className="text-brand" />
                <span>Section C: DCGAN Generated Samples & Live Synthesis</span>
              </h2>
              <p className="lab2-section-subtitle">
                Visual inspection of 64×64 synthetic sign frames produced by the teammate's conditional DCGAN generator.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Artifact Plot Card */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div>
                  <h3 className="lab2-card-title">Training Checkpoint Sample Grid (Epoch 50)</h3>
                  <p className="text-xs text-secondary mt-0.5">Saved output from the teammate's training log</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary text-xs p-1.5"
                  onClick={() => setLightboxPlot({
                    src: '/plots/lab_eval2/gan_cnn_lstm/conditional_gan_epoch_050.png',
                    title: 'Conditional DCGAN Epoch 50 Generated Grid',
                    desc: '8x8 grid of class-conditioned 64x64 synthetic sign images synthesized across vocabulary classes.'
                  })}
                  aria-label="Zoom image"
                >
                  <Maximize2 size={14} />
                </button>
              </div>

              <div 
                className="lab2-plot-card-img-wrap cursor-pointer"
                onClick={() => setLightboxPlot({
                  src: '/plots/lab_eval2/gan_cnn_lstm/conditional_gan_epoch_050.png',
                  title: 'Conditional DCGAN Epoch 50 Generated Grid',
                  desc: '8x8 grid of class-conditioned 64x64 synthetic sign images synthesized across vocabulary classes.'
                })}
              >
                <img 
                  src="/plots/lab_eval2/gan_cnn_lstm/conditional_gan_epoch_050.png" 
                  alt="Conditional DCGAN Epoch 50" 
                  className="w-full rounded border border-subtle object-contain bg-black max-h-72" 
                />
              </div>

              <div className="text-xs text-secondary leading-relaxed mt-3 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <Info size={13} className="text-brand" />
                  <span>Visual Quality Assessment:</span>
                </div>
                <p>
                  At 50 epochs, the DCGAN captures coarse torso and arm silhouettes with distinct skin-tone clusters, but 
                  lacks high-frequency hand anatomy and finger orientation. The 64×64 resolution limits fine semantic details.
                </p>
              </div>
            </div>

            {/* Live Interactive DCGAN Generator */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div>
                  <h3 className="lab2-card-title flex items-center gap-2">
                    <Wand2 size={16} className="text-violet" />
                    <span>Live Class-Conditional DCGAN Generator</span>
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">Sample directly from `conditional_generator.keras`</p>
                </div>
                <span className="badge badge-brand text-[10px]">Real-Time Inference</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-secondary block mb-1">Target Sign Class</label>
                    <select
                      className="input input-sm w-full text-xs"
                      value={selectedClassForGen}
                      onChange={(e) => setSelectedClassForGen(e.target.value)}
                    >
                      {metadata?.overview?.classes && metadata.overview.classes.length > 0 ? (
                        metadata.overview.classes.map((cls: string, idx: number) => (
                          <option key={cls} value={cls}>
                            {idx}: {cls}
                          </option>
                        ))
                      ) : (
                        <option value="ABOUT">0: ABOUT</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary block mb-1">Latent Seed (z)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="input input-sm w-full font-mono text-xs"
                        value={generatorSeed}
                        onChange={(e) => setGeneratorSeed(parseInt(e.target.value) || 0)}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary text-xs px-2.5"
                        onClick={() => setGeneratorSeed(Math.floor(Math.random() * 10000))}
                        title="Randomize seed"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary w-full text-xs font-semibold flex items-center justify-center gap-2"
                  onClick={handleGenerateSample}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Synthesizing from Latent Space...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Synthesize 64×64 Sign Image</span>
                    </>
                  )}
                </button>

                {genError && (
                  <div className="text-xs text-accent-red flex items-center gap-1.5 bg-red-subtle-alpha p-2 rounded">
                    <AlertCircle size={14} />
                    <span>{genError}</span>
                  </div>
                )}

                <div className="lab2-generator-preview-box">
                  {generatedResult ? (
                    <div className="flex flex-col items-center gap-3">
                      <img 
                        src={generatedResult.image_data_url} 
                        alt="Generated Sign" 
                        className="lab2-generator-canvas-img"
                      />
                      <div className="flex items-center gap-3 text-xs flex-wrap justify-center">
                        <span className="badge badge-brand text-[11px] font-mono">
                          Class: {generatedResult.class_name} ({generatedResult.class_index})
                        </span>
                        {generatedResult.seed !== undefined && (
                          <span className="badge badge-neutral text-[11px] font-mono">
                            Seed: {generatedResult.seed}
                          </span>
                        )}
                        <span className="badge badge-neutral text-[11px] font-mono">
                          {generatedResult.latency_ms.toFixed(1)} ms
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-tertiary text-xs space-y-1">
                      <Sparkles size={24} className="mx-auto text-secondary mb-1 opacity-50" />
                      <p>Select a class and click "Synthesize 64×64 Sign Image".</p>
                      <p className="text-[11px] opacity-75">Uses the live PyTorch/Keras checkpoint on the backend.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION D: Evaluation Results */}
      {activeSection === 'results' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-d">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-d" className="lab2-section-title">
                <BarChart2 size={20} className="text-brand" />
                <span>Section D: Quantitative Sequence-Level Evaluation</span>
              </h2>
              <p className="lab2-section-subtitle">
                Comprehensive evaluation across 180 held-out Indian Sign Language video sequences.
              </p>
            </div>

            {/* Optional UI Demonstration Mode Toggle */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-secondary font-semibold">Evaluation Mode:</span>
              <div className="flex p-0.5 bg-tertiary rounded-lg border border-subtle">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    !isDemoMode 
                      ? 'bg-brand-500 text-white shadow-sm' 
                      : 'text-secondary hover:text-primary'
                  }`}
                  onClick={() => setIsDemoMode(false)}
                >
                  <CheckCircle2 size={13} />
                  <span>Real Evaluation (Default)</span>
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isDemoMode 
                      ? 'bg-amber-600 text-white shadow-sm' 
                      : 'text-secondary hover:text-primary'
                  }`}
                  onClick={() => setIsDemoMode(true)}
                  title="Toggle illustrative demo figures for UI presentation preview"
                >
                  <Sparkles size={13} />
                  <span>DEMO — Illustrative Only</span>
                </button>
              </div>
            </div>
          </div>

          {/* Persistent Disclaimer Banner when Demo Mode is Active */}
          {isDemoMode && (
            <div className="p-4 bg-amber-subtle-alpha border-2 border-amber rounded-lg flex items-start gap-3 shadow-sm animate-fade-in">
              <AlertTriangle size={20} className="text-amber shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <span>DEMO MODE ACTIVE — ILLUSTRATIVE DATA ONLY</span>
                  <span className="badge badge-amber text-[10px]">Non-Empirical Preview</span>
                </div>
                <p className="text-secondary leading-relaxed">
                  {CNN_LSTM_DEMO_FIXTURE.disclaimerText}
                </p>
                <p className="text-tertiary text-[11px] font-mono">
                  * Baseline metrics below reflect actual measured ground truth. Augmented figures are hypothetical mock projections.
                </p>
              </div>
            </div>
          )}

          {/* Core Metric Spec Cards Banner */}
          <div className="lab2-spec-cards-grid">
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Baseline CNN-LSTM Accuracy</span>
              <span className="lab2-spec-card-value font-mono text-accent-emerald">4.44%</span>
              <span className="lab2-spec-card-hint">8 / 180 Sequences Correct</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Random Guess (76 Classes)</span>
              <span className="lab2-spec-card-value font-mono text-tertiary">1.32%</span>
              <span className="lab2-spec-card-hint">1 / 76 Probability</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Baseline Top-3 Accuracy</span>
              <span className="lab2-spec-card-value font-mono text-accent-cyan">12.78%</span>
              <span className="lab2-spec-card-hint">23 / 180 Sequences in Top-3</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">GAN-Augmented CNN-LSTM</span>
              <span className="lab2-spec-card-value font-mono text-amber">
                {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.accuracyDisplay : 'Pending'}
              </span>
              <span className="lab2-spec-card-hint">
                {isDemoMode ? 'Simulated Mock Projection' : 'Checkpoint Not Trained'}
              </span>
            </div>
          </div>

          {/* 1. SEPARATE MODEL CARDS: Baseline vs GAN-Augmented */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Baseline CNN-LSTM */}
            <div className="lab2-card border-subtle">
              <div className="lab2-card-header">
                <div className="flex items-center gap-3">
                  <div className="lab2-mini-icon-badge brand">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="lab2-card-title">1. Baseline CNN-LSTM Model</h3>
                    <span className="badge badge-success text-[10px] mt-0.5">Verified Ground Truth Checkpoint</span>
                  </div>
                </div>
                <span className="badge badge-success text-xs font-mono font-bold">
                  4.44% Test Acc
                </span>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-4">
                Spatio-temporal sequence model trained strictly on authentic video frames. Features 4 TimeDistributed 
                Conv2D blocks, 128 recurrent LSTM units, and softmax head across 76 ISL word classes.
              </p>
              <div className="space-y-2 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Model Weights:</span>
                  <span className="font-mono text-primary font-medium">signbridge_cnn_lstm_best.keras (1.59 MB)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Evaluation Set:</span>
                  <span className="font-mono text-primary font-medium">180 Real Held-Out Test Videos</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Top-1 Accuracy:</span>
                  <span className="font-mono text-accent-emerald font-bold">4.44% (8 / 180)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Top-3 Accuracy:</span>
                  <span className="font-mono text-primary font-bold">12.78% (23 / 180)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Macro F1-Score:</span>
                  <span className="font-mono text-primary font-medium">0.0100 (1.00%)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Weighted F1-Score:</span>
                  <span className="font-mono text-primary font-medium">0.0097 (0.97%)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Inference Latency:</span>
                  <span className="font-mono text-primary font-medium">~45.6 ms / sequence (21.9 clips/s)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Training Configuration:</span>
                  <span className="font-mono text-primary font-medium">4,030 real frames (33 frames/clip)</span>
                </div>
              </div>
            </div>

            {/* Card: GAN-Augmented CNN-LSTM */}
            <div className="lab2-card border-amber-subtle">
              <div className="lab2-card-header">
                <div className="flex items-center gap-3">
                  <div className="lab2-mini-icon-badge amber">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="lab2-card-title">2. GAN-Augmented CNN-LSTM</h3>
                    <span className="badge badge-amber text-[10px] mt-0.5">
                      {isDemoMode ? 'Illustrative Preview [DEMO]' : 'Pending Checkpoint'}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-amber px-2 py-1 rounded bg-amber-subtle-alpha">
                  {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.accuracyDisplay : 'Pending Evaluation'}
                </span>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-4">
                Target architecture intended to evaluate generative sequence trajectory augmentation. 
                {isDemoMode ? (
                  <span className="text-amber-700 dark:text-amber-300 font-semibold block mt-1">
                    * Displaying illustrative mock figures for UI demonstration. Not empirically trained.
                  </span>
                ) : (
                  <span className="text-secondary block mt-1">
                    * The teammate package includes a 2D DCGAN generator for static frames, but no trained sequence-augmented classifier weights.
                  </span>
                )}
              </p>
              <div className="space-y-2 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Model Weights:</span>
                  <span className="font-mono text-primary font-medium">
                    {isDemoMode ? 'gan_cnn_lstm_augmented.keras [DEMO]' : 'Awaiting Checkpoint Delivery'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Evaluation Set:</span>
                  <span className="font-mono text-primary font-medium">
                    {isDemoMode ? '180 Test Videos [DEMO Preview]' : '180 Videos (Pending Model Run)'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Top-1 Accuracy:</span>
                  <span className="font-mono text-amber font-bold">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.accuracyDisplay : 'Pending evaluation'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Top-3 Accuracy:</span>
                  <span className="font-mono text-amber font-bold">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.top3Display : 'Pending evaluation'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Macro F1-Score:</span>
                  <span className="font-mono text-primary font-medium">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.macroF1Display : 'Not measured'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Weighted F1-Score:</span>
                  <span className="font-mono text-primary font-medium">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.weightedF1Display : 'Not measured'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Inference Latency:</span>
                  <span className="font-mono text-primary font-medium">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.latencyDisplay : 'Not measured'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-tertiary">Training Configuration:</span>
                  <span className="font-mono text-primary font-medium">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.trainingSampleCount : 'Awaiting Video Trajectory Pipeline'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. DEDICATED INDIVIDUAL METRIC CARDS (6 Grid Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card A: Accuracy Breakdown */}
            <div className="lab2-card">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                <BarChart2 size={16} className="text-accent-emerald" />
                <span>Accuracy Benchmark</span>
              </h4>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Top-1 and Top-3 accuracy on 180 video sequences across 76 classes.
              </p>
              <div className="space-y-2 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Baseline Top-1:</span>
                  <span className="font-mono text-accent-emerald font-bold">4.44% (8/180)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Baseline Top-3:</span>
                  <span className="font-mono text-primary font-semibold">12.78% (23/180)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">GAN-Augmented:</span>
                  <span className="font-mono text-amber font-semibold">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.accuracyDisplay : 'Pending evaluation'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Theoretical Floor:</span>
                  <span className="font-mono text-secondary">1.32% (1/76 random)</span>
                </div>
              </div>
            </div>

            {/* Card B: Macro F1-Score */}
            <div className="lab2-card">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                <Table size={16} className="text-brand" />
                <span>Macro F1-Score</span>
              </h4>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Unweighted arithmetic mean of F1 scores across all 76 gesture categories.
              </p>
              <div className="space-y-2 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Baseline Macro F1:</span>
                  <span className="font-mono text-primary font-bold">0.0100 (1.00%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">GAN-Augmented:</span>
                  <span className="font-mono text-amber font-semibold">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.macroF1Display : 'Not measured'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Classes Represented:</span>
                  <span className="font-mono text-secondary">76 discrete words</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Sparsity Impact:</span>
                  <span className="font-mono text-secondary">High (zero-support signs)</span>
                </div>
              </div>
            </div>

            {/* Card C: Weighted F1-Score */}
            <div className="lab2-card">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent-cyan" />
                <span>Weighted F1-Score</span>
              </h4>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Class F1 scores weighted by the number of true instances in the test set.
              </p>
              <div className="space-y-2 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Baseline Weighted F1:</span>
                  <span className="font-mono text-primary font-bold">0.0097 (0.97%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">GAN-Augmented:</span>
                  <span className="font-mono text-amber font-semibold">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.weightedF1Display : 'Not measured'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Test Sequences:</span>
                  <span className="font-mono text-secondary">180 video clips</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Data Integrity:</span>
                  <span className="font-mono text-accent-emerald">Verified from CSV logs</span>
                </div>
              </div>
            </div>

            {/* Card D: Inference Latency */}
            <div className="lab2-card">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                <Clock size={16} className="text-violet" />
                <span>Inference Latency</span>
              </h4>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                End-to-end forward pass speed for a 33-frame spatio-temporal video sequence.
              </p>
              <div className="space-y-2 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Baseline Latency:</span>
                  <span className="font-mono text-primary font-bold">~45.6 ms / clip</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Sequence Throughput:</span>
                  <span className="font-mono text-primary font-semibold">~21.9 clips / sec</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">GAN-Augmented:</span>
                  <span className="font-mono text-amber font-semibold">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.latencyDisplay : 'Not measured'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Frame Sampling:</span>
                  <span className="font-mono text-secondary">33 uniform frames</span>
                </div>
              </div>
            </div>

            {/* Card E: Noise Robustness */}
            <div className="lab2-card">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber" />
                <span>Noise Robustness</span>
              </h4>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Sensitivity to Gaussian perturbation σ ∈ [0.0, 0.20] across temporal sequence.
              </p>
              <div className="space-y-2 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Clean (σ=0.0):</span>
                  <span className="font-mono text-accent-emerald font-bold">4.44%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Light (σ=0.05):</span>
                  <span className="font-mono text-primary font-medium">3.89% (-0.55%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Moderate (σ=0.10):</span>
                  <span className="font-mono text-primary font-medium">2.78% (-1.66%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Severe (σ=0.20):</span>
                  <span className="font-mono text-accent-red font-medium">1.67% (-2.77%)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-subtle">
                  <span className="text-tertiary">GAN-Augmented:</span>
                  <span className="font-mono text-amber font-semibold">
                    {isDemoMode ? 'Degrades 4.12% → 1.55% [DEMO]' : 'Pending evaluation'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card F: Training Configuration & Counts */}
            <div className="lab2-card">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                <Database size={16} className="text-brand" />
                <span>Configuration & Counts</span>
              </h4>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Dataset partitions, tensor dimensions, and network parameters.
              </p>
              <div className="space-y-2 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Sequence Shape:</span>
                  <span className="font-mono text-primary font-medium">33 × 112 × 112 × 3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Trainable Parameters:</span>
                  <span className="font-mono text-primary font-medium">128,012 weights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Real Training Samples:</span>
                  <span className="font-mono text-primary font-medium">4,030 frames (76 classes)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">DCGAN Generator:</span>
                  <span className="font-mono text-primary font-medium">4,030 frames (50 epochs)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-subtle">
                  <span className="text-tertiary">Augmented Training:</span>
                  <span className="font-mono text-amber font-semibold">
                    {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.trainingSampleCount : 'Pending VideoGAN Synthesis'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Noise Robustness Degradation Table */}
          <div className="lab2-card">
            <div className="lab2-card-header">
              <div>
                <h3 className="lab2-card-title flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber" />
                  <span>Gaussian Noise Robustness Degradation Table (σ ∈ [0.0, 0.20])</span>
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Evaluated on 180 video sequences under additive zero-mean Gaussian sensor noise.
                </p>
              </div>
              <span className="badge badge-neutral text-xs font-mono">
                {isDemoMode ? 'Illustrative Mode [DEMO]' : 'Empirical Ground Truth'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="lab2-table text-xs">
                <thead>
                  <tr>
                    <th>Perturbation Level</th>
                    <th>Noise Standard Deviation (σ)</th>
                    <th>Baseline CNN-LSTM Accuracy</th>
                    <th>Baseline Macro F1</th>
                    <th>GAN-Augmented CNN-LSTM</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CNN_LSTM_DEMO_FIXTURE.baseline.noiseRobustness.map((pt, idx) => (
                    <tr key={pt.noiseStd}>
                      <td className="font-semibold text-primary">{pt.label}</td>
                      <td className="font-mono">σ = {pt.noiseStd.toFixed(2)}</td>
                      <td className="font-mono text-accent-emerald font-bold">{pt.accuracy.toFixed(2)}%</td>
                      <td className="font-mono text-primary">{pt.f1.toFixed(4)}</td>
                      <td className="font-mono text-amber font-semibold">
                        {isDemoMode 
                          ? `${CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.noiseRobustness[idx].accuracy.toFixed(2)}% [DEMO]`
                          : 'Pending evaluation'
                        }
                      </td>
                      <td>
                        {isDemoMode ? (
                          <span className="badge badge-amber text-[10px]">Simulated Projection</span>
                        ) : (
                          <span className="badge badge-neutral text-[10px]">Awaiting Model</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scientific Integrity Callout */}
          <div className="lab2-card border-amber-subtle">
            <div className="lab2-card-header">
              <div className="lab2-mini-icon-badge amber">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="lab2-card-title">Scientific Integrity Report & Verification Findings</h3>
                <span className="badge badge-amber text-[10px] mt-0.5">Zero Metric Fabrication Guarantee</span>
              </div>
            </div>
            <div className="text-xs text-secondary leading-relaxed space-y-3">
              <p>
                In strict compliance with research ethics, <strong>no fabricated or simulated metrics</strong> are presented as empirical results for the 
                GAN-augmented CNN-LSTM classifier. As documented in the teammate's experimental findings:
              </p>
              <blockquote className="border-l-2 border-brand pl-3 py-1 text-primary italic font-serif text-sm">
                "The model generates individual images, not temporally coherent video sequences. In sign language recognition, temporal context 
                and motion dynamics are critical. The current DCGAN does not model temporal transitions between frames. No controlled CNN-LSTM 
                experiment has established that generated images improve sign recognition."
              </blockquote>
              <p>
                The baseline CNN-LSTM achieved <strong>4.44% top-1 accuracy</strong> on the 180 test video sequences, performing ~3.4× above random 
                chance (1.32%), but constrained by the small training dataset (4,030 frames total across 76 classes, or ~53 frames per word).
              </p>
            </div>
          </div>

          {/* Model Performance Comparison on 180 Sequences Table */}
          <div className="lab2-card">
            <div className="lab2-card-header">
              <h3 className="lab2-card-title">Model Performance Comparison on 180 Video Sequences</h3>
              <button
                type="button"
                className="btn btn-secondary text-xs font-semibold flex items-center gap-1.5"
                onClick={handleDownloadEvaluationReport}
              >
                <Download size={14} />
                <span>Export Evaluation JSON</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="lab2-table text-xs">
                <thead>
                  <tr>
                    <th>Model Configuration</th>
                    <th>Input Modality</th>
                    <th>Test Accuracy</th>
                    <th>Top-3 Accuracy</th>
                    <th>Macro F1</th>
                    <th>Weighted F1</th>
                    <th>Latency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold text-primary">Baseline CNN-LSTM</td>
                    <td>33 Frames × 112×112</td>
                    <td className="font-mono text-accent-emerald font-semibold">4.44%</td>
                    <td className="font-mono text-primary">12.78%</td>
                    <td className="font-mono text-primary">0.0100</td>
                    <td className="font-mono text-primary">0.0097</td>
                    <td className="font-mono text-secondary">~45.6 ms</td>
                    <td><span className="badge badge-success text-[10px]">Verified on 180 Test Videos</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">GAN-Augmented CNN-LSTM</td>
                    <td>33 Frames × 112×112</td>
                    <td className="font-mono text-amber font-semibold">
                      {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.accuracyDisplay : 'Pending evaluation'}
                    </td>
                    <td className="font-mono text-amber font-semibold">
                      {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.top3Display : 'Pending evaluation'}
                    </td>
                    <td className="font-mono text-tertiary">
                      {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.macroF1Display : 'Not measured'}
                    </td>
                    <td className="font-mono text-tertiary">
                      {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.weightedF1Display : 'Not measured'}
                    </td>
                    <td className="font-mono text-tertiary">
                      {isDemoMode ? CNN_LSTM_DEMO_FIXTURE.illustrativeAugmented.latencyDisplay : 'Not measured'}
                    </td>
                    <td>
                      {isDemoMode ? (
                        <span className="badge badge-amber text-[10px]">DEMO — Illustrative Only</span>
                      ) : (
                        <span className="badge badge-amber text-[10px]">Pending Checkpoint</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Random Chance (76 Classes)</td>
                    <td>N/A</td>
                    <td className="font-mono text-tertiary">1.32%</td>
                    <td className="font-mono text-tertiary">3.95%</td>
                    <td className="font-mono text-tertiary">0.0132</td>
                    <td className="font-mono text-tertiary">0.0132</td>
                    <td className="font-mono text-tertiary">—</td>
                    <td><span className="badge badge-neutral text-[10px]">Theoretical Floor</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SECTION E: Scientific Findings */}
      {activeSection === 'findings' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-e">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-e" className="lab2-section-title">
                <HelpCircle size={20} className="text-brand" />
                <span>Section E: Scientific Findings & Spatio-Temporal Analysis</span>
              </h2>
              <p className="lab2-section-subtitle">
                Why 2D DCGAN is architecturally insufficient for temporal sign language sequence modeling, and why ethical reporting demands marking the experiment as pending.
              </p>
            </div>
          </div>

          {/* Core Findings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="lab2-card">
              <h3 className="lab2-card-title mb-2 flex items-center gap-2">
                <Layers size={16} className="text-accent-amber" />
                <span>1. Spatial vs Temporal Modality Gap</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                Indian Sign Language communication is fundamentally dynamic. Hand trajectories, arm acceleration, finger transition 
                velocities, and facial expression deltas encode lexical meaning. A 2D DCGAN generates isolated static frames lacking 
                any velocity vector, making it incapable of synthesizing natural continuous gesture evolution.
              </p>
            </div>

            <div className="lab2-card">
              <h3 className="lab2-card-title mb-2 flex items-center gap-2">
                <Film size={16} className="text-brand" />
                <span>2. Temporal Incoherence & Recurrent Memory Collapse</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                If 33 independently generated 2D frames are concatenated into a pseudo-sequence, the resulting video exhibits severe 
                spatial flickering, hand teleportation, and discontinuous anatomy. Recurrent LSTM cells rely on continuous temporal gradients; 
                chaotic inter-frame noise causes catastrophic degradation of recurrent hidden-state memory (<code className="font-mono">h_t, c_t</code>).
              </p>
            </div>

            <div className="lab2-card">
              <h3 className="lab2-card-title mb-2 flex items-center gap-2">
                <Cpu size={16} className="text-accent-cyan" />
                <span>3. Resolution Mismatch (64×64 vs 112×112)</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                The DCGAN generator outputs 64×64 pixel frames, whereas the CNN-LSTM spatial backbone was trained on 112×112 sequences. 
                Upscaling 64×64 synthetic images introduces severe bilinear blur, further attenuating fine finger-tip boundaries essential 
                for disambiguating similar sign gestures.
              </p>
            </div>

            <div className="lab2-card">
              <h3 className="lab2-card-title mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-violet" />
                <span>4. Research Roadmap for Temporal Augmentation</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                To truly augment CNN-LSTM sequence classifiers, the generative pipeline must adopt video-level architectures:
                Motion and Content GAN (MoCoGAN), Spatio-Temporal Video Diffusion Models, or MediaPipe 3D Landmark Trajectory 
                Interpolation via Recurrent Autoencoders.
              </p>
            </div>
          </div>

          {/* Architectural Modality Comparison Table */}
          <div className="lab2-card mb-6">
            <h3 className="lab2-card-title mb-2 flex items-center gap-2">
              <Table size={16} className="text-brand" />
              <span>Architectural Modality Comparison: 2D DCGAN vs Spatio-Temporal CNN-LSTM</span>
            </h3>
            <p className="text-xs text-secondary mb-4">
              Detailed structural comparison illustrating why static image augmentation cannot be directly coupled to recurrent temporal sequence classifiers.
            </p>
            <div className="overflow-x-auto">
              <table className="lab2-table text-xs">
                <thead>
                  <tr>
                    <th>Dimension / Attribute</th>
                    <th>Teammate's DCGAN Generator</th>
                    <th>Baseline CNN-LSTM Classifier</th>
                    <th>Modality Incompatibility</th>
                    <th>Valid Sequence-Level Solution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold text-primary">Input / Output Modality</td>
                    <td className="font-mono">2D Static Image (64 × 64 × 3)</td>
                    <td className="font-mono">4D Video Tensor (33 × 112 × 112 × 3)</td>
                    <td className="text-accent-red font-medium">Missing time dimension (T=1 vs T=33)</td>
                    <td className="text-accent-emerald font-medium">MoCoGAN / Video Diffusion (T-frame output)</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Temporal Dynamics</td>
                    <td className="text-tertiary">None (Isolated snapshot, zero velocity)</td>
                    <td className="text-primary font-medium">Continuous hand velocity & optical flow</td>
                    <td className="text-accent-red font-medium">Zero inter-frame kinematic continuity</td>
                    <td className="text-accent-emerald font-medium">Recurrent latent trajectory interpolation</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">LSTM State Evolution</td>
                    <td className="text-tertiary">N/A (Spatial Transpose Conv2D only)</td>
                    <td className="font-mono">h_t = LSTM(x_t, h_&#123;t-1&#125;) recurrent memory</td>
                    <td className="text-accent-red font-medium">Independent noise breaks recurrent gradients</td>
                    <td className="text-accent-emerald font-medium">Time-coherent sequence synthesis</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Spatial Resolution</td>
                    <td className="font-mono">64 × 64 pixels</td>
                    <td className="font-mono">112 × 112 pixels</td>
                    <td className="text-accent-amber font-medium">Bilinear interpolation blur on upscale</td>
                    <td className="text-accent-emerald font-medium">Native 112×112 or Super-Resolution GAN</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Scientific Feasibility</td>
                    <td className="text-accent-emerald font-medium">Trained (50 epochs on 4,030 frames)</td>
                    <td className="text-accent-emerald font-medium">Trained & Measured (4.44% Top-1, 180 vids)</td>
                    <td className="text-accent-red font-bold">Augmented model does NOT exist yet</td>
                    <td className="text-accent-brand font-medium">Mark as Pending Evaluation (Honest Reporting)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Defense & Viva Talking Points for Evaluators */}
          <div className="lab2-card border-brand-subtle">
            <h3 className="lab2-card-title mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-brand" />
              <span>Scientific Defense & Presentation Talking Points (Lab Evaluation 2)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-tertiary rounded border border-subtle space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-accent-emerald" />
                  Q: Why is GAN-augmented CNN-LSTM marked "Pending Evaluation"?
                </span>
                <p className="text-secondary leading-relaxed">
                  <strong>Answer:</strong> The teammate's GAN was trained as a 2D DCGAN generating static 64×64 frames. 
                  Our CNN-LSTM classifier is a temporal sequence model requiring 33 temporally continuous 112×112 frames. 
                  No sequence-compatible GAN model was trained. As a matter of scientific ethics, we display the actual measured 
                  baseline metrics (4.44% accuracy, 12.78% top-3) and transparently mark the augmented experiment as pending rather than fabricating numbers.
                </p>
              </div>

              <div className="p-3 bg-tertiary rounded border border-subtle space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-accent-emerald" />
                  Q: Why did DCGAN fail on Custom CNN (-20.89%) and what would happen on CNN-LSTM?
                </span>
                <p className="text-secondary leading-relaxed">
                  <strong>Answer:</strong> On Custom CNN, 50% GAN augmentation degraded accuracy from 49.89% to 29.00% because low-resolution 
                  DCGAN images introduced morphological hand artifacts that acted as adversarial noise. On CNN-LSTM, feeding independent 2D frames 
                  would be even more damaging because an LSTM relies on temporal continuity; random frame concatenation destroys the hidden state representation.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION F: Interactive Video Sequence Testing */}
      {activeSection === 'prediction' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-f">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-f" className="lab2-section-title">
                <Video size={20} className="text-brand" />
                <span>Section F: Interactive Video Sequence Testing</span>
              </h2>
              <p className="lab2-section-subtitle">
                Upload a real sign language video to extract 33 uniform temporal frames, apply 112×112 sequence preprocessing, 
                and execute end-to-end inference on the verified CNN-LSTM sequence model.
              </p>
            </div>
          </div>

          {/* Workflow Card */}
          <div className="lab2-card mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Upload & Video Player */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Upload Sign Language Video (MP4 / AVI / MOV)
                  </label>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      type="file"
                      accept="video/mp4,video/avi,video/quicktime,video/x-msvideo"
                      onChange={handleVideoFileChange}
                      className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-500 file:text-white hover:file:bg-brand-600"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary text-xs font-medium flex items-center gap-1.5"
                      onClick={handleLoadSampleVideo}
                    >
                      <Film size={13} />
                      <span>Load ISL Sample Video</span>
                    </button>
                  </div>
                </div>

                {videoPreviewUrl && (
                  <div className="lab2-video-player-wrap">
                    <video 
                      src={videoPreviewUrl} 
                      controls 
                      className="w-full rounded bg-black max-h-56 object-contain"
                    />
                    <div className="p-2 bg-tertiary flex justify-between items-center text-xs text-secondary">
                      <span className="font-mono truncate">{selectedVideoFile?.name}</span>
                      <span className="badge badge-neutral text-[10px]">
                        Target: 33 Frames × 112×112
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary w-full text-xs font-semibold flex items-center justify-center gap-2"
                  onClick={handleRunSequenceInference}
                  disabled={!selectedVideoFile || isPredicting}
                >
                  {isPredicting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Extracting 33 Frames & Evaluating CNN-LSTM...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Run CNN-LSTM Sequence Inference</span>
                    </>
                  )}
                </button>

                {predictError && (
                  <div className="text-xs text-accent-red flex items-center gap-1.5 bg-red-subtle-alpha p-2.5 rounded">
                    <AlertCircle size={14} />
                    <span>{predictError}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Preprocessing Specifications */}
              <div className="space-y-3">
                <div className="lab2-card bg-tertiary border-subtle">
                  <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                    <Info size={14} className="text-brand" />
                    <span>Spatio-Temporal Sequence Pipeline</span>
                  </h4>
                  <ul className="text-xs text-secondary space-y-1.5 leading-relaxed list-disc list-inside">
                    <li>Decodes video stream via OpenCV backend without caching to disk.</li>
                    <li>Extracts exactly <strong>33 temporal frames</strong> uniformly spaced across video duration using <code className="font-mono">np.linspace</code>.</li>
                    <li>Resizes each frame to <strong>112 × 112 RGB</strong>.</li>
                    <li>Normalizes pixel values into <code className="font-mono">[0.0, 1.0]</code> via division by 255.0.</li>
                    <li>Constructs input batch tensor of shape <code className="font-mono">(1, 33, 112, 112, 3)</code>.</li>
                    <li>Feeds sequence into <code className="font-mono">signbridge_cnn_lstm_best.keras</code> for softmax classification over 76 classes.</li>
                  </ul>
                </div>

                <div className="lab2-card bg-amber-subtle-alpha border-amber">
                  <div className="flex items-start gap-2 text-xs">
                    <Clock size={16} className="text-amber shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-primary">Augmented Classifier Status:</span>
                      <p className="text-secondary leading-relaxed">
                        Awaiting teammate sequence checkpoint. The baseline model provides verified live inference now.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {predictResult && (
            <div className="space-y-6">
              {/* Extracted 33 Keyframes Reel */}
              <div className="lab2-card">
                <div className="lab2-card-header">
                  <div>
                    <h3 className="lab2-card-title flex items-center gap-2">
                      <Film size={16} className="text-brand" />
                      <span>Extracted 33-Frame Spatio-Temporal Sequence Reel</span>
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      Uniformly sampled 112×112 frames fed into the recurrent LSTM backbone
                    </p>
                  </div>
                  <span className="badge badge-neutral text-xs font-mono">
                    33 Frames Extracted
                  </span>
                </div>

                <div className="lab2-sequence-reel-scroll">
                  {predictResult.preview_thumbnails && predictResult.preview_thumbnails.map((thumb) => (
                    <div key={thumb.sequence_step} className="lab2-sequence-frame-card">
                      <img src={`data:image/jpeg;base64,${thumb.thumbnail}`} alt={`Frame ${thumb.frame_num}`} />
                      <div className="lab2-sequence-frame-footer">
                        <span>#{thumb.sequence_step}</span>
                        <span>{thumb.timestamp_sec.toFixed(2)}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dual Inference Outcome */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Baseline CNN-LSTM Outcome */}
                <div className="lab2-card">
                  <div className="lab2-card-header">
                    <div>
                      <h3 className="lab2-card-title">1. Baseline CNN-LSTM Prediction</h3>
                      <p className="text-xs text-secondary mt-0.5">Real video sequence inference</p>
                    </div>
                    <span className="badge badge-success text-xs font-mono">
                      {predictResult.baseline_cnn_lstm.latency_ms.toFixed(1)} ms
                    </span>
                  </div>

                  <div className="p-4 bg-tertiary rounded-md border border-subtle mb-4 text-center">
                    <span className="text-xs uppercase tracking-wider text-secondary font-semibold block mb-1">
                      Predicted ISL Sign Gesture
                    </span>
                    <span className="text-2xl font-black text-brand font-mono">
                      {predictResult.baseline_cnn_lstm.predicted_class}
                    </span>
                    <div className="text-xs text-secondary mt-1 font-mono">
                      Confidence: {(predictResult.baseline_cnn_lstm.confidence * 100).toFixed(2)}%
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-primary mb-2">Top-5 Candidates Distribution</h4>
                  <div className="space-y-2">
                    {predictResult.baseline_cnn_lstm.top5 && predictResult.baseline_cnn_lstm.top5.map((cand, idx: number) => (
                      <div key={cand.class_name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-primary">{idx + 1}. {cand.class_name}</span>
                          <span className="font-mono text-secondary">{(cand.confidence * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-tertiary rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-brand-500 h-1.5 rounded-full" 
                            style={{ width: `${Math.max(cand.confidence * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GAN-Augmented CNN-LSTM Outcome */}
                <div className="lab2-card border-amber-subtle">
                  <div className="lab2-card-header">
                    <div>
                      <h3 className="lab2-card-title">2. GAN-Augmented CNN-LSTM</h3>
                      <p className="text-xs text-secondary mt-0.5">Temporal trajectory augmentation</p>
                    </div>
                    <span className="badge badge-amber text-xs">
                      Pending Weights
                    </span>
                  </div>

                  <div className="p-4 bg-amber-subtle-alpha rounded-md border border-amber mb-4 text-center">
                    <span className="text-xs uppercase tracking-wider text-amber font-semibold block mb-1">
                      Checkpoint Status
                    </span>
                    <span className="text-base font-bold text-primary">
                      Awaiting Augmented Sequence Model
                    </span>
                    <p className="text-xs text-secondary mt-2 leading-relaxed">
                      The teammate's DCGAN produces 2D static images rather than temporally coherent 33-frame video sequences. 
                      To preserve research integrity, inference is reserved until an authentic sequence model is delivered.
                    </p>
                  </div>

                  <div className="text-xs text-secondary space-y-2 border-t border-subtle pt-3">
                    <div className="flex justify-between">
                      <span className="text-tertiary">Requested Checkpoint:</span>
                      <span className="font-mono text-primary font-medium">gan_cnn_lstm_augmented.keras</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary">Compatible Sequence:</span>
                      <span className="font-mono text-primary font-medium">33 × 112 × 112 × 3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary">Augmentation Ratio:</span>
                      <span className="font-mono text-primary font-medium">TBD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-secondary text-xs font-semibold flex items-center gap-1.5"
                  onClick={handleDownloadInferenceJson}
                >
                  <Download size={14} />
                  <span>Download Inference JSON</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION G: Tri-Model Comparison Matrix */}
      {activeSection === 'comparison' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-g">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-g" className="lab2-section-title">
                <Table size={20} className="text-brand" />
                <span>Section G: Cross-Architecture Evaluation Matrix</span>
              </h2>
              <p className="lab2-section-subtitle">
                Systematic tri-model comparison between 2D Custom CNN, Spatio-Temporal CNN-LSTM, and MobileNetV2.
              </p>
            </div>
          </div>

          <div className="lab2-card mb-6">
            <h3 className="lab2-card-title mb-3">Tri-Model Comprehensive Benchmark Matrix</h3>
            <div className="overflow-x-auto">
              <table className="lab2-table text-xs">
                <thead>
                  <tr>
                    <th>Architecture</th>
                    <th>Input Modality</th>
                    <th>Input Dimensions</th>
                    <th>Augmentation Strategy</th>
                    <th>Baseline Accuracy</th>
                    <th>Augmented Accuracy</th>
                    <th>Accuracy Delta</th>
                    <th>Inference Latency</th>
                    <th>Integration Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold text-primary">1. Custom 2D CNN</td>
                    <td>Single Static Frame</td>
                    <td className="font-mono">64 × 64 × 3</td>
                    <td>50% 2D DCGAN Synthetic Frames</td>
                    <td className="font-mono text-accent-emerald font-semibold">49.89%</td>
                    <td className="font-mono text-accent-amber font-semibold">29.00%</td>
                    <td className="font-mono text-accent-red font-semibold">-20.89%</td>
                    <td className="font-mono">~8.2 ms</td>
                    <td><span className="badge badge-success text-[10px]">Verified Dual Run</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">2. CNN-LSTM</td>
                    <td>33-Frame Temporal Sequence</td>
                    <td className="font-mono">33 × 112 × 112 × 3</td>
                    <td>Static 2D DCGAN (Incompatible)</td>
                    <td className="font-mono text-accent-emerald font-semibold">4.44%</td>
                    <td className="font-mono text-tertiary">Awaiting VideoGAN</td>
                    <td className="font-mono text-tertiary">—</td>
                    <td className="font-mono">~45.6 ms</td>
                    <td><span className="badge badge-amber text-[10px]">Baseline Verified • Aug Pending</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">3. MobileNetV2</td>
                    <td>Single Frame (8 frames/vid)</td>
                    <td className="font-mono">64 × 64 × 3 (128×128 in-model)</td>
                    <td>97.4% 2D DCGAN (600 synth frames)</td>
                    <td className="font-mono text-accent-emerald font-semibold">55.56%</td>
                    <td className="font-mono text-accent-emerald font-semibold">55.56%</td>
                    <td className="font-mono text-secondary font-semibold">±0.00%</td>
                    <td className="font-mono">~10.4 ms</td>
                    <td><span className="badge badge-success text-[10px]">Verified Dual Run (3 Seeds)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="lab2-card">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-accent-emerald" />
                <span>Empirical Findings Across All 3 Architectures</span>
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                In the 2D spatial domain, Custom CNN experienced a <strong>-20.89% degradation</strong> under 50% DCGAN augmentation 
                (49.89% down to 29.00%), while MobileNetV2 fine-tuning on 5 classes demonstrated <strong>±0.00% delta</strong> 
                (55.56% baseline vs 55.56% augmented across 3 random seeds), demonstrating that frame-level DCGAN images carry insufficient 
                discriminative signal. In the temporal domain (CNN-LSTM), static 2D frames cannot be concatenated into sequences without video-level motion modeling.
              </p>
            </div>

            <div className="lab2-card">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <ArrowRight size={14} className="text-brand" />
                <span>Production Pipeline Recommendation</span>
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                Retain the original SignBridge production recognition models (MobileNetV2, CNN-LSTM, Late Fusion) with their 
                verified real-world sign accuracy. Generative augmentation should be pursued through temporal video diffusion models 
                or MediaPipe 3D landmark sequence synthesis rather than low-resolution static DCGANs.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
