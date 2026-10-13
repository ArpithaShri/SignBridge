import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Square, Camera, CameraOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WebcamRecorderProps {
  onRecordingComplete: (file: File) => void;
  onClose: () => void;
}

type RecorderState = 'idle' | 'requesting' | 'preview' | 'recording' | 'done' | 'error';

const MAX_RECORD_SECONDS = 10;

export const WebcamRecorder = ({ onRecordingComplete, onClose }: WebcamRecorderProps) => {
  const [state, setState] = useState<RecorderState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = useCallback(async () => {
    setState('requesting');
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      setState('preview');
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err instanceof DOMException && err.name === 'NotFoundError'
          ? 'No camera device found. Please connect a webcam.'
          : `Could not access camera: ${err instanceof Error ? err.message : String(err)}`;
      setErrorMsg(msg);
      setState('error');
    }
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setElapsed(0);
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);

    // Prefer mp4 > webm
    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setState('done');

      // Show recorded clip in video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
        videoRef.current.loop = true;
        videoRef.current.play().catch(() => {});
      }
    };

    recorder.start(200); // collect data every 200ms
    setState('recording');

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= MAX_RECORD_SECONDS) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    stopStream();
  };

  const handleUseRecording = () => {
    if (!recordedBlob) return;
    const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([recordedBlob], `webcam_sign_recording.${ext}`, {
      type: recordedBlob.type,
      lastModified: Date.now()
    });
    onRecordingComplete(file);
  };

  const handleRetake = () => {
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setElapsed(0);
    setState('idle');
  };

  const remainingSeconds = MAX_RECORD_SECONDS - elapsed;
  const progressPercent = (elapsed / MAX_RECORD_SECONDS) * 100;

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem',
        border: '1px solid rgba(99,102,241,0.35)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Camera size={18} style={{ color: 'var(--brand-400)' }} />
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
            Live Webcam Recording
          </span>
          {state === 'recording' && (
            <span
              className="badge"
              style={{
                background: 'rgba(239,68,68,0.2)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                animation: 'pulse 1.2s ease-in-out infinite'
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ef4444',
                  display: 'inline-block'
                }}
              />
              REC {remainingSeconds}s
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--text-secondary)',
            borderRadius: '6px',
            padding: '0.3rem 0.65rem',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Error state */}
      {state === 'error' && (
        <div className="validation-error-alert" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <h5>Camera Error</h5>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Video preview */}
      {(state === 'preview' || state === 'recording' || state === 'done') && (
        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              maxHeight: '280px',
              objectFit: 'cover',
              display: 'block',
              transform: state !== 'done' ? 'scaleX(-1)' : 'none' /* mirror live feed */
            }}
            playsInline
          />

          {/* Recording progress bar overlay */}
          {state === 'recording' && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '4px',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #6366f1, #ef4444)',
                transition: 'width 1s linear',
                borderRadius: '0 2px 2px 0'
              }}
            />
          )}
        </div>
      )}

      {/* Done success banner */}
      {state === 'done' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 1rem',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: 'var(--accent-emerald)'
          }}
        >
          <CheckCircle2 size={18} />
          <span>Recording complete ({elapsed}s). Preview above, then use or retake.</span>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        {state === 'idle' || state === 'error' ? (
          <button
            id="btn-webcam-start-camera"
            type="button"
            className="btn btn-primary"
            onClick={startCamera}
            style={{ flex: 1 }}
          >
            <Camera size={16} />
            <span>Open Camera</span>
          </button>
        ) : state === 'requesting' ? (
          <button type="button" className="btn btn-primary" disabled style={{ flex: 1 }}>
            <div className="loading-spinner-ring" style={{ width: 16, height: 16, borderWidth: 2 }} />
            <span>Requesting Permission…</span>
          </button>
        ) : state === 'preview' ? (
          <button
            id="btn-webcam-start-record"
            type="button"
            className="btn btn-primary"
            onClick={startRecording}
            style={{ flex: 1, background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }}
          >
            <Video size={16} />
            <span>Start Recording (max {MAX_RECORD_SECONDS}s)</span>
          </button>
        ) : state === 'recording' ? (
          <button
            id="btn-webcam-stop-record"
            type="button"
            className="btn btn-secondary"
            onClick={stopRecording}
            style={{ flex: 1 }}
          >
            <Square size={16} fill="currentColor" />
            <span>Stop Recording</span>
          </button>
        ) : state === 'done' ? (
          <>
            <button
              id="btn-webcam-use-recording"
              type="button"
              className="btn btn-primary"
              onClick={handleUseRecording}
              style={{ flex: 1 }}
            >
              <CheckCircle2 size={16} />
              <span>Use This Recording</span>
            </button>
            <button
              id="btn-webcam-retake"
              type="button"
              className="btn btn-secondary"
              onClick={handleRetake}
            >
              <CameraOff size={16} />
              <span>Retake</span>
            </button>
          </>
        ) : null}
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
        Tip: Perform a clear ISL gesture in front of the camera. Recording is capped at {MAX_RECORD_SECONDS} seconds.
        The video will be sent to MobileNetV2 inference just like an uploaded file.
      </p>
    </div>
  );
};
