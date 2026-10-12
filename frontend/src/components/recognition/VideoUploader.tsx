import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileCheck } from 'lucide-react';
import { validateVideoFile } from '../../services/recognitionApi';

interface VideoUploaderProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  errorMessage: string | null;
  onClearError: () => void;
}

export const VideoUploader = ({
  onFileSelected,
  selectedFile,
  errorMessage,
  onClearError
}: VideoUploaderProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    onClearError();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onClearError();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      onFileSelected(file);
      return;
    }
    onFileSelected(file);
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="uploader-section-wrapper">
      <div
        className={`dropzone-container ${isDragActive ? 'is-drag-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerPicker}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerPicker()}
        aria-label="Upload video area. Drag and drop a file or click to browse"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="file-input-hidden"
          accept=".mov,.mp4,.avi,video/quicktime,video/mp4,video/x-msvideo,video/avi"
          onChange={handleFileInputChange}
          id="isl-video-file-input"
        />

        <div className="dropzone-icon-box">
          {selectedFile ? <FileCheck size={36} /> : <UploadCloud size={36} />}
        </div>

        <h3 className="dropzone-title">
          {selectedFile ? 'Replace Selected Video Clip' : 'Drag & Drop ISL Video Clip'}
        </h3>

        <p className="dropzone-subtitle">
          Upload short RGB video recordings of Indian Sign Language gestures. Supports native{' '}
          <strong>.MOV</strong>, <strong>.MP4</strong>, and <strong>.AVI</strong> up to 100 MB.
        </p>

        <div className="dropzone-formats-row">
          <span className="badge badge-brand">.MOV (Primary Dataset Format)</span>
          <span className="badge badge-muted">.MP4</span>
          <span className="badge badge-muted">.AVI</span>
          <span className="badge badge-muted">Max 100 MB</span>
        </div>
      </div>

      {errorMessage && (
        <div className="validation-error-alert" role="alert">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
            <div>
              <h5>File Validation Error</h5>
              <p>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
