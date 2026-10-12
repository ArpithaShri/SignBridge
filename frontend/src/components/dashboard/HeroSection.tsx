import React from 'react';
import { ArrowRight, BarChart2, Video, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onStartRecognition: () => void;
  onCompareModels: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartRecognition, onCompareModels }) => {
  return (
    <section className="hero-section" aria-labelledby="hero-heading">
      <div className="hero-pill">
        <Sparkles size={14} />
        <span>76-Class Indian Sign Language Recognition System</span>
      </div>

      <h1 id="hero-heading" className="hero-title">
        Bridging Silence & Understanding with{' '}
        <span className="gradient-text">SignBridge AI</span>
      </h1>

      <p className="hero-subtitle">
        An end-to-end deep learning framework designed to recognize 76 dynamic Indian Sign Language (ISL) word classes
        from RGB video clips. Benchmarking Custom CNN, MobileNetV2 transfer learning, and spatio-temporal CNN-LSTM models.
      </p>

      <div className="hero-cta-group">
        <button
          id="btn-hero-start-recognition"
          type="button"
          className="btn btn-primary"
          onClick={onStartRecognition}
        >
          <Video size={18} />
          <span>Start Video Recognition</span>
          <ArrowRight size={16} />
        </button>

        <button
          id="btn-hero-compare-models"
          type="button"
          className="btn btn-secondary"
          onClick={onCompareModels}
        >
          <BarChart2 size={18} />
          <span>Compare 3 Model Architectures</span>
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="metrics-bar-grid">
        <div className="metric-stat-card">
          <span className="metric-label">Dataset Classes</span>
          <div className="metric-value">
            <span>76</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--brand-400)', fontWeight: 600 }}>ISL Words</span>
          </div>
          <span className="metric-detail">Greetings, Relations, Actions & Common Nouns</span>
        </div>

        <div className="metric-stat-card">
          <span className="metric-label">Temporal Sampling</span>
          <div className="metric-value">
            <span>33</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Frames/Clip</span>
          </div>
          <span className="metric-detail">Uniform sampling across dynamic gestures</span>
        </div>

        <div className="metric-stat-card">
          <span className="metric-label">Top Test Accuracy</span>
          <div className="metric-value">
            <span>67.78</span>
            <span style={{ fontSize: '1rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>%</span>
          </div>
          <span className="metric-detail">MobileNetV2 (Frozen Backbone Transfer)</span>
        </div>

        <div className="metric-stat-card">
          <span className="metric-label">Input Preprocessing</span>
          <div className="metric-value">
            <span>224×224</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-violet)', fontWeight: 600 }}>RGB</span>
          </div>
          <span className="metric-detail">Standardized normalized frame dimensions</span>
        </div>
      </div>
    </section>
  );
};
