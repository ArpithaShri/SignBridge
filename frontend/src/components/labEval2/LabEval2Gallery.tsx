import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Filter, 
  RefreshCw, 
  Wand2, 
  Layers, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { LabEval2GalleryItem, LabEval2GenerateResponse } from '../../types';
import { getLabEval2Gallery, generateLabEval2Image } from '../../services/labEval2Api';

interface LabEval2GalleryProps {
  onTestImageWithClassifier?: (imageDataUrl: string, label: string) => void;
}

export const LabEval2Gallery: React.FC<LabEval2GalleryProps> = ({
  onTestImageWithClassifier
}) => {
  const [galleryItems, setGalleryItems] = useState<LabEval2GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Generator state
  const [genClass, setGenClass] = useState<string>('bad');
  const [genSeed, setGenSeed] = useState<number>(42);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genResult, setGenResult] = useState<LabEval2GenerateResponse | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Side-by-side comparison selection
  const [compareClass, setCompareClass] = useState<string>('bad');

  const classes = ['small', 'short', 'bad', 'big', 'fast'];

  const loadGallery = async () => {
    setLoading(true);
    try {
      const data = await getLabEval2Gallery(classFilter, typeFilter);
      setGalleryItems(data.items);
    } catch (err) {
      console.error('Failed to load gallery items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [classFilter, typeFilter]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await generateLabEval2Image(genClass, genSeed);
      setGenResult(res);
    } catch (err: any) {
      setGenError(err.message || 'Image generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomizeSeed = () => {
    setGenSeed(Math.floor(Math.random() * 900000) + 100000);
  };

  // Find real and synthetic samples for side-by-side comparison
  const realComparisonSample = galleryItems.find(
    (item) => item.class_name.toLowerCase() === compareClass.toLowerCase() && item.type === 'real'
  );
  const synthComparisonSample = galleryItems.find(
    (item) => item.class_name.toLowerCase() === compareClass.toLowerCase() && item.type === 'synthetic'
  );

  return (
    <div className="lab2-gallery-section">
      {/* Top Banner & Generator Grid */}
      <div className="lab2-grid-2col mb-6">
        {/* Live Conditional DCGAN Generator Card */}
        <div className="lab2-card lab2-generator-card">
          <div className="lab2-card-header">
            <div className="flex items-center gap-2">
              <div className="lab2-spec-icon-wrap bg-violet-subtle">
                <Wand2 size={18} className="text-violet" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Live Conditional DCGAN Generator</h3>
                <span className="text-xs text-secondary">
                  Latent Gaussian Vector (100-dim) + Class Conditioning
                </span>
              </div>
            </div>
            <span className="badge badge-violet">Live Keras 3</span>
          </div>

          <div className="lab2-generator-controls mt-4">
            <div className="lab2-form-row">
              <label className="text-xs font-semibold text-secondary">Target Sign Class:</label>
              <select
                id="select-generator-class"
                className="lab2-select"
                value={genClass}
                onChange={(e) => setGenClass(e.target.value)}
              >
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls.toUpperCase()} (Class {classes.indexOf(cls)})
                  </option>
                ))}
              </select>
            </div>

            <div className="lab2-form-row">
              <label className="text-xs font-semibold text-secondary">Latent Noise Seed:</label>
              <div className="flex gap-2">
                <input
                  id="input-generator-seed"
                  type="number"
                  className="lab2-input flex-1 font-mono"
                  value={genSeed}
                  onChange={(e) => setGenSeed(parseInt(e.target.value) || 0)}
                />
                <button
                  type="button"
                  className="btn btn-secondary px-3"
                  onClick={handleRandomizeSeed}
                  title="Randomize seed"
                >
                  <RefreshCw size={14} />
                  <span>Random</span>
                </button>
              </div>
            </div>

            <button
              id="btn-generate-image"
              type="button"
              className="btn btn-primary w-full mt-2"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Synthesizing DCGAN Sample...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Conditioned Frame</span>
                </>
              )}
            </button>

            {genError && (
              <div className="lab2-alert-error mt-3">
                <AlertCircle size={16} />
                <span>{genError}</span>
              </div>
            )}
          </div>

          {/* Generated Result Preview */}
          {genResult && (
            <div className="lab2-gen-result-box mt-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="badge badge-emerald flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Live Generated</span>
                </span>
                <span className="text-xs font-mono text-secondary">
                  Latency: {genResult.latency_ms} ms
                </span>
              </div>

              <div className="lab2-gen-preview-row mt-3">
                <div className="lab2-pixelated-frame-wrap">
                  <img
                    src={genResult.image_data_url}
                    alt={`Generated ${genResult.class_name}`}
                    className="lab2-pixelated-img"
                  />
                  <span className="lab2-res-tag">64 × 64 RGB</span>
                </div>

                <div className="lab2-gen-meta">
                  <div className="text-xs text-secondary">
                    Class: <strong className="text-primary uppercase">{genResult.class_name}</strong>
                  </div>
                  <div className="text-xs text-secondary">
                    Seed: <code className="text-brand font-mono">{genResult.seed}</code>
                  </div>
                  <div className="text-xs text-secondary">
                    Latent Noise: <span className="font-mono">z ~ N(0, 1)^100</span>
                  </div>

                  {onTestImageWithClassifier && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mt-3 w-full"
                      onClick={() => onTestImageWithClassifier(genResult.image_data_url, genResult.class_name)}
                    >
                      <span>Test in Classifier</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side-by-Side Real vs. Synthetic Comparison Card */}
        <div className="lab2-card">
          <div className="lab2-card-header">
            <div className="flex items-center gap-2">
              <div className="lab2-spec-icon-wrap bg-cyan-subtle">
                <Layers size={18} className="text-cyan" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Real vs. Synthetic Frame Comparison</h3>
                <span className="text-xs text-secondary">
                  Visual domain fidelity & artifact inspection
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-secondary">Select Class to Compare:</span>
              <div className="flex flex-wrap gap-1">
                {classes.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    className={`btn-pill ${compareClass === cls ? 'active' : ''}`}
                    onClick={() => setCompareClass(cls)}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            <div className="lab2-comparison-side-by-side">
              {/* Real Frame Box */}
              <div className="lab2-compare-column">
                <div className="lab2-compare-label text-cyan">
                  <span>Real Video Frame</span>
                  <span className="badge badge-brand">Ground Truth</span>
                </div>
                <div className="lab2-compare-img-box">
                  {realComparisonSample ? (
                    <img
                      src={realComparisonSample.url}
                      alt={`Real ${compareClass}`}
                      className="lab2-pixelated-img"
                    />
                  ) : (
                    <div className="lab2-empty-img">Real sample loading...</div>
                  )}
                  <span className="lab2-res-tag">64 × 64 RGB</span>
                </div>
                <p className="lab2-compare-caption">
                  Extracted from actual ISL signer video sequence. Contains hand posture & boundary context.
                </p>
              </div>

              {/* Synthetic Frame Box */}
              <div className="lab2-compare-column">
                <div className="lab2-compare-label text-violet">
                  <span>DCGAN Synthesized Frame</span>
                  <span className="badge badge-violet">Pre-Generated</span>
                </div>
                <div className="lab2-compare-img-box">
                  {synthComparisonSample ? (
                    <img
                      src={synthComparisonSample.url}
                      alt={`Synthetic ${compareClass}`}
                      className="lab2-pixelated-img"
                    />
                  ) : (
                    <div className="lab2-empty-img">Synthetic sample loading...</div>
                  )}
                  <span className="lab2-res-tag">64 × 64 RGB</span>
                </div>
                <p className="lab2-compare-caption">
                  Generated by class-conditioned DCGAN checkpoint. Exhibits blur, chromatic noise, and indistinct finger contours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Gallery Browsing Section */}
      <div className="lab2-card">
        <div className="lab2-gallery-filter-bar">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-brand" />
            <span className="font-semibold text-primary">Artifact Gallery</span>
            <span className="text-xs text-secondary">({galleryItems.length} indexed samples)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Filter */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-secondary">Class:</span>
              <select
                className="lab2-select-compact"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-secondary">Type:</span>
              <select
                className="lab2-select-compact"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="synthetic">Synthetic (DCGAN)</option>
                <option value="real">Real Frames</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadGallery}
              title="Refresh Gallery"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="lab2-loading-box">
            <RefreshCw size={24} className="animate-spin text-brand" />
            <span>Loading gallery samples from backend artifacts...</span>
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="lab2-empty-box">
            <span>No gallery samples match the selected filter.</span>
          </div>
        ) : (
          <div className="lab2-gallery-grid">
            {galleryItems.map((item) => (
              <div key={item.filename} className="lab2-gallery-item-card">
                <div className="lab2-gallery-img-container">
                  <img
                    src={item.url}
                    alt={`${item.class_name} sample`}
                    className="lab2-pixelated-img"
                    loading="lazy"
                  />
                  <span className={`lab2-type-pill ${item.type === 'synthetic' ? 'bg-violet' : 'bg-cyan'}`}>
                    {item.type === 'synthetic' ? 'Synthetic' : 'Real Frame'}
                  </span>
                </div>

                <div className="lab2-gallery-info">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary capitalize">{item.class_name}</span>
                    <span className="text-xs font-mono text-secondary">Class {item.class_index}</span>
                  </div>
                  <span className="text-xs text-secondary truncate block" title={item.source}>
                    {item.source}
                  </span>

                  {onTestImageWithClassifier && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs w-full mt-2"
                      onClick={() => onTestImageWithClassifier(item.url, item.class_name)}
                    >
                      <Zap size={10} />
                      <span>Classify Frame</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
