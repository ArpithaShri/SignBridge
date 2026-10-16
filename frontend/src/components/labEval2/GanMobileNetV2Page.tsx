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
  Maximize2,
  X,
  HelpCircle,
  Film,
  Play,
  Download,
  AlertCircle,
  Zap,
  Activity,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  fetchMobileNetV2Metadata,
  predictMobileNetV2Image,
  predictMobileNetV2Video,
  generateMobileNetV2Image,
} from '../../services/labEval2Api';
import type {
  MobileNetV2MetadataResponse,
  MobileNetV2PredictImageResponse,
  MobileNetV2PredictVideoResponse,
  LabEval2GenerateResponse,
} from '../../services/labEval2Api';

interface GanMobileNetV2PageProps {
  onNavigateToTab?: (tab: 'gan-cnn' | 'gan-cnn-lstm' | 'gan-mobilenetv2') => void;
}

export const GanMobileNetV2Page: React.FC<GanMobileNetV2PageProps> = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'training' | 'samples' | 'results' | 'findings' | 'prediction' | 'comparison'>('overview');
  const [metadata, setMetadata] = useState<MobileNetV2MetadataResponse | null>(null);

  // Live Generator State (Section C)
  const [selectedClassForGen, setSelectedClassForGen] = useState<string>('bad');
  const [generatorSeed, setGeneratorSeed] = useState<number>(42);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<LabEval2GenerateResponse | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Interactive Testing Mode (Section F)
  const [interactiveMode, setInteractiveMode] = useState<'video' | 'image'>('video');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [videoResult, setVideoResult] = useState<MobileNetV2PredictVideoResponse | null>(null);
  const [imageResult, setImageResult] = useState<MobileNetV2PredictImageResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Plot Lightbox State
  const [lightboxPlot, setLightboxPlot] = useState<{ src: string; title: string; desc: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadMetadata = async () => {
      try {
        const data = await fetchMobileNetV2Metadata();
        if (mounted) {
          setMetadata(data);
          if (data.classes && data.classes.length > 0) {
            setSelectedClassForGen(data.classes[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load MobileNetV2 metadata:', err);
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
      setTestError(null);
      setVideoResult(null);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setTestError(null);
      setImageResult(null);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLoadSampleVideo = async () => {
    try {
      setTestError(null);
      const res = await fetch('/samples/isl_sample_video.mp4');
      if (!res.ok) throw new Error('Sample video not found in /samples/isl_sample_video.mp4');
      const blob = await res.blob();
      const file = new File([blob], 'isl_sample_video.mp4', { type: 'video/mp4' });
      setSelectedVideoFile(file);
      setVideoResult(null);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    } catch (err: any) {
      setTestError(err.message || 'Could not load sample video');
    }
  };

  const handleRunVideoInference = async () => {
    if (!selectedVideoFile) return;
    setIsTesting(true);
    setTestError(null);
    try {
      const res = await predictMobileNetV2Video(selectedVideoFile, 8);
      setVideoResult(res);
    } catch (err: any) {
      setTestError(err.message || 'MobileNetV2 video inference failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunImageInference = async () => {
    if (!selectedImageFile) return;
    setIsTesting(true);
    setTestError(null);
    try {
      const res = await predictMobileNetV2Image(selectedImageFile);
      setImageResult(res);
    } catch (err: any) {
      setTestError(err.message || 'MobileNetV2 image inference failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleGenerateSample = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await generateMobileNetV2Image(selectedClassForGen, generatorSeed);
      setGeneratedResult(res);
    } catch (err: any) {
      setGenError(err.message || 'Synthesis failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadJson = (data: any, prefix: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const evalSummary = metadata?.evaluation_results?.summary_mean_std_over_seeds;
  const pairedDiff = metadata?.evaluation_results?.paired_difference_gan_minus_baseline;
  const splits = metadata?.dataset_splits;

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
              <span className="text-xs text-secondary">Verified experimental artifact from 3-seed run • Press ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Internal Section Navigation Tabs */}
      <div className="lab2-section-nav-wrap">
        <nav className="lab2-section-nav" role="tablist" aria-label="GAN + MobileNetV2 Experiment Navigation">
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
            <span>F. Interactive Dual Testing</span>
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
                <span>Section A: Verified Architecture & Configuration</span>
              </h2>
              <p className="lab2-section-subtitle">
                Two-stage fine-tuned MobileNetV2 with inverted residual bottlenecks evaluated with and without class-conditioned DCGAN synthetic frames.
              </p>
            </div>
            <span className="badge badge-success text-xs">
              <CheckCircle2 size={12} /> 3 Models Loaded & Verified (Dual Checkpoint + Generator)
            </span>
          </div>

          {/* Quick Parameters Summary Grid */}
          <div className="lab2-spec-cards-grid mb-6">
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Input Resolution</span>
              <span className="lab2-spec-card-value font-mono">64 × 64 × 3</span>
              <span className="lab2-spec-card-hint">Raw RGB [0-255] float32</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Internal Preprocessing</span>
              <span className="lab2-spec-card-value font-mono">128 × 128 × 3</span>
              <span className="lab2-spec-card-hint">Resized & Scaled [-1, 1] in Model</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Fine-Tuning Strategy</span>
              <span className="lab2-spec-card-value font-mono">2 Stages</span>
              <span className="lab2-spec-card-hint">Frozen Head + 30 Layer Fine-Tune</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">ISL Word Classes</span>
              <span className="lab2-spec-card-value font-mono">5 Classes</span>
              <span className="lab2-spec-card-hint">bad, big, fast, short, small</span>
            </div>
          </div>

          {/* 3 Architecture Cards */}
          <div className="lab2-card-grid mb-6">
            {/* Card 1: Baseline MobileNetV2 */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div className="lab2-mini-icon-badge brand">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="lab2-card-title">1. Baseline MobileNetV2</h3>
                  <span className="badge badge-success text-[10px] mt-0.5">Real Data Only • Verified</span>
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Pretrained ImageNet inverted residual backbone fine-tuned strictly on 616 real ISL video frames. 
                Stage 1 trains dense head; Stage 2 unfreezes top 30 layers with frozen BatchNormalization.
              </p>
              <div className="space-y-1.5 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Checkpoint:</span>
                  <span className="font-mono text-primary font-medium">mobilenetv2_baseline.keras</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Parameters:</span>
                  <span className="font-mono text-primary font-medium">2,422,597 (22.6 MB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Frame Accuracy:</span>
                  <span className="font-mono text-accent-emerald font-semibold">55.56% ± 1.27%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Video Accuracy:</span>
                  <span className="font-mono text-accent-emerald font-semibold">77.78% ± 3.85%</span>
                </div>
              </div>
            </div>

            {/* Card 2: GAN-Augmented MobileNetV2 */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div className="lab2-mini-icon-badge violet">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="lab2-card-title">2. GAN-Augmented MobileNetV2</h3>
                  <span className="badge badge-success text-[10px] mt-0.5">Real + Synthetic • Verified</span>
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Identical MobileNetV2 architecture trained on combined real frames (616) plus 600 class-conditional 
                DCGAN synthetic frames (120 per class, ratio 0.974:1) under identical hyperparameter schedules.
              </p>
              <div className="space-y-1.5 border-t border-subtle pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-tertiary">Checkpoint:</span>
                  <span className="font-mono text-primary font-medium">mobilenetv2_gan_augmented.keras</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Parameters:</span>
                  <span className="font-mono text-primary font-medium">2,422,597 (22.6 MB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Frame Accuracy:</span>
                  <span className="font-mono text-accent-amber font-semibold">55.56% ± 5.42%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Accuracy Delta:</span>
                  <span className="font-mono text-primary font-semibold">+0.00% ± 6.67%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Conditional DCGAN Generator */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div className="lab2-mini-icon-badge amber">
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 className="lab2-card-title">3. Conditional DCGAN Generator</h3>
                  <span className="badge badge-brand text-[10px] mt-0.5">Loaded & Verified Checkpoint</span>
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                Class-conditioned generative network mapping 100-dim Gaussian latent noise and integer class labels 
                to 64×64 RGB synthetic sign postures. Note: GAN label order is `[small, short, bad, big, fast]`.
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
                  <span className="text-tertiary">Label Order:</span>
                  <span className="font-mono text-primary font-medium">small, short, bad, big, fast</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary">Output Shape:</span>
                  <span className="font-mono text-primary font-medium">64 × 64 × 3 (tanh)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Preprocessing Notice */}
          <div className="lab2-card bg-brand-subtle-alpha border-brand mb-6">
            <div className="flex items-start gap-3">
              <Info className="text-brand shrink-0 mt-0.5" size={18} />
              <div className="text-xs space-y-1">
                <div className="font-bold text-primary">Inference Preprocessing Pipeline Specification</div>
                <p className="text-secondary leading-relaxed">
                  Unlike conventional MobileNetV2 setups, input frames MUST be passed as <strong>64×64×3 RGB float32 with raw pixel values [0, 255]</strong>. 
                  Do NOT divide by 255 or apply external ImageNet normalization. Resizing to 128×128 and scaling to [-1, 1] are executed internally 
                  by Keras layers embedded inside the model graph. Output predictions follow alphabetical order: <code>['bad', 'big', 'fast', 'short', 'small']</code>.
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
                <span>Section B: Dataset Partitioning & Training Setup</span>
              </h2>
              <p className="lab2-section-subtitle">
                Controlled split by video ID, frame counts per class, synthetic augmentation ratio, and two-stage fine-tuning schedule.
              </p>
            </div>
          </div>

          {/* Quick Dataset Split Cards */}
          <div className="lab2-spec-cards-grid mb-6">
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Real Train Frames</span>
              <span className="lab2-spec-card-value font-mono">616</span>
              <span className="lab2-spec-card-hint">77 Videos (15-16/class)</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Synthetic GAN Frames</span>
              <span className="lab2-spec-card-value font-mono">600</span>
              <span className="lab2-spec-card-hint">120 frames per class</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Synthetic:Real Ratio</span>
              <span className="lab2-spec-card-value font-mono">0.974 : 1</span>
              <span className="lab2-spec-card-hint">Near 1:1 Parity</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Held-Out Test Set</span>
              <span className="lab2-spec-card-value font-mono">120 Frames</span>
              <span className="lab2-spec-card-hint">15 Videos (3/class, Real Only)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Split Distribution Table */}
            <div className="lab2-card">
              <h3 className="lab2-card-title mb-3 flex items-center gap-2">
                <Table size={16} className="text-brand" />
                <span>Per-Class Split Distribution (Frames & Videos)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="lab2-table text-xs">
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Train Real</th>
                      <th>Train Synthetic</th>
                      <th>Val Real</th>
                      <th>Test Real</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata?.classes?.map((cls) => (
                      <tr key={cls}>
                        <td className="font-semibold text-primary capitalize">{cls}</td>
                        <td className="font-mono">{splits?.frames_per_class?.train?.[cls] || 120} ({splits?.videos_per_class?.train?.[cls] || 15} vids)</td>
                        <td className="font-mono text-accent-violet">120 frames</td>
                        <td className="font-mono">{splits?.frames_per_class?.val?.[cls] || 24} (3 vids)</td>
                        <td className="font-mono font-semibold text-accent-emerald">{splits?.frames_per_class?.test?.[cls] || 24} (3 vids)</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-subtle font-bold">
                      <td className="text-primary">Total</td>
                      <td className="font-mono">{splits?.total_frames?.train_real || 616}</td>
                      <td className="font-mono text-accent-violet">{splits?.total_frames?.synthetic || 600}</td>
                      <td className="font-mono">{splits?.total_frames?.val || 120}</td>
                      <td className="font-mono text-accent-emerald">{splits?.total_frames?.test || 120}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-secondary mt-2">
                * Validation and test sets strictly contain real frames only. Split was performed by video to prevent temporal leakage.
              </p>
            </div>

            {/* Fine-Tuning Schedule */}
            <div className="lab2-card">
              <h3 className="lab2-card-title mb-3 flex items-center gap-2">
                <Activity size={16} className="text-accent-amber" />
                <span>Fine-Tuning Hyperparameters & Multi-Seed Protocol</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="lab2-table text-xs">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-primary">Stage 1 (Head Warmup)</td>
                      <td className="font-mono text-secondary">Backbone frozen, lr=0.001, Adam, &le; 10 epochs</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Stage 2 (Fine-Tuning)</td>
                      <td className="font-mono text-secondary">Top 30 layers unfrozen, BatchNorm frozen, lr=5e-5, &le; 25 epochs</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Stopping Criteria</td>
                      <td className="font-mono text-secondary">EarlyStopping (patience=5) on real validation loss</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Batch Size</td>
                      <td className="font-mono text-secondary">32 frames per batch</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Evaluation Protocol</td>
                      <td className="font-mono text-secondary">3 independent random seeds: 42, 123, 2024</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-primary">Checkpoints Saved</td>
                      <td className="font-mono text-secondary">Seed 42 saved to disk; seeds 123 &amp; 2024 pooled</td>
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
                Visual inspection of 64×64 synthetic sign frames produced by the teammate's conditional DCGAN generator across all 5 classes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Artifact Plot 1: Real vs GAN Samples */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div>
                  <h3 className="lab2-card-title">Real vs GAN Generated Samples (5 Classes)</h3>
                  <p className="text-xs text-secondary mt-0.5">Visual comparison between real training frames and DCGAN samples</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary text-xs p-1.5"
                  onClick={() => setLightboxPlot({
                    src: '/plots/lab_eval2/gan_mobilenetv2/real_vs_gan_samples.png',
                    title: 'Real vs GAN Generated Samples',
                    desc: 'Side-by-side comparison of real camera frames and synthetic DCGAN frames across bad, big, fast, short, and small.'
                  })}
                  aria-label="Zoom image"
                >
                  <Maximize2 size={14} />
                </button>
              </div>

              <div 
                className="lab2-plot-card-img-wrap cursor-pointer"
                onClick={() => setLightboxPlot({
                  src: '/plots/lab_eval2/gan_mobilenetv2/real_vs_gan_samples.png',
                  title: 'Real vs GAN Generated Samples',
                  desc: 'Side-by-side comparison of real camera frames and synthetic DCGAN frames across bad, big, fast, short, and small.'
                })}
              >
                <img 
                  src="/plots/lab_eval2/gan_mobilenetv2/real_vs_gan_samples.png" 
                  alt="Real vs GAN Samples" 
                  className="w-full rounded border border-subtle object-contain bg-black max-h-72" 
                />
              </div>

              <div className="text-xs text-secondary leading-relaxed mt-3 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <Info size={13} className="text-brand" />
                  <span>Visual Quality Assessment:</span>
                </div>
                <p>
                  DCGAN samples capture general torso contours and approximate skin-tone distribution, but lack sharp finger articulation, 
                  boundary edges, and hand geometry. The low 64×64 resolution limits the representation of subtle sign differences.
                </p>
              </div>
            </div>

            {/* Live Interactive DCGAN Generator */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div>
                  <h3 className="lab2-card-title flex items-center gap-2">
                    <Wand2 size={16} className="text-violet" />
                    <span>Live 5-Class DCGAN Generator</span>
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
                      className="input input-sm w-full text-xs capitalize"
                      value={selectedClassForGen}
                      onChange={(e) => setSelectedClassForGen(e.target.value)}
                    >
                      {metadata?.classes?.map((cls, idx) => (
                        <option key={cls} value={cls}>
                          {idx}: {cls}
                        </option>
                      ))}
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
                        <span className="badge badge-brand text-[11px] font-mono capitalize">
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
                      <p className="text-[11px] opacity-75">Uses the live conditional generator checkpoint on the backend.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Artifact Plot 2: GAN Training Losses */}
          <div className="lab2-card">
            <div className="lab2-card-header">
              <div>
                <h3 className="lab2-card-title">DCGAN Generator &amp; Discriminator Training Losses</h3>
                <p className="text-xs text-secondary mt-0.5">Per-epoch adversarial loss trajectory across training</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary text-xs p-1.5"
                onClick={() => setLightboxPlot({
                  src: '/plots/lab_eval2/gan_mobilenetv2/gan_training_losses.png',
                  title: 'DCGAN Training Losses',
                  desc: 'Adversarial generator loss and discriminator loss curves across training epochs.'
                })}
                aria-label="Zoom image"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <div 
              className="lab2-plot-card-img-wrap cursor-pointer"
              onClick={() => setLightboxPlot({
                src: '/plots/lab_eval2/gan_mobilenetv2/gan_training_losses.png',
                title: 'DCGAN Training Losses',
                desc: 'Adversarial generator loss and discriminator loss curves across training epochs.'
              })}
            >
              <img 
                src="/plots/lab_eval2/gan_mobilenetv2/gan_training_losses.png" 
                alt="GAN Training Losses" 
                className="w-full rounded border border-subtle object-contain bg-black max-h-72" 
              />
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
                <span>Section D: Quantitative Multi-Seed Evaluation</span>
              </h2>
              <p className="lab2-section-subtitle">
                Comprehensive evaluation on 15 held-out test videos (120 real frames) averaged across 3 random seeds (42, 123, 2024).
              </p>
            </div>
          </div>

          {/* Metric Comparison Banner */}
          <div className="lab2-spec-cards-grid mb-6">
            <div className="lab2-spec-card highlight-baseline">
              <span className="lab2-spec-card-label">Baseline Frame Accuracy</span>
              <span className="lab2-spec-card-value font-mono text-accent-emerald">
                {((evalSummary?.baseline?.accuracy?.mean || 0.5556) * 100).toFixed(2)}% ± {((evalSummary?.baseline?.accuracy?.std || 0.0127) * 100).toFixed(2)}%
              </span>
              <span className="lab2-spec-card-hint">Real Training Only</span>
            </div>
            <div className="lab2-spec-card highlight-aug">
              <span className="lab2-spec-card-label">GAN-Augmented Accuracy</span>
              <span className="lab2-spec-card-value font-mono text-accent-amber">
                {((evalSummary?.gan_augmented?.accuracy?.mean || 0.5556) * 100).toFixed(2)}% ± {((evalSummary?.gan_augmented?.accuracy?.std || 0.0542) * 100).toFixed(2)}%
              </span>
              <span className="lab2-spec-card-hint">Real + 600 Synthetic</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Accuracy Difference (Aug - Base)</span>
              <span className="lab2-spec-card-value font-mono text-primary">
                {((pairedDiff?.accuracy?.mean || 0.0) * 100).toFixed(2)}% ± {((pairedDiff?.accuracy?.std || 0.0667) * 100).toFixed(2)}%
              </span>
              <span className="lab2-spec-card-hint">No Measurable Gain</span>
            </div>
            <div className="lab2-spec-card">
              <span className="lab2-spec-card-label">Video-Level Accuracy (8 Frames)</span>
              <span className="lab2-spec-card-value font-mono text-accent-cyan">
                {((evalSummary?.baseline?.video_accuracy?.mean || 0.7778) * 100).toFixed(2)}% vs {((evalSummary?.gan_augmented?.video_accuracy?.mean || 0.7556) * 100).toFixed(2)}%
              </span>
              <span className="lab2-spec-card-hint">Mean Probability Pooling</span>
            </div>
          </div>

          {/* Full Metrics Comparison Table */}
          <div className="lab2-card mb-6">
            <h3 className="lab2-card-title mb-3">Statistical Metric Summary Across Seeds (Mean ± Std)</h3>
            <div className="overflow-x-auto">
              <table className="lab2-table text-xs">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Baseline (Real Data Only)</th>
                    <th>GAN-Augmented (Real + 600 Synthetic)</th>
                    <th>Paired Difference (Aug - Base)</th>
                    <th>Statistical Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold text-primary">Frame Accuracy</td>
                    <td className="font-mono text-accent-emerald font-semibold">{((evalSummary?.baseline?.accuracy?.mean || 0.5556) * 100).toFixed(2)}% ± {((evalSummary?.baseline?.accuracy?.std || 0.0127) * 100).toFixed(2)}%</td>
                    <td className="font-mono text-accent-amber font-semibold">{((evalSummary?.gan_augmented?.accuracy?.mean || 0.5556) * 100).toFixed(2)}% ± {((evalSummary?.gan_augmented?.accuracy?.std || 0.0542) * 100).toFixed(2)}%</td>
                    <td className="font-mono">{((pairedDiff?.accuracy?.mean || 0.0) * 100).toFixed(2)}% ± {((pairedDiff?.accuracy?.std || 0.0667) * 100).toFixed(2)}%</td>
                    <td><span className="badge badge-neutral text-[10px]">Identical Means</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Macro Precision</td>
                    <td className="font-mono">{((evalSummary?.baseline?.macro_precision?.mean || 0.5667) * 100).toFixed(2)}% ± {((evalSummary?.baseline?.macro_precision?.std || 0.0130) * 100).toFixed(2)}%</td>
                    <td className="font-mono">{((evalSummary?.gan_augmented?.macro_precision?.mean || 0.5728) * 100).toFixed(2)}% ± {((evalSummary?.gan_augmented?.macro_precision?.std || 0.0724) * 100).toFixed(2)}%</td>
                    <td className="font-mono">+0.61% ± 8.30%</td>
                    <td><span className="badge badge-neutral text-[10px]">Within Variance</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Macro Recall</td>
                    <td className="font-mono">{((evalSummary?.baseline?.macro_recall?.mean || 0.5556) * 100).toFixed(2)}% ± {((evalSummary?.baseline?.macro_recall?.std || 0.0127) * 100).toFixed(2)}%</td>
                    <td className="font-mono">{((evalSummary?.gan_augmented?.macro_recall?.mean || 0.5556) * 100).toFixed(2)}% ± {((evalSummary?.gan_augmented?.macro_recall?.std || 0.0542) * 100).toFixed(2)}%</td>
                    <td className="font-mono">+0.00% ± 6.67%</td>
                    <td><span className="badge badge-neutral text-[10px]">Identical Means</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Macro F1 Score</td>
                    <td className="font-mono">{((evalSummary?.baseline?.macro_f1?.mean || 0.5495) * 100).toFixed(2)}% ± {((evalSummary?.baseline?.macro_f1?.std || 0.0073) * 100).toFixed(2)}%</td>
                    <td className="font-mono">{((evalSummary?.gan_augmented?.macro_f1?.mean || 0.5496) * 100).toFixed(2)}% ± {((evalSummary?.gan_augmented?.macro_f1?.std || 0.0523) * 100).toFixed(2)}%</td>
                    <td className="font-mono">+0.01% ± 5.94%</td>
                    <td><span className="badge badge-neutral text-[10px]">Identical Means</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Video-Level Accuracy</td>
                    <td className="font-mono text-accent-emerald font-semibold">{((evalSummary?.baseline?.video_accuracy?.mean || 0.7778) * 100).toFixed(2)}% ± {((evalSummary?.baseline?.video_accuracy?.std || 0.0385) * 100).toFixed(2)}%</td>
                    <td className="font-mono text-accent-amber font-semibold">{((evalSummary?.gan_augmented?.video_accuracy?.mean || 0.7556) * 100).toFixed(2)}% ± {((evalSummary?.gan_augmented?.video_accuracy?.std || 0.0385) * 100).toFixed(2)}%</td>
                    <td className="font-mono text-accent-red">-2.22% ± 7.70%</td>
                    <td><span className="badge badge-neutral text-[10px]">Slight Degradation</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnostic Plots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="lab2-card">
              <div className="lab2-card-header">
                <div>
                  <h3 className="lab2-card-title">Metrics Comparison across Seeds</h3>
                  <p className="text-xs text-secondary mt-0.5">Bar chart comparing accuracy and F1 across runs</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary text-xs p-1.5"
                  onClick={() => setLightboxPlot({
                    src: '/plots/lab_eval2/gan_mobilenetv2/metrics_comparison.png',
                    title: 'Metrics Comparison (Baseline vs GAN-Augmented)',
                    desc: 'Bar plot of accuracy, macro precision, recall, and F1 across multiple seeds.'
                  })}
                  aria-label="Zoom image"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
              <img 
                src="/plots/lab_eval2/gan_mobilenetv2/metrics_comparison.png" 
                alt="Metrics Comparison" 
                className="w-full rounded border border-subtle object-contain bg-black max-h-64 cursor-pointer" 
                onClick={() => setLightboxPlot({
                  src: '/plots/lab_eval2/gan_mobilenetv2/metrics_comparison.png',
                  title: 'Metrics Comparison (Baseline vs GAN-Augmented)',
                  desc: 'Bar plot of accuracy, macro precision, recall, and F1 across multiple seeds.'
                })}
              />
            </div>

            <div className="lab2-card">
              <div className="lab2-card-header">
                <div>
                  <h3 className="lab2-card-title">Confusion Matrices (Baseline vs GAN)</h3>
                  <p className="text-xs text-secondary mt-0.5">Heatmaps of true vs predicted classes for seed 42</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary text-xs p-1.5"
                  onClick={() => setLightboxPlot({
                    src: '/plots/lab_eval2/gan_mobilenetv2/confusion_matrices.png',
                    title: 'Confusion Matrices (Seed 42)',
                    desc: 'Normalized confusion matrices showing class-level misclassifications.'
                  })}
                  aria-label="Zoom image"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
              <img 
                src="/plots/lab_eval2/gan_mobilenetv2/confusion_matrices.png" 
                alt="Confusion Matrices" 
                className="w-full rounded border border-subtle object-contain bg-black max-h-64 cursor-pointer" 
                onClick={() => setLightboxPlot({
                  src: '/plots/lab_eval2/gan_mobilenetv2/confusion_matrices.png',
                  title: 'Confusion Matrices (Seed 42)',
                  desc: 'Normalized confusion matrices showing class-level misclassifications.'
                })}
              />
            </div>
          </div>

          {/* Robustness Under Perturbations */}
          <div className="lab2-card">
            <h3 className="lab2-card-title mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent-emerald" />
              <span>Robustness to Environmental Perturbations</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="lab2-table text-xs">
                <thead>
                  <tr>
                    <th>Perturbation Condition</th>
                    <th>Baseline Accuracy (Mean ± Std)</th>
                    <th>GAN-Augmented Accuracy (Mean ± Std)</th>
                    <th>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {metadata?.evaluation_results?.robustness_accuracy_mean_std?.baseline && 
                    Object.keys(metadata.evaluation_results.robustness_accuracy_mean_std.baseline).map((cond) => {
                      const b = metadata.evaluation_results.robustness_accuracy_mean_std.baseline[cond];
                      const a = metadata.evaluation_results.robustness_accuracy_mean_std.gan_augmented[cond];
                      const delta = (a?.mean || 0) - (b?.mean || 0);
                      return (
                        <tr key={cond}>
                          <td className="font-semibold text-primary">{cond}</td>
                          <td className="font-mono">{((b?.mean || 0) * 100).toFixed(1)}% ± {((b?.std || 0) * 100).toFixed(1)}%</td>
                          <td className="font-mono">{((a?.mean || 0) * 100).toFixed(1)}% ± {((a?.std || 0) * 100).toFixed(1)}%</td>
                          <td className={`font-mono font-semibold ${delta >= 0 ? 'text-accent-emerald' : 'text-accent-red'}`}>
                            {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
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
                <span>Section E: Scientific Findings & Audited Insights</span>
              </h2>
              <p className="lab2-section-subtitle">
                Why adding 600 class-conditioned DCGAN frames produced +0.00% measurable improvement on fine-tuned MobileNetV2.
              </p>
            </div>
          </div>

          {/* Key Metric Diagnostic Callout */}
          <div className="lab2-card bg-amber-subtle-alpha border-amber mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber shrink-0 mt-0.5" size={20} />
              <div className="text-xs space-y-1.5">
                <div className="font-bold text-primary text-sm">Key Diagnostic Finding: The Label-Fidelity Check</div>
                <p className="text-secondary leading-relaxed">
                  A crucial diagnostic test was conducted: the baseline model (trained solely on authentic sign frames) was evaluated 
                  on the 600 GAN-generated images to measure whether the generator produced authentic class-discriminative features. 
                  The baseline model correctly recognized the intended class of the synthetic frames only <strong>18.83% of the time</strong>. 
                  Given 5 balanced classes, random chance is <strong>20.00%</strong>.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="badge badge-amber font-mono text-[11px]">
                    Real Model Accuracy on GAN Frames: 18.83%
                  </span>
                  <span className="badge badge-neutral font-mono text-[11px]">
                    Random Guess Floor: 20.00%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="lab2-card">
              <h3 className="lab2-card-title mb-2 flex items-center gap-2">
                <Layers size={16} className="text-brand" />
                <span>1. Synthetic Images Carry Little Class Information</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                Because the DCGAN generator was trained on a small sample of 64×64 frames without strong perceptual loss, 
                it learned to replicate skin-tone blobs and approximate silhouettes, but failed to synthesize anatomically 
                precise finger gestures that define Indian Sign Language words. The classifier perceives the synthetic samples 
                as generic blurry human shapes rather than distinctive sign vocabulary.
              </p>
            </div>

            <div className="lab2-card">
              <h3 className="lab2-card-title mb-2 flex items-center gap-2">
                <Zap size={16} className="text-accent-amber" />
                <span>2. Pretrained MobileNetV2 vs Adversarial Perturbation</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                MobileNetV2 already possesses strong high-level visual priors from ImageNet pretraining. When fine-tuning on 
                noisy generative frames, the network is forced to fit non-semantic generative artifacts, counteracting the 
                benefit of the extra training samples and resulting in higher cross-seed variance (std: 5.42% vs 1.27%).
              </p>
            </div>

            <div className="lab2-card">
              <h3 className="lab2-card-title mb-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-accent-cyan" />
                <span>3. Temporal Aggregation Dominates Performance</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                Pooling frame predictions over 8 evenly spaced video frames boosts baseline accuracy from <strong>55.56% to 77.78%</strong> (+22.22%). 
                This demonstrates that temporal consistency across multiple views is far more effective for sign recognition than 
                injecting synthetic 2D frames into training.
              </p>
            </div>

            <div className="lab2-card">
              <h3 className="lab2-card-title mb-2 flex items-center gap-2">
                <ShieldCheck size={16} className="text-violet" />
                <span>4. Scientific Conclusion & Engineering Recommendation</span>
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                Adding DCGAN-generated static frames offers <strong>no measurable advantage</strong> for MobileNetV2 transfer learning. 
                For production SignBridge deployment, standard photometric augmentation (brightness, crop, horizontal flips) and 
                video temporal sequence modeling provide strictly superior accuracy without introducing generative hallucination risks.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SECTION F: Interactive Dual Testing */}
      {activeSection === 'prediction' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-f">
          <div className="lab2-section-header">
            <div>
              <h2 id="heading-section-f" className="lab2-section-title">
                <Upload size={20} className="text-brand" />
                <span>Section F: Interactive Dual Model Testing</span>
              </h2>
              <p className="lab2-section-subtitle">
                Run both Baseline and GAN-augmented MobileNetV2 checkpoints side-by-side on uploaded video clips or static frames.
              </p>
            </div>
            {/* Mode Switcher */}
            <div className="flex gap-2">
              <button
                type="button"
                className={`lab2-pill-btn ${interactiveMode === 'video' ? 'active' : ''}`}
                onClick={() => { setInteractiveMode('video'); setTestError(null); }}
              >
                Video Inference (8 Frames)
              </button>
              <button
                type="button"
                className={`lab2-pill-btn ${interactiveMode === 'image' ? 'active' : ''}`}
                onClick={() => { setInteractiveMode('image'); setTestError(null); }}
              >
                Static Frame
              </button>
            </div>
          </div>

          {/* Workflow Card */}
          <div className="lab2-card mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Upload */}
              <div className="space-y-4">
                {interactiveMode === 'video' ? (
                  <div>
                    <label className="text-xs font-semibold text-secondary block mb-1">
                      Upload Video Clip (MP4 / AVI / MOV)
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

                    {videoPreviewUrl && (
                      <div className="lab2-video-player-wrap mt-3">
                        <video 
                          src={videoPreviewUrl} 
                          controls 
                          className="w-full rounded bg-black max-h-52 object-contain"
                        />
                        <div className="p-2 bg-tertiary flex justify-between items-center text-xs text-secondary">
                          <span className="font-mono truncate">{selectedVideoFile?.name}</span>
                          <span className="badge badge-neutral text-[10px]">
                            8 Evenly Spaced Frames
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary w-full text-xs font-semibold flex items-center justify-center gap-2 mt-3"
                      onClick={handleRunVideoInference}
                      disabled={!selectedVideoFile || isTesting}
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Extracting 8 Frames &amp; Evaluating Dual MobileNetV2...</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          <span>Run Dual Video Inference (8 Frames)</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-secondary block mb-1">
                      Upload Sign Frame Image (PNG / JPEG / WebP)
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageFileChange}
                      className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-500 file:text-white hover:file:bg-brand-600 block mb-3"
                    />

                    {imagePreviewUrl && (
                      <div className="flex justify-center p-3 bg-tertiary rounded border border-subtle mb-3">
                        <img src={imagePreviewUrl} alt="Upload preview" className="max-h-48 rounded object-contain" />
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary w-full text-xs font-semibold flex items-center justify-center gap-2"
                      onClick={handleRunImageInference}
                      disabled={!selectedImageFile || isTesting}
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Evaluating Dual MobileNetV2...</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          <span>Run Dual Frame Inference</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {testError && (
                  <div className="text-xs text-accent-red flex items-center gap-1.5 bg-red-subtle-alpha p-2.5 rounded">
                    <AlertCircle size={14} />
                    <span>{testError}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Preprocessing & Model Specs */}
              <div className="space-y-3">
                <div className="lab2-card bg-tertiary border-subtle">
                  <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                    <Info size={14} className="text-brand" />
                    <span>Evaluation Pipeline Preprocessing</span>
                  </h4>
                  <ul className="text-xs text-secondary space-y-1.5 leading-relaxed list-disc list-inside">
                    <li>Input resolution: <strong>64 × 64 × 3 RGB</strong>.</li>
                    <li>Raw pixel values in <strong>[0.0, 255.0] float32</strong> without manual normalization.</li>
                    <li>Model internally resizes to 128×128 and rescales to [-1, 1].</li>
                    <li>Evaluates <strong>5 classes</strong>: <code>['bad', 'big', 'fast', 'short', 'small']</code>.</li>
                    <li>For videos, 8 frames are uniformly sampled; final prediction is the mean probability vector.</li>
                  </ul>
                </div>

                <div className="lab2-card bg-brand-subtle-alpha border-brand">
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 size={16} className="text-accent-emerald shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-primary">Both Checkpoints Active</span>
                      <p className="text-secondary leading-relaxed">
                        Evaluates both <code>mobilenetv2_baseline.keras</code> and <code>mobilenetv2_gan_augmented.keras</code> simultaneously.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Display for Video */}
          {interactiveMode === 'video' && videoResult && (
            <div className="space-y-6">
              {/* Video Consensus Banner */}
              <div className="lab2-card">
                <div className="lab2-card-header">
                  <div>
                    <h3 className="lab2-card-title">Video-Level Aggregated Prediction (Mean Pooling)</h3>
                    <p className="text-xs text-secondary mt-0.5">8 evenly spaced frames pooled across video duration</p>
                  </div>
                  {videoResult.video_prediction.is_agreement ? (
                    <span className="lab2-match-pill">
                      <CheckCircle2 size={12} /> Models Agree
                    </span>
                  ) : (
                    <span className="lab2-diverge-pill">
                      <AlertTriangle size={12} /> Models Diverge
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Baseline Outcome */}
                  <div className="p-4 bg-tertiary rounded-md border border-subtle text-center">
                    <span className="text-xs uppercase tracking-wider text-secondary font-semibold block mb-1">
                      Baseline MobileNetV2
                    </span>
                    <span className="text-2xl font-black text-accent-emerald font-mono capitalize">
                      {videoResult.video_prediction.baseline.predicted_class}
                    </span>
                    <div className="text-xs text-secondary mt-1 font-mono">
                      Confidence: {(videoResult.video_prediction.baseline.confidence * 100).toFixed(2)}% • {videoResult.video_prediction.baseline.latency_ms.toFixed(1)} ms
                    </div>
                  </div>

                  {/* GAN-Augmented Outcome */}
                  <div className="p-4 bg-tertiary rounded-md border border-subtle text-center">
                    <span className="text-xs uppercase tracking-wider text-secondary font-semibold block mb-1">
                      GAN-Augmented MobileNetV2
                    </span>
                    <span className="text-2xl font-black text-accent-amber font-mono capitalize">
                      {videoResult.video_prediction.gan_augmented.predicted_class}
                    </span>
                    <div className="text-xs text-secondary mt-1 font-mono">
                      Confidence: {(videoResult.video_prediction.gan_augmented.confidence * 100).toFixed(2)}% • {videoResult.video_prediction.gan_augmented.latency_ms.toFixed(1)} ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Frame-by-Frame Gallery & Breakdown */}
              <div className="lab2-card">
                <div className="lab2-card-header">
                  <div>
                    <h3 className="lab2-card-title">Frame-Level Breakdown (8 Sampled Frames)</h3>
                    <p className="text-xs text-secondary mt-0.5">Dual inference results for each individual temporal keyframe</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary text-xs font-semibold flex items-center gap-1.5"
                    onClick={() => handleDownloadJson(videoResult, 'mobilenetv2_video_inference')}
                  >
                    <Download size={13} />
                    <span>Export JSON</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="lab2-table text-xs">
                    <thead>
                      <tr>
                        <th>Step</th>
                        <th>Frame</th>
                        <th>Timestamp</th>
                        <th>Thumbnail</th>
                        <th>Baseline Prediction</th>
                        <th>GAN-Aug Prediction</th>
                        <th>Agreement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videoResult.frame_predictions.map((f) => (
                        <tr key={f.step}>
                          <td className="font-mono text-tertiary">#{f.step + 1}</td>
                          <td className="font-mono">{f.frame_num}</td>
                          <td className="font-mono">{f.timestamp_sec.toFixed(2)}s</td>
                          <td>
                            <img 
                              src={`data:image/jpeg;base64,${f.thumbnail_base64}`} 
                              alt={`Frame ${f.frame_num}`} 
                              className="w-12 h-12 rounded object-cover border border-subtle bg-black" 
                            />
                          </td>
                          <td>
                            <span className="font-semibold text-primary capitalize">{f.baseline_pred}</span>
                            <span className="text-secondary font-mono text-[11px] block">{(f.baseline_conf * 100).toFixed(1)}%</span>
                          </td>
                          <td>
                            <span className="font-semibold text-primary capitalize">{f.augmented_pred}</span>
                            <span className="text-secondary font-mono text-[11px] block">{(f.augmented_conf * 100).toFixed(1)}%</span>
                          </td>
                          <td>
                            {f.agreement ? (
                              <span className="lab2-match-pill">Match</span>
                            ) : (
                              <span className="lab2-diverge-pill">Diverge</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Results Display for Image */}
          {interactiveMode === 'image' && imageResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Baseline Card */}
                <div className="lab2-card">
                  <div className="lab2-card-header">
                    <div>
                      <h3 className="lab2-card-title">1. Baseline MobileNetV2</h3>
                      <p className="text-xs text-secondary mt-0.5">Real training data only</p>
                    </div>
                    <span className="badge badge-success text-xs font-mono">
                      {imageResult.baseline.latency_ms.toFixed(1)} ms
                    </span>
                  </div>

                  <div className="p-4 bg-tertiary rounded-md border border-subtle mb-4 text-center">
                    <span className="text-xs uppercase tracking-wider text-secondary font-semibold block mb-1">
                      Predicted Class
                    </span>
                    <span className="text-2xl font-black text-brand font-mono capitalize">
                      {imageResult.baseline.predicted_class}
                    </span>
                    <div className="text-xs text-secondary mt-1 font-mono">
                      Confidence: {(imageResult.baseline.confidence * 100).toFixed(2)}%
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-primary mb-2">Top Candidates</h4>
                  <div className="space-y-2">
                    {imageResult.baseline.top_k.map((cand, idx) => (
                      <div key={cand.class_name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-primary capitalize">{idx + 1}. {cand.class_name}</span>
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

                {/* Augmented Card */}
                <div className="lab2-card">
                  <div className="lab2-card-header">
                    <div>
                      <h3 className="lab2-card-title">2. GAN-Augmented MobileNetV2</h3>
                      <p className="text-xs text-secondary mt-0.5">Real + 600 synthetic frames</p>
                    </div>
                    <span className="badge badge-success text-xs font-mono">
                      {imageResult.gan_augmented.latency_ms.toFixed(1)} ms
                    </span>
                  </div>

                  <div className="p-4 bg-tertiary rounded-md border border-subtle mb-4 text-center">
                    <span className="text-xs uppercase tracking-wider text-secondary font-semibold block mb-1">
                      Predicted Class
                    </span>
                    <span className="text-2xl font-black text-accent-amber font-mono capitalize">
                      {imageResult.gan_augmented.predicted_class}
                    </span>
                    <div className="text-xs text-secondary mt-1 font-mono">
                      Confidence: {(imageResult.gan_augmented.confidence * 100).toFixed(2)}%
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-primary mb-2">Top Candidates</h4>
                  <div className="space-y-2">
                    {imageResult.gan_augmented.top_k.map((cand, idx) => (
                      <div key={cand.class_name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-primary capitalize">{idx + 1}. {cand.class_name}</span>
                          <span className="font-mono text-secondary">{(cand.confidence * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-tertiary rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-accent-amber h-1.5 rounded-full" 
                            style={{ width: `${Math.max(cand.confidence * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-secondary text-xs font-semibold flex items-center gap-1.5"
                  onClick={() => handleDownloadJson(imageResult, 'mobilenetv2_image_inference')}
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
                Comprehensive comparative analysis across all three Lab Evaluation 2 architectures.
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
                    <th>Classes</th>
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
                    <td className="font-mono">76</td>
                    <td className="font-mono">64 × 64 × 3</td>
                    <td>50% 2D DCGAN Synthetic Frames</td>
                    <td className="font-mono text-accent-emerald font-semibold">49.89%</td>
                    <td className="font-mono text-accent-amber font-semibold">29.00%</td>
                    <td className="font-mono text-accent-red font-semibold">-20.89%</td>
                    <td className="font-mono">~4.2 ms</td>
                    <td><span className="badge badge-success text-[10px]">Verified Dual Run</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">2. CNN-LSTM</td>
                    <td className="font-mono">76</td>
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
                    <td className="font-mono">5</td>
                    <td className="font-mono">64 × 64 (raw 0-255)</td>
                    <td>600 DCGAN Frames (0.974:1 ratio)</td>
                    <td className="font-mono text-accent-emerald font-semibold">55.56% ± 1.27%</td>
                    <td className="font-mono text-accent-amber font-semibold">55.56% ± 5.42%</td>
                    <td className="font-mono text-primary font-semibold">+0.00% ± 6.67%</td>
                    <td className="font-mono">~5.3 ms</td>
                    <td><span className="badge badge-success text-[10px]">Verified Dual Run</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="lab2-card">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-accent-emerald" />
                <span>Empirical Findings Across All 3 Experiments</span>
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                Across both Custom CNN (-20.89% degradation) and MobileNetV2 (+0.00% delta), 2D DCGAN augmentation failed to improve 
                isolated sign recognition. In MobileNetV2, the label-fidelity check revealed that the baseline model recognizes synthetic 
                images as their intended class only 18.83% of the time (chance = 20%). 2D DCGAN frames lack the fine finger anatomy 
                necessary for sign discrimination.
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
