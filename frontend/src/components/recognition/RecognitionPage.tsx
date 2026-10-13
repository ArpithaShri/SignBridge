import { useState, useEffect } from 'react';
import { RotateCcw, Play, Sparkles, AlertCircle, FileVideo, BarChart2, Camera } from 'lucide-react';
import { VideoUploader } from './VideoUploader';
import { VideoPreviewCard } from './VideoPreviewCard';
import { RecognitionResultCard } from './RecognitionResultCard';
import { WebcamRecorder } from './WebcamRecorder';
import { analyzeVideo, validateVideoFile } from '../../services/recognitionApi';
import type { VideoRecognitionResponse, NavigationTab } from '../../types';

interface RecognitionPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

/**
 * Creates a valid video file in-memory using Canvas & MediaRecorder so the browser
 * HTML5 player can play and decode real video frames with valid duration and dimensions.
 */
function createSyntheticVideoFile(filename: string, label: string): Promise<File> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');

      if (!ctx || typeof MediaRecorder === 'undefined') {
        const fallbackBlob = new Blob(['isl-video-binary-data'], { type: 'video/mp4' });
        resolve(new File([fallbackBlob], filename, { type: 'video/mp4', lastModified: Date.now() }));
        return;
      }

      // Draw initial frame
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, 224, 224);
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ISL 76-Class Clip', 112, 90);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(label, 112, 130);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText('224×224 RGB | 33 frames', 112, 160);

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/mp4' });
        const file = new File([videoBlob], filename, { type: 'video/mp4', lastModified: Date.now() });
        resolve(file);
      };

      recorder.start();

      // Animate progress bar across 600ms
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(32, 180, frame * 15, 6);
        if (frame >= 10) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 60);
    } catch {
      const fallbackBlob = new Blob(['isl-video-binary-data'], { type: 'video/mp4' });
      resolve(new File([fallbackBlob], filename, { type: 'video/mp4', lastModified: Date.now() }));
    }
  });
}

