import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  Layers, 
  Clock, 
  FileImage
} from 'lucide-react';
import type { LabEval2PredictResponse } from '../../types';
import { predictLabEval2, validateImageFile } from '../../services/labEval2Api';

interface LabEval2ClassifierProps {
  initialImageUrl?: string | null;
  initialImageLabel?: string | null;
}

export const LabEval2Classifier: React.FC<LabEval2ClassifierProps> = ({
  initialImageUrl,
  initialImageLabel
}) => {
  const [selectedModel, setSelectedModel] = useState<'both' | 'baseline' | 'gan_augmented'>('both');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [imageSourceLabel, setImageSourceLabel] = useState<string | null>(initialImageLabel || null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<LabEval2PredictResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const classes = ['small', 'short', 'bad', 'big', 'fast'];

  // Handle incoming preloaded image from gallery
  useEffect(() => {
    if (initialImageUrl) {
      setImagePreviewUrl(initialImageUrl);
      setImageSourceLabel(initialImageLabel || 'Gallery Frame');
      setPredictionResult(null);
      // Auto run prediction on preloaded image
      fetchAndPredictUrl(initialImageUrl);
    }
  }, [initialImageUrl, initialImageLabel]);

  const fetchAndPredictUrl = async (url: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const result = await predictLabEval2(blob, selectedModel);
      setPredictionResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to predict on selected image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrorMsg(validation.errorMessage || 'Invalid image file.');
      return;
    }

    setErrorMsg(null);
    setImageFile(file);
    setImageSourceLabel(file.name);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setPredictionResult(null);
  };

  const handleRunInference = async () => {
    if (!imagePreviewUrl) {
      setErrorMsg('Please upload an image or select a sample frame first.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (imageFile) {
        const res = await predictLabEval2(imageFile, selectedModel);
        setPredictionResult(res);
      } else if (imagePreviewUrl) {
        await fetchAndPredictUrl(imagePreviewUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Inference execution failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sample quick pick presets
  const samplePresets = [
    { label: 'Synthetic "bad"', url: '/api/v1/lab-eval2/artifact-image/gallery/synth_bad_01.png' },
    { label: 'Synthetic "fast"', url: '/api/v1/lab-eval2/artifact-image/gallery/synth_fast_01.png' },
    { label: 'Synthetic "short"', url: '/api/v1/lab-eval2/artifact-image/gallery/synth_short_01.png' },
    { label: 'Real "big"', url: '/api/v1/lab-eval2/artifact-image/gallery/real_big_01.png' },
    { label: 'Real "small"', url: '/api/v1/lab-eval2/artifact-image/gallery/real_small_01.png' },
  ];

  const handleSelectPreset = (preset: { label: string; url: string }) => {
    setImageFile(null);
    setImagePreviewUrl(preset.url);
    setImageSourceLabel(preset.label);
    setPredictionResult(null);
    fetchAndPredictUrl(preset.url);
  };

  return (
    <div className="lab2-classifier-section">
      <div className="lab2-grid-2col mb-6">
        {/* Upload & Model Configuration Card */}
        <div className="lab2-card">
          <div className="lab2-card-header">
            <div className="flex items-center gap-2">
              <div className="lab2-spec-icon-wrap bg-cyan-subtle">
                <Upload size={18} className="text-cyan" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Single-Image Neural Inference</h3>
                <span className="text-xs text-secondary">
                  64×64 RGB Input • Normalized to [0, 1] (/ 255.0)
                </span>
              </div>
            </div>
          </div>

          {/* Model Selector Tabs */}
          <div className="lab2-form-row mt-4">
            <label className="text-xs font-semibold text-secondary">Target Classifier:</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn-pill flex-1 ${selectedModel === 'both' ? 'active' : ''}`}
                onClick={() => setSelectedModel('both')}
              >
                Compare Both Models
              </button>
              <button
                type="button"
                className={`btn-pill flex-1 ${selectedModel === 'baseline' ? 'active' : ''}`}
                onClick={() => setSelectedModel('baseline')}
              >
                Baseline CNN (616)
              </button>
              <button
                type="button"
                className={`btn-pill flex-1 ${selectedModel === 'gan_augmented' ? 'active' : ''}`}
                onClick={() => setSelectedModel('gan_augmented')}
              >
                GAN CNN (1,216)
              </button>
            </div>
          </div>

          {/* Dropzone / Upload Area */}
          <div
            className="lab2-dropzone mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {imagePreviewUrl ? (
              <div className="lab2-dropzone-preview">
                <div className="lab2-pixelated-frame-wrap">
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="lab2-pixelated-img"
                  />
                  <span className="lab2-res-tag">64 × 64 RGB</span>
                </div>
                <div className="text-center mt-2">
                  <span className="font-semibold text-primary text-sm">{imageSourceLabel}</span>
                  <span className="text-xs text-secondary block mt-0.5">Click to replace image</span>
                </div>
              </div>
            ) : (
              <div className="lab2-dropzone-placeholder">
                <FileImage size={32} className="text-secondary mx-auto mb-2" />
                <span className="font-semibold text-primary block">Drop image here or browse</span>
                <span className="text-xs text-secondary block mt-1">PNG, JPG, or WebP up to 10 MB</span>
              </div>
            )}
          </div>

          {/* Quick Presets Bar */}
          <div className="mt-3">
            <span className="text-xs font-semibold text-secondary block mb-1.5">Or try a sample frame:</span>
            <div className="flex flex-wrap gap-1.5">
              {samplePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="btn-preset-chip"
                  onClick={() => handleSelectPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            id="btn-run-classifier-inference"
            type="button"
            className="btn btn-primary w-full mt-4"
            onClick={handleRunInference}
            disabled={isLoading || !imagePreviewUrl}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Executing Forward Pass...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Classify Image (64×64)</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="lab2-alert-error mt-3">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Prediction Results Display Card */}
        <div className="lab2-card">
          <div className="lab2-card-header">
            <div className="flex items-center gap-2">
              <div className="lab2-spec-icon-wrap bg-violet-subtle">
                <Sparkles size={18} className="text-violet" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Inference Results & Probabilities</h3>
                <span className="text-xs text-secondary">
                  Softmax distribution across the 5 ISL classes
                </span>
              </div>
            </div>
          </div>

          {!predictionResult && !isLoading && (
            <div className="lab2-empty-results-box mt-8">
              <Layers size={36} className="text-secondary mb-2" />
              <p className="text-secondary text-sm">Upload or select an image to inspect model predictions.</p>
            </div>
          )}

          {isLoading && (
            <div className="lab2-loading-box mt-8">
              <RefreshCw size={28} className="animate-spin text-brand" />
              <span className="text-sm text-secondary">Computing convolutional activations and softmax output...</span>
            </div>
          )}

          {predictionResult && (
            <div className="lab2-results-container mt-4">
              {/* Single Model or Side-by-Side View */}
              <div className="space-y-4">
                {/* Baseline CNN Card */}
                {predictionResult.baseline && (
                  <div className="lab2-model-result-card">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-brand">Baseline CNN</span>
                        <span className="text-xs text-secondary">(616 Real)</span>
                      </div>
                      <span className="text-xs font-mono text-emerald flex items-center gap-1">
                        <Clock size={12} />
                        {predictionResult.baseline.latency_ms} ms
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 mb-2">
                      <div>
                        <span className="text-xs text-secondary uppercase font-semibold">Predicted Sign:</span>
                        <div className="text-xl font-bold text-primary uppercase">
                          {predictionResult.baseline.predicted_class}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-secondary uppercase font-semibold">Confidence:</span>
                        <div className="text-xl font-mono font-bold text-brand">
                          {(predictionResult.baseline.confidence * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Probability Bars */}
                    <div className="space-y-1.5 mt-3">
                      {classes.map((cls) => {
                        const prob = predictionResult.baseline?.probabilities[cls] || 0;
                        const isPred = cls === predictionResult.baseline?.predicted_class;
                        return (
                          <div key={cls} className="lab2-prob-row">
                            <span className={`lab2-prob-label ${isPred ? 'font-bold text-brand' : 'text-secondary'}`}>
                              {cls}
                            </span>
                            <div className="lab2-prob-track">
                              <div
                                className={`lab2-prob-bar ${isPred ? 'bg-brand' : 'bg-secondary'}`}
                                style={{ width: `${Math.max(prob * 100, 2)}%` }}
                              />
                            </div>
                            <span className="lab2-prob-val font-mono">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* GAN-Augmented CNN Card */}
                {predictionResult.gan_augmented && (
                  <div className="lab2-model-result-card">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-violet">GAN-Augmented CNN</span>
                        <span className="text-xs text-secondary">(1,216 Images)</span>
                      </div>
                      <span className="text-xs font-mono text-emerald flex items-center gap-1">
                        <Clock size={12} />
                        {predictionResult.gan_augmented.latency_ms} ms
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 mb-2">
                      <div>
                        <span className="text-xs text-secondary uppercase font-semibold">Predicted Sign:</span>
                        <div className="text-xl font-bold text-primary uppercase">
                          {predictionResult.gan_augmented.predicted_class}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-secondary uppercase font-semibold">Confidence:</span>
                        <div className="text-xl font-mono font-bold text-violet">
                          {(predictionResult.gan_augmented.confidence * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Probability Bars */}
                    <div className="space-y-1.5 mt-3">
                      {classes.map((cls) => {
                        const prob = predictionResult.gan_augmented?.probabilities[cls] || 0;
                        const isPred = cls === predictionResult.gan_augmented?.predicted_class;
                        return (
                          <div key={cls} className="lab2-prob-row">
                            <span className={`lab2-prob-label ${isPred ? 'font-bold text-violet' : 'text-secondary'}`}>
                              {cls}
                            </span>
                            <div className="lab2-prob-track">
                              <div
                                className={`lab2-prob-bar ${isPred ? 'bg-violet' : 'bg-secondary'}`}
                                style={{ width: `${Math.max(prob * 100, 2)}%` }}
                              />
                            </div>
                            <span className="lab2-prob-val font-mono">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Mode Collapse Explanatory Banner */}
              <div className="lab2-collapse-mini-banner mt-4">
                <AlertTriangle size={16} className="text-amber shrink-0 mt-0.5" />
                <div className="text-xs text-secondary">
                  <strong className="text-primary">Single-Class Collapse Observation: </strong>
                  Probabilities hover tightly around <strong>~20.0%</strong> across all classes, with{' '}
                  <code className="text-brand">small</code> maintaining a marginal lead (~20.2% - 20.5%).
                  This directly reflects the experiment finding where both networks converged to an invariant output.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
