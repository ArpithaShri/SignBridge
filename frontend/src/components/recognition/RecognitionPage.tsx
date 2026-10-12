import { useState, useEffect } from 'react';
import { RotateCcw, Play, Sparkles, AlertCircle, FileVideo, BarChart2 } from 'lucide-react';
import { VideoUploader } from './VideoUploader';
import { VideoPreviewCard } from './VideoPreviewCard';
import { RecognitionResultCard } from './RecognitionResultCard';
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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoRecognitionResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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
        targetModel: 'mobilenetv2',
        samplingFrames: 33
      });
      setAnalysisResult(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during inference simulation';
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

  const handleLoadSampleVideo = async (filename: string, wordLabel: string) => {
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

      {/* Quick Test Demo Bar */}
      <div
        className="glass-card"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileVideo size={16} style={{ color: 'var(--brand-400)' }} />
          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Quick Sample Test Clips:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            id="btn-sample-namaste"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSampleVideo('namaste_sign_clip.MOV', 'NAMASTE')}
          >
            Load <code>namaste_sign.MOV</code>
          </button>
          <button
            id="btn-sample-thankyou"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSampleVideo('thank_you_sign_clip.MOV', 'THANK YOU')}
          >
            Load <code>thank_you_sign.MOV</code>
          </button>
          <button
            id="btn-sample-water"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSampleVideo('water_sign_clip.MOV', 'WATER')}
          >
            Load <code>water_sign.MOV</code>
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
                      <span>Analyzing 33 Frames...</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      <span>Analyze Video</span>
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
                Uniformly extracting 33 temporal frames, standardizing spatial resolution to 224×224 RGB,
                and running MobileNetV2 forward pass.
              </p>

              <div className="loading-progress-bar-container">
                <div className="loading-progress-bar-fill" />
              </div>

              <div className="loading-step-ticker">
                Uniform Sampling: 33 frames | Scale: [0, 1] | Model: MobileNetV2
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
