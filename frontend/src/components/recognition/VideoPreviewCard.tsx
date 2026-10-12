import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Film, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatFileSize } from '../../services/recognitionApi';

interface VideoPreviewCardProps {
  file: File;
  previewUrl: string;
  duration?: number;
  onDurationLoaded: (duration: number) => void;
}

export const VideoPreviewCard = ({
  file,
  previewUrl,
  duration,
  onDurationLoaded
}: VideoPreviewCardProps) => {
  const [videoError, setVideoError] = useState(false);
  const [resolution, setResolution] = useState<string | null>(null);

  const handleLoadedMetadata = (e: SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.currentTarget;
    if (target.duration && !isNaN(target.duration) && isFinite(target.duration)) {
      onDurationLoaded(target.duration);
    }
    if (target.videoWidth && target.videoHeight) {
      setResolution(`${target.videoWidth} × ${target.videoHeight}`);
    }
    setVideoError(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const extension = file.name.split('.').pop()?.toUpperCase() || 'VIDEO';

  return (
    <div className="video-preview-card fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Film size={18} style={{ color: 'var(--brand-400)' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Selected Video Clip</h4>
        </div>
        <span className="badge badge-success">
          <CheckCircle2 size={13} />
          <span>Ready for Analysis</span>
        </span>
      </div>

      <div className="video-player-container">
        {!videoError ? (
          <video
            key={previewUrl}
            src={previewUrl}
            controls
            playsInline
            className="video-player-element"
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleVideoError}
          >
            Your browser does not support HTML5 video preview.
          </video>
        ) : (
          <div className="video-unsupported-notice">
            <AlertTriangle size={36} style={{ color: 'var(--accent-amber)' }} />
            <h5 style={{ color: '#fff', fontSize: '0.95rem' }}>Codec Not Supported for In-Browser Playback</h5>
            <p style={{ fontSize: '0.8rem', maxWidth: '340px' }}>
              Your browser cannot decode this <code>.{extension}</code> codec natively. However, the file is valid and
              the backend OpenCV pipeline will extract all 33 frames during inference.
            </p>
          </div>
        )}
      </div>

      <div className="video-meta-grid">
        <div className="video-meta-cell">
          <span className="video-meta-key">File Name</span>
          <span className="video-meta-val" title={file.name}>
            {file.name}
          </span>
        </div>

        <div className="video-meta-cell">
          <span className="video-meta-key">File Size</span>
          <span className="video-meta-val">{formatFileSize(file.size)}</span>
        </div>

        <div className="video-meta-cell">
          <span className="video-meta-key">Duration</span>
          <span className="video-meta-val">
            {duration ? `${duration.toFixed(2)}s` : 'Reading...'}
          </span>
        </div>

        <div className="video-meta-cell">
          <span className="video-meta-key">Container Format</span>
          <span className="video-meta-val">.{extension}</span>
        </div>

        <div className="video-meta-cell">
          <span className="video-meta-key">Source Dimensions</span>
          <span className="video-meta-val">{resolution || 'Standard RGB'}</span>
        </div>

        <div className="video-meta-cell">
          <span className="video-meta-key">Target Preprocessing</span>
          <span className="video-meta-val" style={{ color: 'var(--brand-400)' }}>
            33 f / 224×224
          </span>
        </div>
      </div>
    </div>
  );
};
