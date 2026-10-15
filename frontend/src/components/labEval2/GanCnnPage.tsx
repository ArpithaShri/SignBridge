import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  BarChart2, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Table, 
  Cpu, 
  ArrowRight,
  Database,
  RefreshCw,
  Wand2,
  Eye,
  Activity,
  Clock,
  Zap
} from 'lucide-react';
import {
  fetchLabEval2Metadata,
  fetchLabEval2Metrics,
  predictLabEval2,
  generateLabEval2Image,
  VERIFIED_TEST_COMPARISON,
  VERIFIED_ROBUSTNESS,
  VERIFIED_LATENCY,
  VERIFIED_GENERALIZATION_GAP,
} from '../../services/labEval2Api';
import type {
  LabEval2Overview,
  LabEval2Metrics,
  LabEval2PredictResponse,
  LabEval2GenerateResponse
} from '../../services/labEval2Api';

interface GanCnnPageProps {
  onNavigateToTab?: (tab: 'gan-cnn' | 'gan-cnn-lstm' | 'gan-mobilenetv2') => void;
}

export const GanCnnPage: React.FC<GanCnnPageProps> = ({ onNavigateToTab }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'training' | 'samples' | 'prediction' | 'results' | 'comparison'>('overview');
  const [metadata, setMetadata] = useState<LabEval2Overview | null>(null);
  const [metrics, setMetrics] = useState<LabEval2Metrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Prediction Interactive State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<LabEval2PredictResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Live Generator State
  const [selectedClassForGen, setSelectedClassForGen] = useState<string>('afternoon');
  const [generatorSeed, setGeneratorSeed] = useState<number>(42);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<LabEval2GenerateResponse | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Class Filter for Section E
  const [classFilter, setClassFilter] = useState<string>('');

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
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load Lab Eval 2 data:', err);
        if (mounted) setIsLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
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

  const genGapRows = metrics?.generalization_gap && metrics.generalization_gap.length > 0
    ? metrics.generalization_gap
    : VERIFIED_GENERALIZATION_GAP;

  const classesList = metadata?.classes && metadata.classes.length > 0
    ? metadata.classes
    : ['afternoon', 'animal', 'bad', 'before', 'bell', 'big', 'bird', 'black', 'blue', 'boat', 'book', 'boy', 'break', 'bridge', 'brother', 'bus', 'butterfly', 'call', 'car', 'cat', 'chair', 'church', 'city', 'clean', 'climb', 'close', 'cold', 'come', 'cook', 'cost', 'cow', 'cry', 'cup', 'dance', 'dark', 'daughter', 'day', 'deaf', 'doctor', 'dog', 'door', 'draw', 'drink', 'drive', 'dry', 'ear', 'eat', 'egg', 'elephant', 'empty', 'eye', 'face', 'fall', 'family', 'far', 'fast', 'fat', 'father', 'fear', 'feel', 'female', 'fight', 'fine', 'finger', 'fire', 'fish', 'flag', 'fly', 'food', 'foot', 'free', 'friend', 'fruit', 'full', 'game'];

  const filteredBias = (metrics?.per_class_bias || []).filter(item => 
    !classFilter || item.Class.toLowerCase().includes(classFilter.toLowerCase())
  );

  return (
    <div className="lab2-model-page">
      {/* Verified Experiment Header */}
      <div className="lab2-phase1-status-card">
        <div className="lab2-phase1-status-icon">
          <Sparkles size={24} className="text-violet" />
        </div>
        <div className="lab2-phase1-status-content">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="badge badge-brand">Kaggle Verified Run</span>
            <span className="badge badge-violet">76 ISL Word Classes</span>
            <span className="badge badge-neutral">900 Held-Out Test Frames</span>
            <span className="badge badge-success">3 Artifact Models Loaded</span>
            {isLoading && (
              <span className="badge badge-warning flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Fetching live metrics...
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-primary mb-1">
            GAN + Custom 2D CNN Experiment (SignBridge Lab Eval 2)
          </h2>
          <p className="text-secondary text-sm leading-relaxed">
            Evaluates whether 50% class-conditioned synthetic frame augmentation generated by a Conditional DCGAN (100 epochs) 
            improves the classification performance and robustness of a 4-Block Custom CNN across 76 Indian Sign Language classes.
          </p>
        </div>
      </div>

      {/* Internal Section Navigation Sub-Tabs */}
      <div className="lab2-section-nav" role="tablist" aria-label="GAN + CNN Sections">
        <button
          type="button"
          className={`lab2-section-nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <Cpu size={15} />
          <span>A. Model Overview</span>
        </button>
        <button
          type="button"
          className={`lab2-section-nav-btn ${activeSection === 'training' ? 'active' : ''}`}
          onClick={() => setActiveSection('training')}
        >
          <Database size={15} />
          <span>B. Dataset & Training</span>
        </button>
        <button
          type="button"
          className={`lab2-section-nav-btn ${activeSection === 'samples' ? 'active' : ''}`}
          onClick={() => setActiveSection('samples')}
        >
          <ImageIcon size={15} />
          <span>C. Generated Samples</span>
        </button>
        <button
          type="button"
          className={`lab2-section-nav-btn ${activeSection === 'prediction' ? 'active' : ''}`}
          onClick={() => setActiveSection('prediction')}
        >
          <Upload size={15} />
          <span>D. Model Testing</span>
        </button>
        <button
          type="button"
          className={`lab2-section-nav-btn ${activeSection === 'results' ? 'active' : ''}`}
          onClick={() => setActiveSection('results')}
        >
          <BarChart2 size={15} />
          <span>E. Evaluation Results</span>
        </button>
        <button
          type="button"
          className={`lab2-section-nav-btn ${activeSection === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveSection('comparison')}
        >
          <Table size={15} />
          <span>F. Cross-Model Comparison</span>
        </button>
      </div>

      {/* SECTION A: Model Overview */}
      {activeSection === 'overview' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-a">
          <div className="lab2-section-header">
            <h3 id="heading-section-a" className="lab2-section-title">
              <Cpu size={18} className="text-brand" />
              <span>Section A: Verified Architecture & Configuration</span>
            </h3>
            <span className="badge badge-brand">Kaggle Checkpoints Attached</span>
          </div>

          <div className="lab2-card-grid">
            {/* Baseline Custom CNN Card */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <Layers size={18} className="text-brand" />
                <h4 className="lab2-card-title">1. Baseline Custom 2D CNN</h4>
              </div>
              <p className="lab2-card-body text-sm text-secondary">
                Trained exclusively on authentic video frames extracted at 5 uniform intervals per video. 
                Serves as the rigorous unaugmented control benchmark.
              </p>
              <div className="lab2-spec-box">
                <div className="spec-row">
                  <span className="spec-label">Input Shape:</span>
                  <span className="spec-val font-mono">64 × 64 × 3 RGB</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Normalization:</span>
                  <span className="spec-val font-mono">[-1.0, 1.0] (Rescaled to [0, 1] internally)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Architecture:</span>
                  <span className="spec-val">4× Conv2D (32, 64, 128, 256) + BatchNorm + GAP + Dense(128)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Clean Test Accuracy:</span>
                  <span className="spec-val font-bold text-emerald">49.89% (449 / 900 correct)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Inference Latency:</span>
                  <span className="spec-val font-mono">4.16 ms / frame</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Checkpoint:</span>
                  <span className="badge badge-success font-mono text-[0.7rem]">baseline_cnn_best.keras</span>
                </div>
              </div>
            </div>

            {/* DCGAN-Augmented CNN Card */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <Sparkles size={18} className="text-violet" />
                <h4 className="lab2-card-title">2. DCGAN-Augmented Custom CNN</h4>
              </div>
              <p className="lab2-card-body text-sm text-secondary">
                Trained with 50% synthetic frames generated by the class-conditioned DCGAN mixed with authentic training frames.
              </p>
              <div className="lab2-spec-box">
                <div className="spec-row">
                  <span className="spec-label">Input Shape:</span>
                  <span className="spec-val font-mono">64 × 64 × 3 RGB</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Augmentation Ratio:</span>
                  <span className="spec-val font-mono">50% Synthetic / 50% Real</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Architecture:</span>
                  <span className="spec-val">Identical 4-Block Conv2D backbone to Baseline</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Clean Test Accuracy:</span>
                  <span className="spec-val font-bold text-amber">29.00% (261 / 900 correct)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Inference Latency:</span>
                  <span className="spec-val font-mono">3.23 ms / frame</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Checkpoint:</span>
                  <span className="badge badge-success font-mono text-[0.7rem]">gan_augmented_cnn_best.keras</span>
                </div>
              </div>
            </div>

            {/* Conditional DCGAN Generator Card */}
            <div className="lab2-card">
              <div className="lab2-card-header">
                <Wand2 size={18} className="text-cyan" />
                <h4 className="lab2-card-title">3. Conditional DCGAN Generator</h4>
              </div>
              <p className="lab2-card-body text-sm text-secondary">
                Generates 64×64 RGB hand frames conditioned on the target sign class label embedding.
              </p>
              <div className="lab2-spec-box">
                <div className="spec-row">
                  <span className="spec-label">Latent Noise Dim:</span>
                  <span className="spec-val font-mono">100 dimensions (Gaussian ~ N(0, 1))</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Conditioning:</span>
                  <span className="spec-val">Class Label Embedding (76 classes, 100-dim)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Upsampling Layers:</span>
                  <span className="spec-val">8×8 → 16×16 → 32×32 → 64×64 (Conv2DTranspose)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Output Activation:</span>
                  <span className="spec-val font-mono">tanh [-1.0, 1.0]</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Trained Epochs:</span>
                  <span className="spec-val">100 Epochs</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Checkpoint:</span>
                  <span className="badge badge-success font-mono text-[0.7rem]">generator_epoch_100.keras</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scientific Findings Banner */}
          <div className="lab2-card mt-2">
            <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Info size={16} className="text-brand" />
              <span>Scientific Finding & Empirical Takeaway</span>
            </h4>
            <div className="text-xs text-secondary leading-relaxed space-y-2">
              <p>
                <strong>Clean Accuracy Gap:</strong> The unaugmented Baseline CNN significantly outperformed the DCGAN-augmented CNN on the clean test set (<strong>49.89%</strong> vs <strong>29.00%</strong>).
              </p>
              <p>
                <strong>Mechanism:</strong> Downsampling video frames to 64×64 resolution removed high-frequency finger edge cues. The DCGAN synthesized indistinct hand blobs that confused decision boundaries on clean test data rather than acting as a regularizer.
              </p>
              <p>
                <strong>Noise Resilience Tradeoff:</strong> Under severe Gaussian noise (STD=0.1 and 0.2), the DCGAN-augmented CNN demonstrated slightly higher accuracy retention (18.11% vs 15.33% at STD=0.1; 6.22% vs 4.44% at STD=0.2), confirming a trade-off between clean peak accuracy and perturbation robustness.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SECTION B: Dataset & Training */}
      {activeSection === 'training' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-b">
          <div className="lab2-section-header">
            <h3 id="heading-section-b" className="lab2-section-title">
              <Database size={18} className="text-cyan" />
              <span>Section B: Dataset Partition & Training Curves</span>
            </h3>
            <span className="badge badge-neutral">Protocol: Stratified Video Partition</span>
          </div>

          <div className="lab2-split-grid mb-4">
            <div className="lab2-split-card">
              <span className="text-xs text-secondary uppercase font-semibold">Total Sign Classes</span>
              <span className="text-2xl font-mono font-bold text-primary mt-1">76</span>
              <span className="text-xs text-secondary mt-1">Full ISL vocabulary</span>
            </div>
            <div className="lab2-split-card">
              <span className="text-xs text-secondary uppercase font-semibold">Held-Out Test Frames</span>
              <span className="text-2xl font-mono font-bold text-emerald mt-1">900</span>
              <span className="text-xs text-secondary mt-1">Real video extractions</span>
            </div>
            <div className="lab2-split-card">
              <span className="text-xs text-secondary uppercase font-semibold">DCGAN Training Epochs</span>
              <span className="text-2xl font-mono font-bold text-violet mt-1">100</span>
              <span className="text-xs text-secondary mt-1">Batch size 32</span>
            </div>
            <div className="lab2-split-card">
              <span className="text-xs text-secondary uppercase font-semibold">Sampling Density</span>
              <span className="text-2xl font-mono font-bold text-cyan mt-1">5</span>
              <span className="text-xs text-secondary mt-1">Uniform frames / video</span>
            </div>
          </div>

          {/* Training Curve Plots */}
          <div className="lab2-card-grid">
            <div className="lab2-card">
              <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <BarChart2 size={16} className="text-brand" />
                <span>Classifier Learning Curves (Baseline vs Augmented)</span>
              </h4>
              <p className="text-xs text-secondary mb-3">
                Training and validation accuracy/loss across epochs. Notice Baseline CNN early-stopped at epoch 44 while Augmented stopped at 31.
              </p>
              <div className="lab2-plot-img-box">
                <img 
                  src="/lab_eval2/plots/learning_curves.png" 
                  alt="Classifier Learning Curves" 
                  className="lab2-plot-img"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="lab2-card">
              <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Activity size={16} className="text-violet" />
                <span>Conditional DCGAN Loss Trajectory</span>
              </h4>
              <p className="text-xs text-secondary mb-3">
                Generator and Discriminator loss progression over 100 epochs with Adam optimizer (lr=2e-4, beta1=0.5).
              </p>
              <div className="lab2-plot-img-box">
                <img 
                  src="/lab_eval2/plots/gan_training_loss.png" 
                  alt="DCGAN Training Loss" 
                  className="lab2-plot-img"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Generalization Gap Table */}
          <div className="lab2-card mt-2">
            <h4 className="text-sm font-semibold text-primary mb-2">Generalization Gap Assessment</h4>
            <div className="lab2-metrics-table-wrap">
              <table className="lab2-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Train Accuracy</th>
                    <th>Validation Accuracy</th>
                    <th>Accuracy Gap</th>
                    <th>Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {genGapRows.map((r, i) => (
                    <tr key={i}>
                      <td className="font-semibold text-primary">{r.Model}</td>
                      <td className="font-mono text-emerald">{(r.Train_Accuracy * 100).toFixed(2)}%</td>
                      <td className="font-mono text-cyan">{(r.Validation_Accuracy * 100).toFixed(2)}%</td>
                      <td className="font-mono text-amber font-bold">{(r.Accuracy_Gap * 100).toFixed(2)}%</td>
                      <td className="text-xs text-secondary">
                        {r.Model === 'Baseline CNN' 
                          ? 'High capacity, significant overfitting to training videos' 
                          : 'Heavy regularization from synthetic frame noise reduced training accuracy'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SECTION C: Generated Samples */}
      {activeSection === 'samples' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-c">
          <div className="lab2-section-header">
            <h3 id="heading-section-c" className="lab2-section-title">
              <ImageIcon size={18} className="text-violet" />
              <span>Section C: DCGAN Synthesized Gesture Gallery & Live Generator</span>
            </h3>
            <span className="badge badge-violet">Generator Checkpoint Live</span>
          </div>

          {/* Live Generator Interactive Card */}
          <div className="lab2-card mb-4">
            <div className="lab2-card-header">
              <Wand2 size={18} className="text-violet" />
              <h4 className="lab2-card-title">Live Conditional DCGAN Generator Playground</h4>
            </div>
            <p className="text-xs text-secondary mb-4">
              Select any of the 76 sign classes and click <strong>Synthesize Live Frame</strong>. 
              The backend runs <code>generator_epoch_100.keras</code> with random Gaussian noise conditioned on the sign embedding.
            </p>

            <div className="lab2-generator-bar">
              <div className="generator-input-group">
                <label className="text-xs text-secondary font-semibold">Target Class (0..75):</label>
                <select 
                  className="lab2-select"
                  value={selectedClassForGen}
                  onChange={(e) => setSelectedClassForGen(e.target.value)}
                >
                  {classesList.map((cls, idx) => (
                    <option key={cls} value={cls}>
                      #{idx}: {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="generator-input-group">
                <label className="text-xs text-secondary font-semibold">Seed:</label>
                <input 
                  type="number" 
                  className="lab2-input w-24"
                  value={generatorSeed}
                  onChange={(e) => setGeneratorSeed(parseInt(e.target.value) || 0)}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateLive}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin mr-1" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={14} className="mr-1" />
                    <span>Synthesize Live Frame</span>
                  </>
                )}
              </button>
            </div>

            {genError && (
              <div className="lab2-placeholder-notice mt-3 text-red-300 border-red-500/30 bg-red-500/10">
                <AlertTriangle size={16} className="text-red-400 shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            {generatedResult && (
              <div className="lab2-gen-result-box mt-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="lab2-pixelated-frame-wrap">
                    <img 
                      src={generatedResult.image_data_url} 
                      alt={`Synthesized ${generatedResult.class_name}`} 
                      className="lab2-pixelated-img"
                    />
                    <span className="lab2-res-tag">64×64</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="badge badge-violet w-fit">Live Neural Generation</span>
                    <span className="text-primary font-bold text-sm">Class: {generatedResult.class_name} (Index #{generatedResult.class_index})</span>
                    <span className="text-secondary font-mono">Resolution: 64×64 RGB | Latent Dim: 100</span>
                    <span className="text-secondary font-mono">Generation Latency: {generatedResult.latency_ms} ms</span>
                    <span className="text-secondary mt-1 italic">
                      Note: Exhibits typical DCGAN 64×64 artifacts (blur, indistinct fingers) as analyzed in the experiment.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actual Experiment Output Grid */}
          <div className="lab2-card">
            <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Eye size={16} className="text-brand" />
              <span>Verified 76-Class DCGAN Generated Samples Grid (From Training Archive)</span>
            </h4>
            <p className="text-xs text-secondary mb-3">
              Actual output grid saved at epoch 100 of the Kaggle experiment across multiple sign classes.
            </p>
            <div className="lab2-plot-img-box">
              <img 
                src="/lab_eval2/plots/synthetic_samples.png" 
                alt="DCGAN Generated Samples Grid" 
                className="lab2-plot-img"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      )}

      {/* SECTION D: Model Testing & Prediction */}
      {activeSection === 'prediction' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-d">
          <div className="lab2-section-header">
            <h3 id="heading-section-d" className="lab2-section-title">
              <Upload size={18} className="text-brand" />
              <span>Section D: Live Model Testing & Side-by-Side Prediction</span>
            </h3>
            <span className="badge badge-brand">Dual Neural Inference</span>
          </div>

          <div className="lab2-card mb-4">
            <div className="lab2-card-header">
              <Upload size={18} className="text-brand" />
              <h4 className="lab2-card-title">Upload Test Frame or Video Clip</h4>
            </div>
            <p className="text-xs text-secondary mb-3">
              Upload any sign gesture image frame (PNG, JPG) or short video clip (MP4, WebM). 
              The backend resizes to 64×64, scales to [-1.0, 1.0], and executes simultaneous forward passes through both 
              <strong> Baseline CNN</strong> and <strong>DCGAN-Augmented CNN</strong>.
            </p>

            <div className="lab2-dropzone-box">
              <input 
                type="file" 
                id="lab2-file-input"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="lab2-file-input" className="lab2-dropzone-label">
                {previewUrl ? (
                  <img src={previewUrl} alt="Upload preview" className="w-24 h-24 object-cover rounded-md border border-white/20 mb-2" />
                ) : (
                  <Upload size={32} className="text-brand mb-2 opacity-60" />
                )}
                <span className="text-sm font-semibold text-primary">
                  {selectedFile ? selectedFile.name : 'Click to select frame or drag and drop'}
                </span>
                <span className="text-xs text-secondary mt-1">
                  Supports PNG, JPG, WebP images or MP4/WebM videos (Max 50MB)
                </span>
              </label>

              {selectedFile && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRunPrediction}
                    disabled={isPredicting}
                  >
                    {isPredicting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin mr-1" />
                        <span>Running Tri-Pass Inference...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} className="mr-1" />
                        <span>Run Dual Model Prediction</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {predictError && (
              <div className="lab2-placeholder-notice mt-3 text-red-300 border-red-500/30 bg-red-500/10">
                <AlertTriangle size={16} className="text-red-400 shrink-0" />
                <span>{predictError}</span>
              </div>
            )}

            {/* Prediction Results Display */}
            {predictionResult && (
              <div className="mt-6">
                <h4 className="text-sm font-bold text-primary mb-3">
                  Inference Results ({predictionResult.input_info})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Baseline Prediction Card */}
                  {predictionResult.baseline && (
                    <div className="lab2-card border-brand/30 bg-brand/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="badge badge-brand">Baseline CNN (Real Only)</span>
                        <span className="text-xs font-mono text-secondary">
                          {predictionResult.baseline.latency_ms} ms
                        </span>
                      </div>
                      <div className="text-xl font-bold text-primary mb-1">
                        {predictionResult.baseline.predicted_class}
                      </div>
                      <div className="text-xs text-emerald font-semibold mb-3">
                        Confidence: {(predictionResult.baseline.confidence * 100).toFixed(1)}%
                      </div>

                      <div className="text-xs text-secondary font-semibold mb-1">Top 5 Softmax Probabilities:</div>
                      <div className="space-y-1">
                        {predictionResult.baseline.top5.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                            <span className="text-primary">{p.class_name}</span>
                            <span className="font-mono text-secondary">{(p.confidence * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GAN Augmented Prediction Card */}
                  {predictionResult.gan_augmented && (
                    <div className="lab2-card border-violet/30 bg-violet/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="badge badge-violet">DCGAN + CNN (Augmented)</span>
                        <span className="text-xs font-mono text-secondary">
                          {predictionResult.gan_augmented.latency_ms} ms
                        </span>
                      </div>
                      <div className="text-xl font-bold text-primary mb-1">
                        {predictionResult.gan_augmented.predicted_class}
                      </div>
                      <div className="text-xs text-amber font-semibold mb-3">
                        Confidence: {(predictionResult.gan_augmented.confidence * 100).toFixed(1)}%
                      </div>

                      <div className="text-xs text-secondary font-semibold mb-1">Top 5 Softmax Probabilities:</div>
                      <div className="space-y-1">
                        {predictionResult.gan_augmented.top5.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                            <span className="text-primary">{p.class_name}</span>
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
        </section>
      )}

      {/* SECTION E: Evaluation Results */}
      {activeSection === 'results' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-e">
          <div className="lab2-section-header">
            <h3 id="heading-section-e" className="lab2-section-title">
              <BarChart2 size={18} className="text-emerald" />
              <span>Section E: Empirical Test Evaluation, Confusion Matrices & Grad-CAM</span>
            </h3>
            <span className="badge badge-neutral">Held-Out Test Set (900 Real Frames)</span>
          </div>

          {/* Primary Test Comparison Table */}
          <div className="lab2-card mb-4">
            <h4 className="text-sm font-semibold text-primary mb-2">Overall Test Set Performance Comparison</h4>
            <div className="lab2-metrics-table-wrap">
              <table className="lab2-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Clean Accuracy</th>
                    <th>Macro Precision</th>
                    <th>Macro Recall</th>
                    <th>Macro F1</th>
                    <th>Weighted F1</th>
                    <th>Latency / frame</th>
                  </tr>
                </thead>
                <tbody>
                  {testComp.map((r, i) => (
                    <tr key={i} className={r.Model === 'Baseline CNN' ? 'lab2-table-row-active' : ''}>
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

          {/* Confusion Matrices Plot */}
          <div className="lab2-card mb-4">
            <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Table size={16} className="text-brand" />
              <span>Full 76-Class Confusion Matrices (Side-by-Side)</span>
            </h4>
            <p className="text-xs text-secondary mb-3">
              True class index vs predicted class index for all 76 Indian Sign Language word classes on the 900 held-out test frames.
            </p>
            <div className="lab2-plot-img-box">
              <img 
                src="/lab_eval2/plots/confusion_matrices.png" 
                alt="Confusion Matrices" 
                className="lab2-plot-img"
                loading="lazy"
              />
            </div>
          </div>

          {/* Grad-CAM Explainability & Uncertainty Plots */}
          <div className="lab2-card-grid mb-4">
            <div className="lab2-card">
              <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Eye size={16} className="text-cyan" />
                <span>Grad-CAM Spatial Explainability Heatmaps</span>
              </h4>
              <p className="text-xs text-secondary mb-3">
                Visualizes convolutional activation gradients. Reveals how DCGAN augmentation alters spatial focus on hand shapes.
              </p>
              <div className="lab2-plot-img-box">
                <img 
                  src="/lab_eval2/plots/gradcam_explainability.png" 
                  alt="Grad-CAM Explainability" 
                  className="lab2-plot-img"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="lab2-card">
              <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Activity size={16} className="text-amber" />
                <span>Prediction Uncertainty Distribution</span>
              </h4>
              <p className="text-xs text-secondary mb-3">
                Confidence histogram: DCGAN+CNN exhibits higher uncertainty (89.56% low confidence vs 44.33% for Baseline).
              </p>
              <div className="lab2-plot-img-box">
                <img 
                  src="/lab_eval2/plots/uncertainty_confidence_distribution.png" 
                  alt="Uncertainty Distribution" 
                  className="lab2-plot-img"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Robustness Under Noise Perturbations */}
          <div className="lab2-card mb-4">
            <h4 className="text-sm font-semibold text-primary mb-2">Noise Perturbation Robustness Benchmarks</h4>
            <div className="lab2-metrics-table-wrap">
              <table className="lab2-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Gaussian Noise (STD)</th>
                    <th>Test Accuracy</th>
                    <th>Macro F1</th>
                    <th>Retention Behavior</th>
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
                        {r.Noise_STD === 0.0 && 'Clean baseline reference'}
                        {r.Noise_STD === 0.05 && (r.Model.includes('DCGAN') ? 'Minimal degradation (-1.11%)' : 'Moderate drop (-13.11%)')}
                        {r.Noise_STD === 0.1 && (r.Model.includes('DCGAN') ? 'Higher resilience than baseline (18.11% vs 15.33%)' : 'Sharp degradation (-34.56%)')}
                        {r.Noise_STD === 0.2 && (r.Model.includes('DCGAN') ? 'Retained 6.22% accuracy under extreme noise' : 'Collapsed to 4.44%')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latency and Throughput Benchmarks */}
          <div className="lab2-card mb-4">
            <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Clock size={16} className="text-cyan" />
              <span>Inference Latency & Throughput Benchmarks (900 Real Test Images)</span>
            </h4>
            <div className="lab2-metrics-table-wrap">
              <table className="lab2-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Frames Tested</th>
                    <th>Total Time (s)</th>
                    <th>Mean Latency</th>
                    <th>Throughput</th>
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
                <h4 className="text-sm font-semibold text-primary">
                  Per-Class Classification Report (76 Classes)
                </h4>
                <input 
                  type="text" 
                  placeholder="Filter by class name..."
                  className="lab2-input text-xs w-48"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                />
              </div>

              <div className="lab2-metrics-table-wrap max-h-80 overflow-y-auto">
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
                    {filteredBias.slice(0, 50).map((r, i) => (
                      <tr key={i}>
                        <td className="font-semibold text-xs text-primary">{r.Model}</td>
                        <td className="font-bold text-violet text-xs">{r.Class}</td>
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

      {/* SECTION F: Cross-Model Comparison */}
      {activeSection === 'comparison' && (
        <section className="lab2-section-content" aria-labelledby="heading-section-f">
          <div className="lab2-section-header">
            <h3 id="heading-section-f" className="lab2-section-title">
              <Table size={18} className="text-brand" />
              <span>Section F: Tri-Model Lab Eval 2 Comparison Matrix</span>
            </h3>
            <span className="badge badge-brand">Live Progress</span>
          </div>

          <div className="lab2-card mb-4">
            <h4 className="text-sm font-semibold text-primary mb-2">Lab Evaluation 2 Model Comparison Status</h4>
            <p className="text-xs text-secondary mb-4 leading-relaxed">
              Comparison across all three deep-learning models evaluated with GAN augmentation. 
              GAN + CNN is fully populated with empirical Kaggle results, while the other two models await their respective artifacts.
            </p>

            <div className="lab2-metrics-table-wrap">
              <table className="lab2-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Modality</th>
                    <th>Augmentation Protocol</th>
                    <th>Clean Accuracy (Baseline)</th>
                    <th>Clean Accuracy (Augmented)</th>
                    <th>Integration Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="lab2-table-row-active">
                    <td className="font-bold text-primary">1. GAN + CNN</td>
                    <td>2D Spatial Convolutions (64×64)</td>
                    <td>Class-conditioned DCGAN (50% synthetic)</td>
                    <td className="font-mono text-emerald font-bold">49.89%</td>
                    <td className="font-mono text-amber font-bold">29.00%</td>
                    <td><span className="badge badge-success">Integrated (Phase 2)</span></td>
                    <td>
                      <button
                        type="button"
                        className="btn-table-action active"
                        onClick={() => setActiveSection('overview')}
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold text-secondary">2. GAN + CNN-LSTM</td>
                    <td>Spatio-Temporal Recurrent</td>
                    <td>Synthetic sequence augmentation</td>
                    <td className="font-mono text-secondary">—</td>
                    <td className="font-mono text-secondary">—</td>
                    <td><span className="badge badge-amber">Awaiting Model Files</span></td>
                    <td>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => onNavigateToTab('gan-cnn-lstm')}
                        >
                          View Placeholder <ArrowRight size={12} className="inline ml-1" />
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
                    <td><span className="badge badge-amber">Awaiting Model Files</span></td>
                    <td>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => onNavigateToTab('gan-mobilenetv2')}
                        >
                          View Placeholder <ArrowRight size={12} className="inline ml-1" />
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="lab2-info-banner">
            <CheckCircle size={18} className="text-emerald shrink-0" />
            <div className="text-xs text-secondary leading-relaxed">
              <strong>Rigorous Scientific Standard:</strong> The main-pipeline 76-class MobileNetV2, Custom CNN, and CNN-LSTM are completely separate and preserved. 
              The two pending tabs display clean placeholders without substitution.
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
