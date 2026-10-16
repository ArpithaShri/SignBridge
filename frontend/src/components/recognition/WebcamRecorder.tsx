import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Square, Camera, AlertCircle, CheckCircle2, RotateCcw, X, RefreshCw, AlertTriangle } from 'lucide-react';

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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCameraMuted, setIsCameraMuted] = useState(false);
  const [activeResolution, setActiveResolution] = useState<string>('');

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

  // Enumerate camera devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Could not enumerate video devices:', e);
    }
  }, [selectedDeviceId]);

  const startCamera = useCallback(async (deviceIdToUse?: string) => {
    setState('requesting');
    setErrorMsg(null);
    setIsCameraMuted(false);

    // Stop existing stream if switching devices
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam media capture is not supported in this browser.');
      }

      const targetId = deviceIdToUse || selectedDeviceId;

      // Primary constraints: try requested device or facingMode user with standard resolutions
      const constraints: MediaStreamConstraints = {
        video: targetId
          ? {
              deviceId: { exact: targetId },
              width: { ideal: 1280, min: 480 },
              height: { ideal: 720, min: 360 }
            }
          : {
              facingMode: 'user',
              width: { ideal: 1280, min: 480 },
              height: { ideal: 720, min: 360 }
            },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback to minimal video constraints if ideal resolutions failed
        stream = await navigator.mediaDevices.getUserMedia({
          video: targetId ? { deviceId: { exact: targetId } } : true,
          audio: false
        });
      }

      streamRef.current = stream;

      // Track mute listeners (catches hardware privacy shutters or OS camera mute)
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = true;
        if (videoTrack.muted) {
          setIsCameraMuted(true);
        }
        videoTrack.onmute = () => setIsCameraMuted(true);
        videoTrack.onunmute = () => setIsCameraMuted(false);

        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setActiveResolution(`${settings.width}×${settings.height}`);
        }
      }

      // Bind directly to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.defaultMuted = true;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch((err) => {
              console.warn('Video preview play rejected:', err);
            });
            if (videoRef.current.videoWidth && videoRef.current.videoHeight) {
              setActiveResolution(`${videoRef.current.videoWidth}×${videoRef.current.videoHeight}`);
            }
          }
        };

        await videoRef.current.play().catch(() => {});
      }

      setState('preview');
      // Refresh device list to populate camera device labels
      await updateDeviceList();
    } catch (err: unknown) {
      let msg = 'Could not access camera device.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Camera permission denied. Please allow camera access in your browser settings to record sign gestures.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera device found. Please connect a webcam or enable your device camera.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'Camera is currently in use by another program (e.g. Zoom, Teams) or blocked by Windows privacy settings.';
        } else if (err.name === 'OverconstrainedError') {
          msg = 'The requested camera resolution is not supported by this device.';
        } else {
          msg = `Camera error (${err.name}): ${err.message}`;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }

      setErrorMsg(msg);
      setState('error');
    }
  }, [selectedDeviceId, stopStream, updateDeviceList]);

  // Request camera when recorder mounts
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Handle switching camera device
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

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
    let mimeType = 'video/webm;codecs=vp8';
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

      // Ensure preview remains playing during recording
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }

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
        padding: '1.25rem 1.5rem',
        border: '1.5px solid var(--border-glow)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        position: 'relative',
        boxShadow: 'var(--shadow-md)'
      }}
    >
      {/* Header with Camera Selector and Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: 'rgba(99,102,241,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-glow)'
            }}
          >
            <Camera size={18} style={{ color: 'var(--brand-400)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Live Camera Gesture Recorder
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Frame yourself in center • 33 uniform frames sampled on completion
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

        {/* Device Selection & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {devices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              disabled={state === 'recording'}
              className="lab2-select"
              style={{
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.775rem',
                maxWidth: '220px',
                cursor: 'pointer'
              }}
              title="Switch camera device"
            >
              {devices.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId}>
                  {d.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => startCamera()}
            title="Refresh camera stream"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              fontSize: '0.775rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <RefreshCw size={13} />
            <span>Reload</span>
          </button>

          <button
            id="btn-webcam-close"
            type="button"
            onClick={handleClose}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              fontSize: '0.775rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Shutter / Privacy Warning Banner */}
      {isCameraMuted && state !== 'error' && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            borderRadius: '10px',
            color: 'var(--status-warning-text)',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem'
          }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--status-warning-text)' }}>Webcam sensor is muted / privacy shutter is closed:</strong>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.775rem' }}>
              Your laptop’s physical camera privacy slider is covering the lens, or your camera toggle key (e.g. F8 / F10 / Fn+F6) or Windows Camera Privacy is off. Open the lens slider to see your video feed.
            </p>
          </div>
        </div>
      )}

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

      {/* Video Viewport Container */}
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#040711',
          border: state === 'recording' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
          boxShadow: state === 'recording' ? '0 0 24px rgba(239,68,68,0.35)' : 'none',
          minHeight: '300px',
          height: '340px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border 0.3s ease, box-shadow 0.3s ease'
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
            <div className="loading-spinner-ring" style={{ width: 34, height: 34, borderWidth: 3 }} />
            <span style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 500 }}>
              Connecting to camera feed…
            </span>
          </div>
        )}

        {/* Video Element for live preview & recorded playback */}
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000',
            display: state === 'idle' || state === 'error' ? 'none' : 'block',
            transform: state !== 'done' ? 'scaleX(-1)' : 'none' /* Mirror live camera */
          }}
          playsInline
          autoPlay
          muted
        />

        {/* Gesture Center Framing Target (visible in preview to guide user) */}
        {state === 'preview' && !isCameraMuted && (
          <div
            style={{
              position: 'absolute',
              inset: '20px',
              border: '1.5px dashed rgba(99, 102, 241, 0.35)',
              borderRadius: '12px',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '8px'
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                background: 'rgba(15, 23, 42, 0.75)',
                color: 'rgba(255,255,255,0.7)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              Position Hands and Upper Body Inside Frame
            </span>
          </div>
        )}

        {/* Live overlay guide indicator */}
        {(state === 'preview' || state === 'recording') && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '0.3rem 0.65rem',
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(4px)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: state === 'recording' ? '#f87171' : '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              border: `1px solid ${state === 'recording' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(52, 211, 153, 0.3)'}`,
              pointerEvents: 'none'
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: state === 'recording' ? '#ef4444' : '#34d399',
                display: 'inline-block',
                animation: state === 'recording' ? 'pulse 1s infinite' : 'none'
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {state === 'recording' ? 'Recording Gesture...' : 'Live Camera Active'}
            </span>
            {activeResolution && (
              <span style={{ opacity: 0.65, fontSize: '0.7rem' }}>• {activeResolution}</span>
            )}
          </div>
        )}

        {/* Recording progress bar overlay */}
        {state === 'recording' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '5px',
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
            onClick={() => startCamera()}
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
