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
  Activity,
  Clock,
  Maximize2,
  X,
  HelpCircle,
  TrendingUp,
  ChevronDown,
  Video,
  Film,
  Play,
  CheckSquare,
  Square,
  Download,
  ListFilter,
  Check
} from 'lucide-react';
import {
  fetchLabEval2Metadata,
  fetchLabEval2Metrics,
  predictLabEval2,
  generateLabEval2Image,
  extractVideoFrames,
  predictVideoFramesDual,
  VERIFIED_TEST_COMPARISON,
  VERIFIED_ROBUSTNESS,
  VERIFIED_LATENCY,
} from '../../services/labEval2Api';
import type {
  LabEval2Overview,
  LabEval2Metrics,
  LabEval2PredictResponse,
  LabEval2GenerateResponse,
  ExtractedFrameItem,
  VideoDualInferResponse
} from '../../services/labEval2Api';

interface GanCnnPageProps {
  onNavigateToTab?: (tab: 'gan-cnn' | 'gan-cnn-lstm' | 'gan-mobilenetv2') => void;
}

export const GanCnnPage: React.FC<GanCnnPageProps> = ({ onNavigateToTab }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'training' | 'samples' | 'results' | 'findings' | 'prediction' | 'comparison'>('overview');
  const [metadata, setMetadata] = useState<LabEval2Overview | null>(null);
  const [metrics, setMetrics] = useState<LabEval2Metrics | null>(null);

  // Prediction Interactive State (Single Frame Mode)
  const [interactiveMode, setInteractiveMode] = useState<'video' | 'single-frame'>('video');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<LabEval2PredictResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Interactive Video Testing State (Phase 3)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [samplingStrategy, setSamplingStrategy] = useState<'uniform' | 'interval'>('uniform');
  const [maxFramesCount, setMaxFramesCount] = useState<number>(5);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrameItem[]>([]);
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<number[]>([]);
  const [isDualInferring, setIsDualInferring] = useState<boolean>(false);
  const [dualInferResult, setDualInferResult] = useState<VideoDualInferResponse | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Live Generator State
  const [selectedClassForGen, setSelectedClassForGen] = useState<string>('afternoon');
  const [generatorSeed, setGeneratorSeed] = useState<number>(42);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<LabEval2GenerateResponse | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Class Filter for Section E
  const [classFilter, setClassFilter] = useState<string>('');

  // Plot Lightbox State
  const [lightboxPlot, setLightboxPlot] = useState<{ src: string; title: string; desc: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [metaData, metricsData] = await Promise.all([
          fetchLabEval2Metadata(),
          fetchLabEval2Metrics()
        ]);
        if (mounted) {
          setMetadata(metaData);
          setMetrics(metricsData);
        }
      } catch (err) {
        console.error('Failed to load Lab Eval 2 data:', err);
      }
    };
    loadData();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPredictError(null);
      setPredictionResult(null);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviewUrl(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedVideoFile(file);
      setVideoError(null);
      setExtractedFrames([]);
      setSelectedFrameIndices([]);
      setDualInferResult(null);

      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    }
  };

  const handleLoadSampleVideo = async () => {
    try {
      setVideoError(null);
      const res = await fetch('/samples/isl_sample_video.mp4');
      if (!res.ok) throw new Error('Sample video not found');
      const blob = await res.blob();
      const file = new File([blob], 'isl_sample_video.mp4', { type: 'video/mp4' });
      setSelectedVideoFile(file);
      setExtractedFrames([]);
      setSelectedFrameIndices([]);
      setDualInferResult(null);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    } catch (err: any) {
      setVideoError(err.message || 'Could not load sample video');
    }
  };

  const handleExtractFrames = async () => {
    if (!selectedVideoFile) return;
    setIsExtracting(true);
    setVideoError(null);
    try {
      const res = await extractVideoFrames(selectedVideoFile, samplingStrategy, maxFramesCount);
      setExtractedFrames(res.frames);
      setSelectedFrameIndices(res.frames.map(f => f.frame_index));
    } catch (err: any) {
      setVideoError(err.message || 'Frame extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRunDualVideoInference = async () => {
    if (!selectedVideoFile) return;
    setIsDualInferring(true);
    setVideoError(null);
    try {
      const res = await predictVideoFramesDual(
        selectedVideoFile,
        samplingStrategy,
        maxFramesCount,
        selectedFrameIndices.length > 0 ? selectedFrameIndices : undefined
      );
      setDualInferResult(res);
    } catch (err: any) {
      setVideoError(err.message || 'Dual video inference failed');
    } finally {
      setIsDualInferring(false);
    }
  };

  const toggleFrameSelection = (idx: number) => {
    setSelectedFrameIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const selectAllFrames = () => {
    setSelectedFrameIndices(extractedFrames.map(f => f.frame_index));
  };

  const clearFrameSelection = () => {
    setSelectedFrameIndices([]);
  };

  const handleExportResults = () => {
    if (!dualInferResult) return;
    const jsonStr = JSON.stringify(dualInferResult, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab2_dual_inference_${dualInferResult.filename || 'video'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const handleRunPrediction = async () => {
    if (!selectedFile) return;
    setIsPredicting(true);
    setPredictError(null);
    try {
      const res = await predictLabEval2(selectedFile, 'both');
      setPredictionResult(res);
    } catch (err: any) {
      setPredictError(err.message || 'Inference failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleGenerateLive = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await generateLabEval2Image(selectedClassForGen, generatorSeed);
      setGeneratedResult(res);
    } catch (err: any) {
      setGenError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const testComp = metrics?.test_comparison && metrics.test_comparison.length > 0 
    ? metrics.test_comparison 
    : VERIFIED_TEST_COMPARISON;

  const robustnessRows = metrics?.robustness && metrics.robustness.length > 0 
    ? metrics.robustness 
    : VERIFIED_ROBUSTNESS;

  const latencyRows = metrics?.latency && metrics.latency.length > 0 
    ? metrics.latency 
    : VERIFIED_LATENCY;

  const classesList = metadata?.classes && metadata.classes.length > 0
    ? metadata.classes
    : ['afternoon', 'animal', 'bad', 'before', 'bell', 'big', 'bird', 'black', 'blue', 'boat', 'book', 'boy', 'break', 'bridge', 'brother', 'bus', 'butterfly', 'call', 'car', 'cat', 'chair', 'church', 'city', 'clean', 'climb', 'close', 'cold', 'come', 'cook', 'cost', 'cow', 'cry', 'cup', 'dance', 'dark', 'daughter', 'day', 'deaf', 'doctor', 'dog', 'door', 'draw', 'drink', 'drive', 'dry', 'ear', 'eat', 'egg', 'elephant', 'empty', 'eye', 'face', 'fall', 'family', 'far', 'fast', 'fat', 'father', 'fear', 'feel', 'female', 'fight', 'fine', 'finger', 'fire', 'fish', 'flag', 'fly', 'food', 'foot', 'free', 'friend', 'fruit', 'full', 'game'];

  const filteredBias = (metrics?.per_class_bias || []).filter(item => 
    !classFilter || item.Class.toLowerCase().includes(classFilter.toLowerCase())
  );

  return (
    <div className="lab2-model-page">
      {/* Lightbox Modal for Publication Plots */}
      {lightboxPlot && (
        <div 
          className="lab2-lightbox-overlay" 
          onClick={() => setLightboxPlot(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
        >
          <div className="lab2-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lab2-lightbox-header">
              <div>
                <h3 id="lightbox-title" className="text-base font-bold text-primary">
                  {lightboxPlot.title}
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
              <span className="text-xs text-secondary">Verified experimental artifact from Kaggle run • Press ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Internal Section Navigation Tabs */}
      <div className="lab2-section-nav-wrap">
        <nav className="lab2-section-nav" role="tablist" aria-label="GAN + CNN Experiment Navigation">
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
            <span>F. Interactive Testing</span>
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

      {/* SECTION A: Model Architecture & Overview */}
      {activeSection === 'overview' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-a">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-a" className="lab2-section-title">
                <Cpu size={20} className="text-brand" />
                <span>Section A: Verified Architecture & Configuration</span>
              </h2>
              <p className="lab2-section-subtitle">
                Comprehensive specification of the 4-block convolutional backbone and the conditional DCGAN generative network.
              </p>
            </div>
            <span className="badge badge-success text-xs">
              <CheckCircle2 size={12} /> 3 Models Verified
            </span>
          </div>

          {/* Quick Parameters Summary Grid */}
          <div className="lab2-spec-cards-grid mb-6">
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Input Resolution</span>
              <span className="lab2-spec-card-value font-mono">64 × 64 × 3</span>
              <span className="lab2-spec-card-hint">RGB Color Format</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Normalization Range</span>
              <span className="lab2-spec-card-value font-mono">[-1.0, 1.0]</span>
              <span className="lab2-spec-card-hint">frame / 127.5 - 1.0</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Augmentation Ratio</span>
              <span className="lab2-spec-card-value font-mono">50% Synthetic</span>
              <span className="lab2-spec-card-hint">1:1 Real to Fake Balance</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">DCGAN Training</span>
              <span className="lab2-spec-card-value font-mono">100 Epochs</span>
              <span className="lab2-spec-card-hint">Latent Vector: 100 dims</span>
            </div>
          </div>

          {/* 3 Architecture Cards */}
          <div className="lab2-card-grid mb-6">
            {/* Card 1: Baseline Custom 2D CNN */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div className="lab2-card-icon-title">
                  <div className="lab2-mini-icon-badge brand">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="lab2-card-title">1. Baseline Custom 2D CNN</h3>
                    <span className="text-xs text-secondary">Unaugmented Control Model</span>
                  </div>
                </div>
                <span className="badge badge-neutral text-xs font-mono">Clean: 49.89%</span>
              </div>

              <p className="text-sm text-secondary leading-relaxed mb-4">
                Trained strictly on authentic video frames extracted at 5 uniform intervals per video. 
                Serves as the empirical reference benchmark without synthetic perturbation.
              </p>

              <div className="lab2-meta-list">
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Convolutional Backbone</span>
                  <span className="lab2-meta-val font-mono">4 Blocks (32, 64, 128, 256)</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Pooling & Head</span>
                  <span className="lab2-meta-val font-mono">GAP + Dense(128) + Dropout(0.4)</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Output Dimension</span>
                  <span className="lab2-meta-val font-mono">76 Classes (Softmax)</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Clean Test Accuracy</span>
                  <span className="lab2-meta-val font-mono text-emerald font-bold">49.89% (449 / 900)</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Mean Latency</span>
                  <span className="lab2-meta-val font-mono text-cyan">4.16 ms / frame</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Saved Checkpoint</span>
                  <span className="badge badge-brand font-mono text-[11px]">baseline_cnn_best.keras</span>
                </div>
              </div>

              {/* Collapsible Layer Specifications */}
              <details className="lab2-details-collapse mt-4">
                <summary className="lab2-details-summary">
                  <span>View Complete Layer Hierarchy</span>
                  <ChevronDown size={14} className="details-arrow" />
                </summary>
                <div className="lab2-details-body text-xs font-mono">
                  <table className="lab2-compact-table">
                    <thead>
                      <tr>
                        <th>Layer</th>
                        <th>Filters / Units</th>
                        <th>Kernel</th>
                        <th>Activation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>InputLayer</td><td>(64, 64, 3)</td><td>—</td><td>—</td></tr>
                      <tr><td>Conv2D Block 1</td><td>32</td><td>3 × 3</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>Conv2D Block 2</td><td>64</td><td>3 × 3</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>Conv2D Block 3</td><td>128</td><td>3 × 3</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>Conv2D Block 4</td><td>256</td><td>3 × 3</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>GlobalAvgPool2D</td><td>256</td><td>—</td><td>—</td></tr>
                      <tr><td>Dense + Dropout</td><td>128</td><td>—</td><td>ReLU (p=0.4)</td></tr>
                      <tr><td>Softmax Head</td><td>76</td><td>—</td><td>Softmax</td></tr>
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

            {/* Card 2: DCGAN-Augmented Custom CNN */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div className="lab2-card-icon-title">
                  <div className="lab2-mini-icon-badge violet">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="lab2-card-title">2. DCGAN-Augmented Custom CNN</h3>
                    <span className="text-xs text-secondary">Synthetic-Enriched Model</span>
                  </div>
                </div>
                <span className="badge badge-amber text-xs font-mono">Clean: 29.00%</span>
              </div>

              <p className="text-sm text-secondary leading-relaxed mb-4">
                Trained with 50% synthetic frames generated by the class-conditioned DCGAN mixed with authentic 
                training frames to evaluate generative data augmentation effects.
              </p>

              <div className="lab2-meta-list">
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Convolutional Backbone</span>
                  <span className="lab2-meta-val font-mono">Identical 4-Block Conv2D</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Training Mixture</span>
                  <span className="lab2-meta-val font-mono">50% Real / 50% Synthetic</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Output Dimension</span>
                  <span className="lab2-meta-val font-mono">76 Classes (Softmax)</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Clean Test Accuracy</span>
                  <span className="lab2-meta-val font-mono text-amber font-bold">29.00% (261 / 900)</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Mean Latency</span>
                  <span className="lab2-meta-val font-mono text-cyan">3.23 ms / frame</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Saved Checkpoint</span>
                  <span className="badge badge-violet font-mono text-[11px]">gan_augmented_cnn_best.keras</span>
                </div>
              </div>

              {/* Collapsible Layer Specifications */}
              <details className="lab2-details-collapse mt-4">
                <summary className="lab2-details-summary">
                  <span>View Complete Layer Hierarchy</span>
                  <ChevronDown size={14} className="details-arrow" />
                </summary>
                <div className="lab2-details-body text-xs font-mono">
                  <table className="lab2-compact-table">
                    <thead>
                      <tr>
                        <th>Layer</th>
                        <th>Filters / Units</th>
                        <th>Kernel</th>
                        <th>Activation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>InputLayer</td><td>(64, 64, 3)</td><td>—</td><td>—</td></tr>
                      <tr><td>Conv2D Block 1</td><td>32</td><td>3 × 3</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>Conv2D Block 2</td><td>64</td><td>3 × 3</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>Conv2D Block 3</td><td>128</td><td>3 × 3</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>Conv2D Block 4</td><td>256</td><td>3 × 3</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>GlobalAvgPool2D</td><td>256</td><td>—</td><td>—</td></tr>
                      <tr><td>Dense + Dropout</td><td>128</td><td>—</td><td>ReLU (p=0.4)</td></tr>
                      <tr><td>Softmax Head</td><td>76</td><td>—</td><td>Softmax</td></tr>
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

            {/* Card 3: Conditional DCGAN Generator */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div className="lab2-card-icon-title">
                  <div className="lab2-mini-icon-badge amber">
                    <Wand2 size={18} />
                  </div>
                  <div>
                    <h3 className="lab2-card-title">3. Conditional DCGAN Generator</h3>
                    <span className="text-xs text-secondary">Generative Synthesis Engine</span>
                  </div>
                </div>
                <span className="badge badge-success text-xs font-mono">100 Epochs</span>
              </div>

              <p className="text-sm text-secondary leading-relaxed mb-4">
                Generates class-conditioned 64×64 RGB hand configuration frames conditioned on target 
                ISL class label embeddings to balance training distributions.
              </p>

              <div className="lab2-meta-list">
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Latent Noise Vector</span>
                  <span className="lab2-meta-val font-mono">100 Dimensions ~ N(0, 1)</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Conditioning Strategy</span>
                  <span className="lab2-meta-val font-mono">Class Label Embedding (76 classes)</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Upsampling Pathway</span>
                  <span className="lab2-meta-val font-mono">8×8 → 16×16 → 32×32 → 64×64</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Output Activation</span>
                  <span className="lab2-meta-val font-mono text-cyan">tanh [-1.0, 1.0]</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Optimizer</span>
                  <span className="lab2-meta-val font-mono">Adam (lr=0.0002, β1=0.5)</span>
                </div>
                <div className="lab2-meta-item">
                  <span className="lab2-meta-key">Saved Checkpoint</span>
                  <span className="badge badge-amber font-mono text-[11px]">generator_epoch_100.keras</span>
                </div>
              </div>

              {/* Collapsible Layer Specifications */}
              <details className="lab2-details-collapse mt-4">
                <summary className="lab2-details-summary">
                  <span>View Generator Architecture</span>
                  <ChevronDown size={14} className="details-arrow" />
                </summary>
                <div className="lab2-details-body text-xs font-mono">
                  <table className="lab2-compact-table">
                    <thead>
                      <tr>
                        <th>Block</th>
                        <th>Output Shape</th>
                        <th>Operation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Inputs</td><td>Noise (100) + Label (1)</td><td>Embedding concat</td></tr>
                      <tr><td>Dense Projection</td><td>8 × 8 × 256</td><td>Reshape + BatchNorm</td></tr>
                      <tr><td>Conv2DTranspose 1</td><td>16 × 16 × 128</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>Conv2DTranspose 2</td><td>32 × 32 × 64</td><td>ReLU + BatchNorm</td></tr>
                      <tr><td>Conv2DTranspose 3</td><td>64 × 64 × 3</td><td>Tanh Output</td></tr>
                    </tbody>
                  </table>
                </div>
              </details>
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
                <span>Section B: Dataset Partitions & Training Dynamics</span>
              </h2>
              <p className="lab2-section-subtitle">
                Split distributions across authentic video frames and progression of generator/discriminator losses.
              </p>
            </div>
            <span className="badge badge-neutral text-xs">ISL 76-Class Benchmark</span>
          </div>

          {/* Dataset Split Metrics */}
          <div className="lab2-spec-cards-grid mb-6">
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Training Set (Real)</span>
              <span className="lab2-spec-card-value font-mono">2,736</span>
              <span className="lab2-spec-card-hint">60% Authentic Frames</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Validation Set (Real)</span>
              <span className="lab2-spec-card-value font-mono">912</span>
              <span className="lab2-spec-card-hint">20% Authentic Frames</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Held-Out Test (Real)</span>
              <span className="lab2-spec-card-value font-mono text-emerald font-bold">900</span>
              <span className="lab2-spec-card-hint">20% Strictly Isolated</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Synthetic Samples Mixed</span>
              <span className="lab2-spec-card-value font-mono text-amber">2,736</span>
              <span className="lab2-spec-card-hint">50% Training Proportion</span>
            </div>
          </div>

          {/* Training Curves Plots Grid */}
          <div className="lab2-plots-grid mb-6">
            <div className="lab2-plot-card">
              <div className="lab2-plot-card-header">
                <div>
                  <h3 className="lab2-plot-card-title">Classifier Learning Curves</h3>
                  <p className="text-xs text-secondary">Loss and accuracy trajectory over training epochs for Baseline vs. Augmented CNN</p>
                </div>
                <button 
                  type="button" 
                  className="btn-icon-subtle"
                  onClick={() => setLightboxPlot({
                    src: '/lab_eval2/plots/learning_curves.png',
                    title: 'Classifier Learning Curves',
                    desc: 'Loss and accuracy progression showing early convergence and generalization gap.'
                  })}
                  title="Click to enlarge"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
              <div 
                className="lab2-plot-img-box"
                onClick={() => setLightboxPlot({
                  src: '/lab_eval2/plots/learning_curves.png',
                  title: 'Classifier Learning Curves',
                  desc: 'Loss and accuracy progression showing early convergence and generalization gap.'
                })}
              >
                <img 
                  src="/lab_eval2/plots/learning_curves.png" 
                  alt="Classifier Learning Curves" 
                  className="lab2-plot-img"
                  loading="lazy"
                />
                <span className="lab2-plot-zoom-hint">Click to enlarge</span>
              </div>
            </div>

            <div className="lab2-plot-card">
              <div className="lab2-plot-card-header">
                <div>
                  <h3 className="lab2-plot-card-title">DCGAN Adversarial Training Loss</h3>
                  <p className="text-xs text-secondary">Generator vs. Discriminator binary cross-entropy loss over 100 epochs</p>
                </div>
                <button 
                  type="button" 
                  className="btn-icon-subtle"
                  onClick={() => setLightboxPlot({
                    src: '/lab_eval2/plots/gan_training_loss.png',
                    title: 'DCGAN Training Loss Curves',
                    desc: 'Minimax adversarial equilibrium tracking generator and discriminator loss dynamics.'
                  })}
                  title="Click to enlarge"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
              <div 
                className="lab2-plot-img-box"
                onClick={() => setLightboxPlot({
                  src: '/lab_eval2/plots/gan_training_loss.png',
                  title: 'DCGAN Training Loss Curves',
                  desc: 'Minimax adversarial equilibrium tracking generator and discriminator loss dynamics.'
                })}
              >
                <img 
                  src="/lab_eval2/plots/gan_training_loss.png" 
                  alt="DCGAN Loss Progression" 
                  className="lab2-plot-img"
                  loading="lazy"
                />
                <span className="lab2-plot-zoom-hint">Click to enlarge</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION C: Generated Samples & Live Generator */}
      {activeSection === 'samples' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-c">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-c" className="lab2-section-title">
                <ImageIcon size={20} className="text-brand" />
                <span>Section C: Synthetic Sign Samples & Live DCGAN Generator</span>
              </h2>
              <p className="lab2-section-subtitle">
                Inspect actual synthesized frames from the 100-epoch DCGAN checkpoint and generate novel frames in real-time.
              </p>
            </div>
            <span className="badge badge-brand text-xs">Interactive Generator</span>
          </div>

          {/* Interactive Live Generator Box */}
          <div className="lab2-card mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Wand2 size={18} className="text-violet" />
                <h3 className="text-base font-semibold text-primary">Live Class-Conditioned Generator</h3>
              </div>
              <span className="badge badge-violet text-xs">Keras 3 SavedModel Online</span>
            </div>

            <p className="text-sm text-secondary mb-4 leading-relaxed">
              Synthesizes a novel 64×64 RGB gesture frame conditioned on any of the 76 vocabulary classes. 
              The backend queries the loaded <code>generator_epoch_100.keras</code> model with a 100-dimensional Gaussian noise vector.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Target Sign Class (76 Classes):
                </label>
                <select
                  value={selectedClassForGen}
                  onChange={(e) => setSelectedClassForGen(e.target.value)}
                  className="lab2-select w-full"
                >
                  {classesList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Random Latent Seed:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={generatorSeed}
                    onChange={(e) => setGeneratorSeed(parseInt(e.target.value) || 0)}
                    className="lab2-input w-full font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setGeneratorSeed(Math.floor(Math.random() * 10000))}
                    className="btn btn-secondary text-xs"
                    title="Randomize seed"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGenerateLive}
                  disabled={isGenerating}
                  className="btn btn-primary w-full text-xs font-semibold flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Synthesizing Frame...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={14} />
                      <span>Generate Sign Frame</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {genError && (
              <div className="lab2-alert-error mb-4">
                <AlertTriangle size={15} />
                <span>{genError}</span>
              </div>
            )}

            {generatedResult && (
              <div className="lab2-gen-result-card">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="lab2-generated-img-frame">
                    <img
                      src={generatedResult.image_data_url}
                      alt={`Synthesized sign for ${generatedResult.class_name}`}
                      className="lab2-pixel-preview"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-secondary">Synthesized Output Details:</div>
                    <div className="text-lg font-bold text-primary capitalize">{generatedResult.class_name}</div>
                    <div className="text-xs text-secondary font-mono">
                      Dimension: {generatedResult.image_size || '64 × 64 × 3 RGB'} • Latency: {generatedResult.latency_ms} ms
                    </div>
                    <div className="text-xs text-violet font-mono">
                      Class Index: {generatedResult.class_index} • Seed: {generatedResult.seed ?? generatorSeed}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Static Verified Samples Plot */}
          <div className="lab2-plot-card mb-6">
            <div className="lab2-plot-card-header">
              <div>
                <h3 className="lab2-plot-card-title">Verified Synthetic Sign Sample Grid</h3>
                <p className="text-xs text-secondary">Actual generated samples from the 100-epoch DCGAN training checkpoint across sample ISL words</p>
              </div>
              <button 
                type="button" 
                className="btn-icon-subtle"
                onClick={() => setLightboxPlot({
                  src: '/lab_eval2/plots/synthetic_samples.png',
                  title: 'Verified Synthetic Sign Sample Grid',
                  desc: 'High-resolution sample matrix showing hand contour synthesis across multiple word classes.'
                })}
                title="Click to enlarge"
              >
                <Maximize2 size={15} />
              </button>
            </div>
            <div 
              className="lab2-plot-img-box"
              onClick={() => setLightboxPlot({
                src: '/lab_eval2/plots/synthetic_samples.png',
                title: 'Verified Synthetic Sign Sample Grid',
                desc: 'High-resolution sample matrix showing hand contour synthesis across multiple word classes.'
              })}
            >
              <img 
                src="/lab_eval2/plots/synthetic_samples.png" 
                alt="Synthetic Sign Samples" 
                className="lab2-plot-img"
                loading="lazy"
              />
              <span className="lab2-plot-zoom-hint">Click to enlarge</span>
            </div>
          </div>
        </section>
      )}

      {/* SECTION D: Empirical Evaluation Results */}
      {activeSection === 'results' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-d">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-d" className="lab2-section-title">
                <BarChart2 size={20} className="text-brand" />
                <span>Section D: Empirical Evaluation & Benchmarks</span>
              </h2>
              <p className="lab2-section-subtitle">
                Held-out test set performance (900 real frames), Gaussian noise robustness sweeps, latency, and full 76-class confusion matrices.
              </p>
            </div>
            <span className="badge badge-neutral text-xs">Held-Out Test (900 Real Frames)</span>
          </div>

          {/* Primary Test Comparison Table */}
          <div className="lab2-card mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-primary">Overall Test Set Performance Comparison</h3>
              <span className="text-xs text-secondary">Evaluated on identical 900 authentic frames</span>
            </div>
            <div className="lab2-table-wrap">
              <table className="lab2-table">
                <thead>
                  <tr>
                    <th>Model Architecture</th>
                    <th>Clean Accuracy</th>
                    <th>Macro Precision</th>
                    <th>Macro Recall</th>
                    <th>Macro F1</th>
                    <th>Weighted F1</th>
                    <th>Mean Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {testComp.map((r, i) => (
                    <tr key={i} className={r.Model === 'Baseline CNN' ? 'lab2-table-active-row' : ''}>
                      <td className="font-bold text-primary">{r.Model}</td>
                      <td className="font-mono text-emerald font-bold">{(r.Accuracy * 100).toFixed(2)}%</td>
                      <td className="font-mono text-primary">{(r['Macro Precision'] * 100).toFixed(2)}%</td>
                      <td className="font-mono text-primary">{(r['Macro Recall'] * 100).toFixed(2)}%</td>
                      <td className="font-mono text-violet font-semibold">{(r['Macro F1'] * 100).toFixed(2)}%</td>
                      <td className="font-mono text-secondary">{(r['Weighted F1'] * 100).toFixed(2)}%</td>
                      <td className="font-mono text-cyan">
                        {r.Model === 'Baseline CNN' ? '4.16 ms' : '3.23 ms'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side-by-Side Confusion Matrices Plot */}
          <div className="lab2-plot-card mb-6">
            <div className="lab2-plot-card-header">
              <div>
                <h3 className="lab2-plot-card-title">Full 76-Class Confusion Matrices (Side-by-Side)</h3>
                <p className="text-xs text-secondary">True class index vs. predicted class index across all 76 Indian Sign Language word classes</p>
              </div>
              <button 
                type="button" 
                className="btn-icon-subtle"
                onClick={() => setLightboxPlot({
                  src: '/lab_eval2/plots/confusion_matrices.png',
                  title: '76-Class Side-by-Side Confusion Matrices',
                  desc: 'Compares diagonal concentration: Baseline CNN shows sharper diagonal discrimination across vocabulary.'
                })}
                title="Click to enlarge"
              >
                <Maximize2 size={15} />
              </button>
            </div>
            <div 
              className="lab2-plot-img-box"
              onClick={() => setLightboxPlot({
                src: '/lab_eval2/plots/confusion_matrices.png',
                title: '76-Class Side-by-Side Confusion Matrices',
                desc: 'Compares diagonal concentration: Baseline CNN shows sharper diagonal discrimination across vocabulary.'
              })}
            >
              <img 
                src="/lab_eval2/plots/confusion_matrices.png" 
                alt="Confusion Matrices" 
                className="lab2-plot-img"
                loading="lazy"
              />
              <span className="lab2-plot-zoom-hint">Click to enlarge</span>
            </div>
          </div>

          {/* Grad-CAM and Uncertainty Plots */}
          <div className="lab2-plots-grid mb-6">
            <div className="lab2-plot-card">
              <div className="lab2-plot-card-header">
                <div>
                  <h3 className="lab2-plot-card-title">Grad-CAM Spatial Heatmaps</h3>
                  <p className="text-xs text-secondary">Visualizes convolutional activation gradients on hand contours</p>
                </div>
                <button 
                  type="button" 
                  className="btn-icon-subtle"
                  onClick={() => setLightboxPlot({
                    src: '/lab_eval2/plots/gradcam_explainability.png',
                    title: 'Grad-CAM Explainability Heatmaps',
                    desc: 'Reveals differences in spatial feature activation between real and synthetic trained networks.'
                  })}
                >
                  <Maximize2 size={15} />
                </button>
              </div>
              <div 
                className="lab2-plot-img-box"
                onClick={() => setLightboxPlot({
                  src: '/lab_eval2/plots/gradcam_explainability.png',
                  title: 'Grad-CAM Explainability Heatmaps',
                  desc: 'Reveals differences in spatial feature activation between real and synthetic trained networks.'
                })}
              >
                <img 
                  src="/lab_eval2/plots/gradcam_explainability.png" 
                  alt="Grad-CAM Explainability" 
                  className="lab2-plot-img"
                  loading="lazy"
                />
                <span className="lab2-plot-zoom-hint">Click to enlarge</span>
              </div>
            </div>

            <div className="lab2-plot-card">
              <div className="lab2-plot-card-header">
                <div>
                  <h3 className="lab2-plot-card-title">Prediction Uncertainty Distribution</h3>
                  <p className="text-xs text-secondary">Confidence distribution: DCGAN+CNN exhibits higher uncertainty</p>
                </div>
                <button 
                  type="button" 
                  className="btn-icon-subtle"
                  onClick={() => setLightboxPlot({
                    src: '/lab_eval2/plots/uncertainty_confidence_distribution.png',
                    title: 'Prediction Uncertainty Distribution',
                    desc: 'Quantifies softmax entropy: Baseline exhibits 44.33% low confidence predictions vs 89.56% for DCGAN.'
                  })}
                >
                  <Maximize2 size={15} />
                </button>
              </div>
              <div 
                className="lab2-plot-img-box"
                onClick={() => setLightboxPlot({
                  src: '/lab_eval2/plots/uncertainty_confidence_distribution.png',
                  title: 'Prediction Uncertainty Distribution',
                  desc: 'Quantifies softmax entropy: Baseline exhibits 44.33% low confidence predictions vs 89.56% for DCGAN.'
                })}
              >
                <img 
                  src="/lab_eval2/plots/uncertainty_confidence_distribution.png" 
                  alt="Uncertainty Distribution" 
                  className="lab2-plot-img"
                  loading="lazy"
                />
                <span className="lab2-plot-zoom-hint">Click to enlarge</span>
              </div>
            </div>
          </div>

          {/* Noise Robustness Table */}
          <div className="lab2-card mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-primary">Noise Perturbation Robustness Benchmarks</h3>
              <span className="badge badge-amber text-xs font-mono">Gaussian Perturbation σ ∈ [0.0, 0.2]</span>
            </div>
            <div className="lab2-table-wrap">
              <table className="lab2-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Gaussian Noise (σ)</th>
                    <th>Test Accuracy</th>
                    <th>Macro F1</th>
                    <th>Empirical Retention Behavior</th>
                  </tr>
                </thead>
                <tbody>
                  {robustnessRows.map((r, i) => (
                    <tr key={i}>
                      <td className="font-semibold text-primary">{r.Model}</td>
                      <td className="font-mono text-cyan">{r.Noise_STD.toFixed(2)}</td>
                      <td className="font-mono text-emerald">{(r.Accuracy * 100).toFixed(2)}%</td>
                      <td className="font-mono text-violet">{(r.Macro_F1 * 100).toFixed(2)}%</td>
                      <td className="text-xs text-secondary">
                        {r.Noise_STD === 0.0 && 'Clean baseline benchmark'}
                        {r.Noise_STD === 0.05 && (r.Model.includes('DCGAN') ? 'Minimal degradation (-1.11%)' : 'Moderate drop (-13.11%)')}
                        {r.Noise_STD === 0.1 && (r.Model.includes('DCGAN') ? 'Superior retention: 18.11% vs. 15.33% Baseline' : 'Sharp degradation (-34.56%)')}
                        {r.Noise_STD === 0.2 && (r.Model.includes('DCGAN') ? 'Retained 6.22% accuracy under extreme noise' : 'Collapsed to 4.44%')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latency & Throughput Benchmarks */}
          <div className="lab2-card mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <Clock size={16} className="text-cyan" />
                <span>Inference Latency & Throughput Benchmarks (900 Real Test Images)</span>
              </h3>
              <span className="text-xs text-secondary">Single Frame Batch Mode</span>
            </div>
            <div className="lab2-table-wrap">
              <table className="lab2-table">
                <thead>
                  <tr>
                    <th>Model Architecture</th>
                    <th>Frames Tested</th>
                    <th>Total Benchmark Time</th>
                    <th>Mean Latency</th>
                    <th>Inferred Throughput</th>
                  </tr>
                </thead>
                <tbody>
                  {latencyRows.map((r, i) => (
                    <tr key={i}>
                      <td className="font-semibold text-primary">{r.Model}</td>
                      <td className="font-mono text-secondary">{r.Images_Tested}</td>
                      <td className="font-mono text-cyan">{r.Total_Time_Seconds.toFixed(3)} s</td>
                      <td className="font-mono text-emerald font-bold">{r.Latency_ms_per_image.toFixed(2)} ms / frame</td>
                      <td className="font-mono text-violet font-semibold">{(1000 / r.Latency_ms_per_image).toFixed(1)} fps</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-Class Breakdown Filter Table */}
          {metrics?.per_class_bias && metrics.per_class_bias.length > 0 && (
            <div className="lab2-card">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-primary">
                    Per-Class Classification Report (76 Classes)
                  </h3>
                  <span className="text-xs text-secondary">Search precision, recall, and support per word class</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Filter by class name..."
                  className="lab2-input text-xs w-48"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                />
              </div>

              <div className="lab2-table-wrap max-h-80 overflow-y-auto">
                <table className="lab2-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Class Name</th>
                      <th>Precision</th>
                      <th>Recall</th>
                      <th>F1-Score</th>
                      <th>Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBias.slice(0, 76).map((r, i) => (
                      <tr key={i}>
                        <td className="font-semibold text-xs text-primary">{r.Model}</td>
                        <td className="font-bold text-violet text-xs capitalize">{r.Class}</td>
                        <td className="font-mono text-xs">{(r.Precision * 100).toFixed(1)}%</td>
                        <td className="font-mono text-xs">{(r.Recall * 100).toFixed(1)}%</td>
                        <td className="font-mono text-xs font-bold text-emerald">{(r.F1 * 100).toFixed(1)}%</td>
                        <td className="font-mono text-xs text-secondary">{r.Support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION E: Scientific Findings & Academic Discussion */}
      {activeSection === 'findings' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-e">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-e" className="lab2-section-title">
                <HelpCircle size={20} className="text-brand" />
                <span>Section E: Scientific Findings & Academic Discussion</span>
              </h2>
              <p className="lab2-section-subtitle">
                Rigorous empirical interpretation of the clean accuracy gap versus perturbation resilience trade-off.
              </p>
            </div>
            <span className="badge badge-brand text-xs">Academic Analysis</span>
          </div>

          <div className="lab2-findings-panel mb-6">
            <div className="lab2-finding-card border-brand/30">
              <div className="lab2-finding-header">
                <div className="lab2-mini-icon-badge brand">
                  <TrendingUp size={18} />
                </div>
                <h3 className="lab2-finding-title">1. Clean Accuracy Gap Analysis</h3>
              </div>
              <p className="text-sm text-secondary leading-relaxed mb-3">
                On the held-out test set of 900 authentic real video frames, the unaugmented <strong>Baseline CNN (49.89%)</strong> substantially 
                outperformed the <strong>DCGAN-Augmented CNN (29.00%)</strong> by an absolute margin of 20.89%.
              </p>
              <div className="lab2-finding-note">
                <strong>Underlying Mechanism:</strong> Rescaling sign video frames to 64×64 pixels strips fine-grained finger articulation edges. 
                At this resolution, the DCGAN synthesized blurred hand-shape blobs that confused clean decision boundaries rather than functioning as an invariant regularizer.
              </div>
            </div>

            <div className="lab2-finding-card border-amber/30">
              <div className="lab2-finding-header">
                <div className="lab2-mini-icon-badge amber">
                  <Activity size={18} />
                </div>
                <h3 className="lab2-finding-title">2. Noise Robustness Trade-off</h3>
              </div>
              <p className="text-sm text-secondary leading-relaxed mb-3">
                Under deliberate Gaussian noise injections ($\sigma = 0.10$ and $\sigma = 0.20$), the DCGAN-augmented model demonstrated 
                superior accuracy retention. At $\sigma = 0.10$, the augmented network achieved <strong>18.11% accuracy</strong>, exceeding the baseline's collapsed <strong>15.33%</strong>.
              </p>
              <div className="lab2-finding-note">
                <strong>Empirical Principle:</strong> Generative augmentation forces the convolutional filters to learn broader, noise-tolerant spatial features, 
                proving beneficial in noisy environments despite lower peak clean-data accuracy.
              </div>
            </div>

            <div className="lab2-finding-card border-violet/30">
              <div className="lab2-finding-header">
                <div className="lab2-mini-icon-badge violet">
                  <Cpu size={18} />
                </div>
                <h3 className="lab2-finding-title">3. Recommendations for ISL Recognition</h3>
              </div>
              <p className="text-sm text-secondary leading-relaxed mb-3">
                Static 2D frame augmentation is insufficient for expressive gesture recognition. Modern Indian Sign Language recognition achieves significantly higher performance using:
              </p>
              <ul className="text-xs text-secondary space-y-1.5 list-disc pl-5">
                <li>Higher resolution backbones (112×112) with inverted residual bottlenecks (e.g. MobileNetV2).</li>
                <li>Temporal recurrent or 3D convolutional models (e.g. CNN-LSTM) to capture inter-frame motion trajectories.</li>
                <li>Keypoint landmark extraction (MediaPipe) over raw low-resolution pixel grids.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* SECTION F: Interactive Video Testing & Frame-Level Inference */}
      {activeSection === 'prediction' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-f">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-f" className="lab2-section-title">
                <Video size={20} className="text-brand" />
                <span>Section F: Interactive Video Testing & Frame Inference</span>
              </h2>
              <p className="lab2-section-subtitle">
                Upload an Indian Sign Language video to extract representative gesture frames and evaluate both Baseline CNN and DCGAN-Augmented CNN simultaneously.
              </p>
            </div>
            {/* Mode Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`lab2-pill-btn ${interactiveMode === 'video' ? 'active' : ''}`}
                onClick={() => setInteractiveMode('video')}
              >
                <Film size={13} className="inline mr-1" />
                <span>Video Mode (Primary)</span>
              </button>
              <button
                type="button"
                className={`lab2-pill-btn ${interactiveMode === 'single-frame' ? 'active' : ''}`}
                onClick={() => setInteractiveMode('single-frame')}
              >
                <ImageIcon size={13} className="inline mr-1" />
                <span>Single Frame Mode</span>
              </button>
            </div>
          </div>

          {/* MODE 1: Interactive Video Testing */}
          {interactiveMode === 'video' && (
            <div className="space-y-6">
              {/* Card 1: Video Upload & Frame Sampling Controls */}
              <div className="lab2-card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left Column: Upload & Sampling Settings */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-2">
                      Upload an ISL Gesture Video Clip:
                    </label>
                    <div className="lab2-file-dropzone mb-3">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                        onChange={handleVideoFileChange}
                        className="lab2-file-input"
                        id="lab2-video-upload"
                      />
                      <label htmlFor="lab2-video-upload" className="lab2-file-label">
                        <Video size={26} className="text-brand mb-1" />
                        <span className="text-xs font-semibold text-primary">Click to select an ISL video</span>
                        <span className="text-[11px] text-secondary">Supported: MP4, MOV, AVI, WebM (Max 50MB)</span>
                      </label>
                    </div>

                    {/* Quick Test Sample Helper Button */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={handleLoadSampleVideo}
                        className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5"
                      >
                        <Play size={12} className="text-brand" />
                        <span>Load Sample ISL Video (afternoon / famous)</span>
                      </button>
                      {selectedVideoFile && (
                        <span className="text-xs font-mono text-secondary">
                          {(selectedVideoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      )}
                    </div>

                    {/* Sampling Configuration */}
                    <div className="p-3.5 rounded-lg bg-surface/50 border border-border/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <ListFilter size={14} className="text-brand" />
                          <span>Frame Sampling Strategy</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className={`lab2-pill-btn text-xs py-1 px-2.5 ${samplingStrategy === 'uniform' ? 'active' : ''}`}
                            onClick={() => setSamplingStrategy('uniform')}
                          >
                            Uniform (Matched)
                          </button>
                          <button
                            type="button"
                            className={`lab2-pill-btn text-xs py-1 px-2.5 ${samplingStrategy === 'interval' ? 'active' : ''}`}
                            onClick={() => setSamplingStrategy('interval')}
                          >
                            Fixed Interval
                          </button>
                        </div>
                      </div>

                      {/* Frame Count Limit */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <span className="text-xs text-secondary">Frames to Extract:</span>
                        <div className="flex items-center gap-1">
                          {[3, 5, 8, 10, 15].map((cnt) => (
                            <button
                              key={cnt}
                              type="button"
                              className={`lab2-pill-btn text-xs py-0.5 px-2 font-mono ${maxFramesCount === cnt ? 'active' : ''}`}
                              onClick={() => setMaxFramesCount(cnt)}
                            >
                              {cnt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Extract Frames Action Button */}
                    <button
                      type="button"
                      onClick={handleExtractFrames}
                      disabled={!selectedVideoFile || isExtracting}
                      className="btn btn-primary w-full mt-4 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      {isExtracting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Extracting Frames with OpenCV...</span>
                        </>
                      ) : (
                        <>
                          <Film size={14} />
                          <span>1. Extract Representative Video Frames</span>
                        </>
                      )}
                    </button>

                    {videoError && (
                      <div className="lab2-alert-error mt-3">
                        <AlertTriangle size={15} />
                        <span>{videoError}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Video Preview Player */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-2">
                      Video Playback Preview:
                    </label>
                    <div className="lab2-video-player-wrap">
                      {videoPreviewUrl ? (
                        <>
                          <video
                            src={videoPreviewUrl}
                            controls
                            className="lab2-video-player"
                            onLoadedMetadata={(e) => {
                              const v = e.currentTarget;
                              setVideoDuration(v.duration);
                            }}
                          />
                          <div className="lab2-video-meta-bar">
                            <span className="truncate max-w-[220px] font-medium text-primary">
                              {selectedVideoFile?.name}
                            </span>
                            <span className="font-mono">
                              {videoDuration ? `${videoDuration.toFixed(2)}s` : 'Video Loaded'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-secondary">
                          <Video size={36} className="text-secondary/40 mb-2" />
                          <span className="text-xs">Select or load a video to preview</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-secondary mt-2 flex items-center gap-1">
                      <Info size={12} className="text-brand shrink-0" />
                      <span>Extracted frames are normalized to [-1.0, 1.0] and resized to 64×64 RGB matching the training protocol.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Extracted Frame Gallery (Selection & Preview) */}
              {extractedFrames.length > 0 && (
                <div className="lab2-card">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                        <Film size={16} className="text-brand" />
                        <span>Extracted Video Frames ({extractedFrames.length} Frames Sampled)</span>
                      </h3>
                      <p className="text-xs text-secondary mt-0.5">
                        Select individual frames or evaluate all. Click any frame thumbnail to toggle selection.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllFrames}
                        className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                      >
                        <CheckSquare size={13} />
                        <span>Select All ({extractedFrames.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={clearFrameSelection}
                        className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                      >
                        <Square size={13} />
                        <span>Clear</span>
                      </button>
                      <span className="badge badge-brand text-xs font-mono">
                        {selectedFrameIndices.length} / {extractedFrames.length} Selected
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail Gallery Grid */}
                  <div className="lab2-video-frame-gallery">
                    {extractedFrames.map((frame) => {
                      const isSelected = selectedFrameIndices.includes(frame.frame_index);
                      return (
                        <div
                          key={frame.frame_index}
                          className={`lab2-frame-thumb-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleFrameSelection(frame.frame_index)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by card click
                            className="lab2-frame-checkbox"
                          />
                          <div className="lab2-frame-thumb-img-wrap">
                            <img
                              src={frame.thumbnail}
                              alt={`Frame at ${frame.timestamp_formatted}`}
                              className="lab2-frame-thumb-img"
                            />
                            <span className="lab2-frame-thumb-badge">
                              {frame.timestamp_formatted}
                            </span>
                          </div>
                          <div className="lab2-frame-footer-label">
                            <span>#{frame.frame_index + 1}</span>
                            <span className="text-[10px] text-secondary font-mono">f_{frame.video_frame_num}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dual Inference Action Trigger */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between flex-wrap gap-3">
                    <div className="text-xs text-secondary">
                      Ready to execute simultaneous inference through <strong>Baseline CNN</strong> and <strong>DCGAN-Augmented CNN</strong>.
                    </div>
                    <button
                      type="button"
                      onClick={handleRunDualVideoInference}
                      disabled={selectedFrameIndices.length === 0 || isDualInferring}
                      className="btn btn-primary text-xs font-semibold flex items-center gap-2 py-2 px-5"
                    >
                      {isDualInferring ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Running Dual Frame Inference...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>2. Run Dual Inference on {selectedFrameIndices.length} Selected Frames</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Card 3: Dual Model Frame-by-Frame Comparison & Aggregation */}
              {dualInferResult && (
                <div className="space-y-6">
                  {/* Aggregated Consensus Summary Card */}
                  <div className="lab2-card">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                          <BarChart2 size={16} className="text-emerald" />
                          <span>Frame-Level Dual Inference Summary ({dualInferResult.total_frames_evaluated} Frames Analyzed)</span>
                        </h3>
                        <span className="text-xs text-secondary">
                          Empirical agreement and classification distribution across gesture frames
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportResults}
                        className="btn btn-secondary text-xs flex items-center gap-1.5 py-1 px-3"
                      >
                        <Download size={13} />
                        <span>Export Run JSON</span>
                      </button>
                    </div>

                    {/* Consensus Comparison Panels */}
                    <div className="lab2-consensus-panel">
                      {/* Baseline Consensus */}
                      <div className="lab2-consensus-box border-brand/30 bg-brand/5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="badge badge-brand text-xs">Baseline CNN (Real Data Only)</span>
                          <span className="text-xs font-mono text-secondary">
                            {dualInferResult.latencies.per_frame_baseline_ms} ms/frame
                          </span>
                        </div>
                        <div className="text-xs text-secondary mb-1">Majority Gesture Consensus:</div>
                        <div className="text-xl font-bold text-primary capitalize mb-2">
                          {dualInferResult.aggregated_summary.baseline_consensus}
                        </div>
                        <div className="text-xs text-secondary font-medium">
                          Vote Distribution:
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {Object.entries(dualInferResult.aggregated_summary.baseline_distribution).map(([cls, cnt]) => (
                            <span key={cls} className="badge badge-neutral text-xs capitalize">
                              {cls}: <strong>{cnt}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Augmented Consensus */}
                      <div className="lab2-consensus-box border-violet/30 bg-violet/5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="badge badge-violet text-xs">DCGAN-Augmented CNN (50% Fake)</span>
                          <span className="text-xs font-mono text-secondary">
                            {dualInferResult.latencies.per_frame_augmented_ms} ms/frame
                          </span>
                        </div>
                        <div className="text-xs text-secondary mb-1">Majority Gesture Consensus:</div>
                        <div className="text-xl font-bold text-primary capitalize mb-2">
                          {dualInferResult.aggregated_summary.augmented_consensus}
                        </div>
                        <div className="text-xs text-secondary font-medium">
                          Vote Distribution:
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {Object.entries(dualInferResult.aggregated_summary.augmented_distribution).map(([cls, cnt]) => (
                            <span key={cls} className="badge badge-neutral text-xs capitalize">
                              {cls}: <strong>{cnt}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Agreement Metric Box */}
                      <div className="lab2-consensus-box border-border/40">
                        <div className="text-xs font-bold text-primary mb-1">Dual-Model Agreement</div>
                        <div className="text-3xl font-mono font-bold text-brand mb-1">
                          {dualInferResult.agreement_rate_percent}%
                        </div>
                        <div className="text-xs text-secondary mb-2">
                          {dualInferResult.agreement_count} of {dualInferResult.total_frames_evaluated} frames matched exactly
                        </div>
                        <div>
                          {dualInferResult.aggregated_summary.consensus_agreement ? (
                            <span className="lab2-match-pill">
                              <Check size={11} /> Consensus Matches
                            </span>
                          ) : (
                            <span className="lab2-diverge-pill">
                              <AlertTriangle size={11} /> Models Diverged
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Scientific Disclaimer Alert */}
                    <div className="mt-4 p-3 rounded-lg bg-surface/50 border border-brand/20 flex items-start gap-2.5">
                      <Info size={16} className="text-brand shrink-0 mt-0.5" />
                      <p className="text-xs text-secondary leading-relaxed">
                        <strong>Scientific Note:</strong> {dualInferResult.aggregated_summary.disclaimer}
                      </p>
                    </div>
                  </div>

                  {/* Frame-by-Frame Comparison Table */}
                  <div className="lab2-card">
                    <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                      <Table size={16} className="text-brand" />
                      <span>Frame-by-Frame Detailed Predictions & Probabilities</span>
                    </h3>

                    <div className="lab2-table-wrap">
                      <table className="lab2-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Frame Thumbnail</th>
                            <th>Timestamp</th>
                            <th>Baseline CNN (49.89%)</th>
                            <th>DCGAN-Augmented CNN (29.00%)</th>
                            <th>Agreement</th>
                            <th>Top-3 Probability Distributions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dualInferResult.frame_results.map((r) => (
                            <tr key={r.frame_index}>
                              <td className="font-mono text-xs text-secondary">#{r.frame_index + 1}</td>
                              <td>
                                <div className="w-12 h-12 rounded overflow-hidden bg-black border border-border/40">
                                  <img src={r.thumbnail} alt={`Frame ${r.timestamp_formatted}`} className="w-full h-full object-cover" />
                                </div>
                              </td>
                              <td className="font-mono text-xs text-secondary">{r.timestamp_formatted}</td>
                              <td>
                                <div className="font-bold text-xs text-primary capitalize">
                                  {r.baseline.predicted_class}
                                </div>
                                <div className="text-[11px] text-emerald font-mono">
                                  {(r.baseline.confidence * 100).toFixed(1)}%
                                </div>
                              </td>
                              <td>
                                <div className="font-bold text-xs text-primary capitalize">
                                  {r.gan_augmented.predicted_class}
                                </div>
                                <div className="text-[11px] text-amber font-mono">
                                  {(r.gan_augmented.confidence * 100).toFixed(1)}%
                                </div>
                              </td>
                              <td>
                                {r.agreement ? (
                                  <span className="lab2-match-pill">
                                    <Check size={10} /> Match
                                  </span>
                                ) : (
                                  <span className="lab2-diverge-pill">
                                    <AlertTriangle size={10} /> Diverge
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="space-y-1 text-[11px]">
                                  <div className="text-brand font-medium">
                                    Base Top 3:{' '}
                                    {r.baseline.top3.map(t => `${t.class_name} (${(t.confidence*100).toFixed(0)}%)`).join(', ')}
                                  </div>
                                  <div className="text-violet font-medium">
                                    Aug Top 3:{' '}
                                    {r.gan_augmented.top3.map(t => `${t.class_name} (${(t.confidence*100).toFixed(0)}%)`).join(', ')}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: Single Frame Upload Mode (Preserved from original implementation) */}
          {interactiveMode === 'single-frame' && (
            <div className="lab2-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-2">
                    Select an Isolated Sign Image Frame:
                  </label>
                  <div className="lab2-file-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="lab2-file-input"
                      id="lab2-file-upload"
                    />
                    <label htmlFor="lab2-file-upload" className="lab2-file-label">
                      <Upload size={24} className="text-brand mb-1" />
                      <span className="text-xs font-semibold text-primary">Click to select an image frame</span>
                      <span className="text-[11px] text-secondary">Supported: PNG, JPEG (auto-cropped to 64×64 RGB)</span>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="mt-3 flex items-center justify-between text-xs p-2 rounded bg-surface/50 border border-border/40">
                      <span className="truncate max-w-[200px] text-primary">{selectedFile.name}</span>
                      <span className="text-secondary font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleRunPrediction}
                    disabled={!selectedFile || isPredicting}
                    className="btn btn-primary w-full mt-4 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    {isPredicting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Running Dual Inference...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Classify Single Frame</span>
                      </>
                    )}
                  </button>

                  {predictError && (
                    <div className="lab2-alert-error mt-3">
                      <AlertTriangle size={15} />
                      <span>{predictError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-2">
                    Input Frame Preprocessing Preview:
                  </label>
                  <div className="lab2-preview-box">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Sign Frame Preview" 
                        className="lab2-preview-img"
                      />
                    ) : (
                      <div className="lab2-preview-placeholder">
                        <ImageIcon size={32} className="text-secondary/40 mb-2" />
                        <span className="text-xs text-secondary">No frame selected yet</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-secondary mt-2 flex items-center gap-1">
                    <Info size={12} className="text-brand" />
                    <span>Preprocessing: Bilinear resize to 64×64 RGB with [-1.0, 1.0] normalization.</span>
                  </div>
                </div>
              </div>

              {predictionResult && (
                <div className="mt-6 pt-6 border-t border-border/40">
                  <h3 className="text-sm font-bold text-primary mb-3">Model Prediction Outputs:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {predictionResult.baseline && (
                      <div className="lab2-card border-brand/30 bg-brand/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="badge badge-brand text-xs">Baseline CNN (Real Only)</span>
                          <span className="text-xs font-mono text-secondary">
                            {predictionResult.baseline.latency_ms} ms
                          </span>
                        </div>
                        <div className="text-xl font-bold text-primary mb-1 capitalize">
                          {predictionResult.baseline.predicted_class}
                        </div>
                        <div className="text-xs text-emerald font-semibold mb-3">
                          Confidence: {(predictionResult.baseline.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-secondary font-semibold mb-1">Top 5 Softmax Probabilities:</div>
                        <div className="space-y-1">
                          {predictionResult.baseline.top5.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                              <span className="text-primary capitalize">{p.class_name}</span>
                              <span className="font-mono text-secondary">{(p.confidence * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {predictionResult.gan_augmented && (
                      <div className="lab2-card border-violet/30 bg-violet/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="badge badge-violet text-xs">DCGAN + CNN (Augmented)</span>
                          <span className="text-xs font-mono text-secondary">
                            {predictionResult.gan_augmented.latency_ms} ms
                          </span>
                        </div>
                        <div className="text-xl font-bold text-primary mb-1 capitalize">
                          {predictionResult.gan_augmented.predicted_class}
                        </div>
                        <div className="text-xs text-amber font-semibold mb-3">
                          Confidence: {(predictionResult.gan_augmented.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-secondary font-semibold mb-1">Top 5 Softmax Probabilities:</div>
                        <div className="space-y-1">
                          {predictionResult.gan_augmented.top5.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                              <span className="text-primary capitalize">{p.class_name}</span>
                              <span className="font-mono text-secondary">{(p.confidence * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* SECTION G: Cross-Model Comparison Matrix */}
      {activeSection === 'comparison' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-g">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-g" className="lab2-section-title">
                <Table size={20} className="text-brand" />
                <span>Section G: Tri-Model Lab Eval 2 Comparison Matrix</span>
              </h2>
              <p className="lab2-section-subtitle">
                Systematic overview of all three planned generative architectures in Lab Evaluation 2.
              </p>
            </div>
            <span className="badge badge-brand text-xs">Comparative Study</span>
          </div>

          <div className="lab2-card mb-6">
            <div className="lab2-table-wrap">
              <table className="lab2-table">
                <thead>
                  <tr>
                    <th>Experiment Architecture</th>
                    <th>Model Category</th>
                    <th>Generative Method</th>
                    <th>Baseline Accuracy</th>
                    <th>Augmented Accuracy</th>
                    <th>Integration Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="lab2-table-active-row">
                    <td className="font-bold text-primary">1. GAN + Custom 2D CNN</td>
                    <td>Static Spatial 2D CNN</td>
                    <td>Class-Conditioned DCGAN (100 Epochs)</td>
                    <td className="font-mono text-emerald font-bold">49.89%</td>
                    <td className="font-mono text-amber font-bold">29.00%</td>
                    <td><span className="badge badge-success">Verified Run</span></td>
                    <td>
                      <span className="text-xs text-secondary font-semibold">Active Tab</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold text-secondary">2. GAN + CNN-LSTM</td>
                    <td>Spatio-Temporal Recurrent</td>
                    <td>Synthetic sequence augmentation</td>
                    <td className="font-mono text-secondary">—</td>
                    <td className="font-mono text-secondary">—</td>
                    <td><span className="badge badge-amber">Awaiting Artifacts</span></td>
                    <td>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm text-xs"
                          onClick={() => onNavigateToTab('gan-cnn-lstm')}
                        >
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold text-secondary">3. GAN + MobileNetV2</td>
                    <td>Inverted Residual Backbone</td>
                    <td>Class-conditioned frame synthesis</td>
                    <td className="font-mono text-secondary">—</td>
                    <td className="font-mono text-secondary">—</td>
                    <td><span className="badge badge-amber">Awaiting Artifacts</span></td>
                    <td>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm text-xs"
                          onClick={() => onNavigateToTab('gan-mobilenetv2')}
                        >
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