export const RecognitionPage = ({ onNavigate }: RecognitionPageProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('mobilenetv2');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoRecognitionResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelected = (file: File) => {
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setValidationError(validation.errorMessage || 'Invalid video file format or size');
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setAnalysisResult(null);
      return;
    }

    setValidationError(null);
    setAnalysisError(null);
    setAnalysisResult(null);
    setVideoDuration(undefined);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await analyzeVideo({
        videoFile: selectedFile,
        targetModel: selectedModel,
        samplingFrames: 33
      });
      setAnalysisResult(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during inference';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setVideoDuration(undefined);
    setValidationError(null);
    setAnalysisError(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  const handleWebcamRecording = (file: File) => {
    setShowWebcam(false);
    handleFileSelected(file);
  };

  const handleLoadSampleVideo = async (filename: string, wordLabel: string) => {
    try {
      const res = await fetch('/samples/isl_sample_video.mp4');
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'video/mp4', lastModified: Date.now() });
        handleFileSelected(file);
        return;
      }
    } catch {
      // fallback to in-memory video generator if static fetch fails
    }
    const sampleFile = await createSyntheticVideoFile(filename, wordLabel);
    handleFileSelected(sampleFile);
  };

  return (
    <div className="recognition-workspace fade-in">
      {/* Workspace Header */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <span className="section-tag">Workspace</span>
          <span className="badge badge-brand">76 ISL Classes</span>
          <span className="badge badge-muted">33 Sampled Frames</span>
        </div>
        <h2 className="section-title">ISL Video Word Recognition</h2>
        <p className="section-subtitle">
          Upload or drag-and-drop short RGB video clips (.MOV, .MP4, .AVI). Each video is uniformly sampled into 33 frames
          and resized to 224×224 pixels for inference using our top-performing MobileNetV2 architecture.
        </p>
      </div>

      {/* Input Method Toggle Row — Webcam | Upload */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'stretch',
          gap: '1rem',
          marginBottom: '0.25rem'
        }}
      >
        {/* Option A: Webcam */}
        <button
          id="btn-open-webcam"
          type="button"
          onClick={() => { setShowWebcam((v) => !v); }}
          style={{
            background: showWebcam
              ? 'linear-gradient(135deg, rgba(99,102,241,0.28) 0%, rgba(139,92,246,0.18) 100%)'
              : 'rgba(255,255,255,0.03)',
            border: showWebcam
              ? '1.5px solid rgba(99,102,241,0.6)'
              : '1.5px dashed rgba(255,255,255,0.14)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            color: '#fff'
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: showWebcam
                ? 'rgba(99,102,241,0.35)'
                : 'rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(99,102,241,0.4)'
            }}
          >
            <Camera size={20} style={{ color: 'var(--brand-400)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.925rem', color: showWebcam ? 'var(--brand-400)' : '#fff' }}>
              {showWebcam ? 'Hide Camera ↑' : '🎥 Record via Webcam'}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Record a live sign gesture with your camera
            </div>
          </div>
        </button>

        {/* OR Divider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.08em' }}>OR</span>
          <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Option B: Upload file */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1.5px dashed rgba(255,255,255,0.14)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            color: '#fff'
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(6,182,212,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(6,182,212,0.35)'
            }}
          >
            <FileVideo size={20} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>📂 Upload a Video File</div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              .MOV, .MP4, .AVI — drag & drop or browse below
            </div>
          </div>
        </div>
      </div>

      {/* Webcam Recorder Panel (expands when camera is open) */}
      {showWebcam && (
        <WebcamRecorder
          onRecordingComplete={handleWebcamRecording}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {/* Quick Sample Clips Bar */}
      <div
        className="glass-card"
        style={{
          padding: '0.7rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileVideo size={14} style={{ color: 'var(--brand-400)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Sample Clips:
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button id="btn-sample-namaste" type="button" className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSampleVideo('namaste_sign_clip.MOV', 'NAMASTE')}>
            <code>namaste.MOV</code>
          </button>
          <button id="btn-sample-thankyou" type="button" className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSampleVideo('thank_you_sign_clip.MOV', 'THANK YOU')}>
            <code>thank_you.MOV</code>
          </button>
          <button id="btn-sample-water" type="button" className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSampleVideo('water_sign_clip.MOV', 'WATER')}>
            <code>water.MOV</code>
          </button>
        </div>
      </div>

      {/* Main Two-Column Recognition Layout */}
      <div className="recognition-grid">
        {/* Left Column: Upload / Video Player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!selectedFile ? (
            <VideoUploader
              onFileSelected={handleFileSelected}
              selectedFile={selectedFile}
              errorMessage={validationError}
              onClearError={() => setValidationError(null)}
            />

          ) : (
            <>
              {previewUrl && (
                <VideoPreviewCard
                  file={selectedFile}
                  previewUrl={previewUrl}
                  duration={videoDuration}
                  onDurationLoaded={(dur) => setVideoDuration(dur)}
                />
              )}

              {/* Model Selection Selector */}
              <div
                className="glass-card"
                style={{
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label
                    htmlFor="model-selector"
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      margin: 0
                    }}
                  >
                    <span>Target Model Architecture:</span>
                  </label>
                  <span
                    className="badge badge-brand"
                    style={{ fontSize: '0.725rem' }}
                  >
                    {selectedModel === 'mobilenetv2' ? '67.78% Test Acc (Default)' :
                     selectedModel === 'custom_cnn' ? '5.00% Baseline Acc' :
                     selectedModel === 'cnn_lstm' ? '4.44% Spatio-Temporal Acc' : 'Equal-Weight Late Fusion'}
                  </span>
                </div>

                <select
                  id="model-selector"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isAnalyzing}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1.5px solid rgba(99, 102, 241, 0.4)',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="mobilenetv2">MobileNetV2 (Frozen Backbone) — 67.78% Acc [Default]</option>
                  <option value="custom_cnn">Custom 2D CNN (Baseline) — 5.00% Acc</option>
                  <option value="cnn_lstm">CNN-LSTM Spatio-Temporal Model — 4.44% Acc</option>
                  <option value="late_fusion">Tri-Model Late Fusion Ensemble (Equal-Weight Average)</option>
                </select>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                  {selectedModel === 'mobilenetv2' && '• 33 sampled frames @ 224×224 RGB [0, 255] -> mean frame probabilities'}
                  {selectedModel === 'custom_cnn' && '• 33 sampled frames @ 224×224 RGB normalized [0, 1] -> mean frame probabilities'}
                  {selectedModel === 'cnn_lstm' && '• 33 sampled frames @ 112×112 RGB normalized [0, 1] -> 5D sequence tensor -> LSTM'}
                  {selectedModel === 'late_fusion' && '• Multi-branch evaluation: (P_mobilenet + P_custom + P_lstm) / 3.0 probability average'}
                </div>
              </div>

              {/* Action Controls Bar */}
              <div className="recognition-controls-bar">
                <button
                  id="btn-analyze-video"
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  style={{ flex: 1 }}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="loading-spinner-ring" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                      <span>Running Neural Inference...</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      <span>Analyze Video with {selectedModel === 'mobilenetv2' ? 'MobileNetV2' : selectedModel === 'custom_cnn' ? 'Custom CNN' : selectedModel === 'cnn_lstm' ? 'CNN-LSTM' : 'Late Fusion'}</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-reset-video"
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={isAnalyzing}
                >
                  <RotateCcw size={16} />
                  <span>Reset / Change</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Processing & Results */}
        <div>
          {isAnalyzing ? (
            <div className="glass-card recognition-loading-card fade-in">
              <div className="loading-spinner-ring" />
              <h4 style={{ color: '#fff', fontSize: '1.2rem', margin: 0 }}>
                Processing Video Frames
              </h4>
              <p style={{ maxWidth: '360px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {selectedModel === 'cnn_lstm'
                  ? 'Extracting 33 temporal frames, standardizing spatial resolution to 112×112 RGB, and feeding 5D sequence to LSTM.'
                  : selectedModel === 'custom_cnn'
                  ? 'Extracting 33 temporal frames, standardizing to 224×224 RGB [0, 1], and averaging Custom CNN predictions.'
                  : selectedModel === 'late_fusion'
                  ? 'Pre-processing 33 frames across all 3 architectures and calculating equal-weight probability average.'
                  : 'Extracting 33 temporal frames, standardizing spatial resolution to 224×224 RGB, and running MobileNetV2 forward pass.'}
              </p>

              <div className="loading-progress-bar-container">
                <div className="loading-progress-bar-fill" />
              </div>

              <div className="loading-step-ticker">
                33 Frames | Model: {selectedModel.toUpperCase()} | 76 ISL Classes
              </div>
            </div>
          ) : analysisResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <RecognitionResultCard result={analysisResult} />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  id="btn-nav-compare"
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate('comparison')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <BarChart2 size={16} />
                  <span>Compare with Custom CNN & CNN-LSTM →</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className="glass-card"
              style={{
                padding: '2.5rem 1.75rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                borderStyle: 'dashed'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)'
                }}
              >
                <Sparkles size={24} />
              </div>
              <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>
                {selectedFile ? 'Ready to Perform Inference' : 'No Video Selected Yet'}
              </h4>
              <p style={{ maxWidth: '380px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {selectedFile
                  ? 'Click "Analyze Video" above to run the 33-frame sampling pipeline and predict the ISL word class.'
                  : 'Select or drag-and-drop an ISL video clip on the left, or click one of the quick test sample clips to begin.'}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                <span className="badge badge-muted">Pipeline Protocol:</span>
                <span className="badge badge-brand">Uniform 33 Frames</span>
                <span className="badge badge-brand">224 × 224 RGB</span>
                <span className="badge badge-brand">MobileNetV2 (67.78%)</span>
              </div>
            </div>
          )}

          {analysisError && (
            <div className="validation-error-alert" role="alert" style={{ marginTop: '1rem' }}>
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h5>Analysis Error</h5>
                <p>{analysisError}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
