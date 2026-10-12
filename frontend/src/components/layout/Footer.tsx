import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-credits">
          <p className="footer-credits-title">SignBridge — Indian Sign Language Video Recognition</p>
          <p className="footer-credits-sub">
            Comparative deep learning evaluation across Custom CNN, MobileNetV2, and CNN-LSTM models.
          </p>
        </div>

        <div className="footer-badges">
          <span className="badge badge-muted">76 ISL Classes</span>
          <span className="badge badge-muted">33 Frames / Video</span>
          <span className="badge badge-muted">224 × 224 Preprocessing</span>
          <span className="badge badge-brand">Best: MobileNetV2 67.78%</span>
        </div>
      </div>
    </footer>
  );
};
