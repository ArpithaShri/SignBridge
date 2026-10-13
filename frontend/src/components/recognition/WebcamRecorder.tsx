import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Square, Camera, AlertCircle, CheckCircle2, RotateCcw, X } from 'lucide-react';

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

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount or when modal is closed
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [stopStream, recordedUrl]);

  // Synchronize stream with video element whenever state transitions to preview or recording
  useEffect(() => {
    if ((state === 'preview' || state === 'recording') && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Video preview play notification:', err);
      });
    }
  }, [state]);

  const startCamera = useCallback(async () => {
    setState('requesting');
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam media capture is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      setState('preview');
    } catch (err: unknown) {
      let msg = 'Could not access camera device.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Camera permission denied. Please allow camera access in your browser settings to record sign gestures.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera device found. Please connect a webcam or enable your device camera.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'Camera is currently in use by another program or browser tab.';
        } else {
          msg = `Camera error (${err.name}): ${err.message}`;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }

      setErrorMsg(msg);
      setState('error');
    }
  }, []);

  // Automatically request camera when recorder opens
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setElapsed(0);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }

    // Determine highest quality supported mime type
    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(finalBlob);
        setRecordedBlob(finalBlob);
        setRecordedUrl(url);
        setState('done');

        // Play recorded clip preview in video element
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.muted = false;
          videoRef.current.loop = true;
          videoRef.current.play().catch(() => {});
        }
      };

      recorder.start(100); // 100ms chunk frequency for smooth buffering
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
    } catch (err: unknown) {
      setErrorMsg(`Failed to start recording: ${err instanceof Error ? err.message : String(err)}`);
      setState('error');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore recorder stop errors
      }
    }
    stopStream();
  };

  const handleUseRecording = () => {
    if (!recordedBlob) return;
    const isMp4 = recordedBlob.type.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';
    const filename = `isl_recording_${Date.now()}.${ext}`;
    const file = new File([recordedBlob], filename, {
      type: recordedBlob.type || 'video/webm',
      lastModified: Date.now()
    });

    stopStream();
    onRecordingComplete(file);
  };

  const handleRetake = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setElapsed(0);
    startCamera();
  };

  const handleClose = () => {
    stopStream();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    onClose();
  };

  const remainingSeconds = MAX_RECORD_SECONDS - elapsed;
  const progressPercent = (elapsed / MAX_RECORD_SECONDS) * 100;

  return (
    <div
      className="glass-card fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem',
        border: '1.5px solid rgba(99,102,241,0.4)',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        position: 'relative',
        boxShadow: '0 12px 36px rgba(0,0,0,0.45)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'rgba(99,102,241,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(99,102,241,0.35)'
            }}
          >
            <Camera size={18} style={{ color: 'var(--brand-400)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
              Live Camera Gesture Recorder
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Uniform 33-frame extraction applied on completion
            </div>
          </div>
          {state === 'recording' && (
            <span
              className="badge"
              style={{
                background: 'rgba(239,68,68,0.2)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ef4444',
                  display: 'inline-block',
                  animation: 'pulse 1s infinite'
                }}
              />
              REC {remainingSeconds}s
            </span>
          )}
        </div>

        <button
          id="btn-webcam-close"
          type="button"
          onClick={handleClose}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--text-secondary)',
            borderRadius: '8px',
            padding: '0.4rem 0.75rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'background 0.2s ease'
          }}
        >
          <X size={14} />
          <span>Close</span>
        </button>
      </div>

      {/* Error state alert */}
      {state === 'error' && (
        <div className="validation-error-alert" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h5 style={{ fontWeight: 700, margin: '0 0 0.2rem 0' }}>Camera Unavailable</h5>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Video Container — Always present for immediate preview binding */}
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#090d16',
          border: '1px solid rgba(255,255,255,0.1)',
          minHeight: '260px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Loading / Requesting overlay */}
        {state === 'requesting' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              background: 'rgba(11, 15, 25, 0.9)',
              zIndex: 2
            }}
          >
            <div className="loading-spinner-ring" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <span style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 500 }}>
              Connecting to camera device…
            </span>
          </div>
        )}

        {/* Video Element for live preview & recorded playback */}
        <video
          ref={videoRef}
          style={{
            width: '100%',
            maxHeight: '320px',
            objectFit: 'cover',
            display: state === 'idle' || state === 'error' ? 'none' : 'block',
            transform: state !== 'done' ? 'scaleX(-1)' : 'none' /* Mirror live camera */
          }}
          playsInline
          autoPlay
          muted={state !== 'done'}
        />

        {/* Live overlay guide indicator */}
        {(state === 'preview' || state === 'recording') && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '0.3rem 0.65rem',
              background: 'rgba(0,0,0,0.65)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              pointerEvents: 'none'
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#34d399',
                display: 'inline-block'
              }}
            />
            <span>Live Camera Feed (Continuous)</span>
          </div>
        )}

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

      {/* Done success banner */}
      {state === 'done' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: 'var(--accent-emerald)'
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>Gesture recorded ({elapsed}s). Review playback above, then proceed to recognition or retake.</span>
        </div>
      )}

      {/* Action buttons bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {state === 'idle' || state === 'error' ? (
          <button
            id="btn-webcam-start-camera"
            type="button"
            className="btn btn-primary"
            onClick={startCamera}
            style={{ flex: 1 }}
          >
            <Camera size={16} />
            <span>Retry Camera Access</span>
          </button>
        ) : state === 'requesting' ? (
          <button type="button" className="btn btn-primary" disabled style={{ flex: 1 }}>
            <div className="loading-spinner-ring" style={{ width: 16, height: 16, borderWidth: 2 }} />
            <span>Initializing Camera…</span>
          </button>
        ) : state === 'preview' ? (
          <button
            id="btn-webcam-start-record"
            type="button"
            className="btn btn-primary"
            onClick={startRecording}
            style={{ flex: 1, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', borderColor: '#ef4444' }}
          >
            <Video size={16} />
            <span>Start Recording Sign (Max {MAX_RECORD_SECONDS}s)</span>
          </button>
        ) : state === 'recording' ? (
          <button
            id="btn-webcam-stop-record"
            type="button"
            className="btn btn-secondary"
            onClick={stopRecording}
            style={{ flex: 1, borderColor: '#ef4444', color: '#f87171' }}
          >
            <Square size={16} fill="currentColor" />
            <span>Stop Recording ({remainingSeconds}s remaining)</span>
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
              <span>Use This Video for Inference</span>
            </button>
            <button
              id="btn-webcam-retake"
              type="button"
              className="btn btn-secondary"
              onClick={handleRetake}
            >
              <RotateCcw size={16} />
              <span>Retake</span>
            </button>
          </>
        ) : null}
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>
        Record a clear, centered ISL gesture. The video will be sampled to 33 frames and dispatched directly to your selected model.
      </p>
    </div>
  );
};
