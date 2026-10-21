import { useRef, useState } from "react";

export default function PhotoInput({ preview, onChange, onClear }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Create synthetic event
      onChange({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div className="dropzone-container">
      {preview ? (
        <div className="preview-card">
          <img src={preview} alt="Selected item" className="preview-img" />
          <div className="preview-bar">
            <span className="preview-tag">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Photo Attached
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="preview-btn-change"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </button>
              {onClear && (
                <button
                  type="button"
                  className="preview-btn-change"
                  onClick={onClear}
                  style={{ background: "rgba(220, 38, 38, 0.4)", borderColor: "rgba(239, 68, 68, 0.5)" }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`dropzone-box ${isDragOver ? "dragover" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="dropzone-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className="dropzone-title">Upload a photo of the item</div>
          <div className="dropzone-hint">Drag & drop here or choose an option below • JPG, PNG, WEBP</div>

          <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Browse Files
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => cameraInputRef.current?.click()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take Photo
            </button>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        style={{ display: "none" }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        style={{ display: "none" }}
      />
    </div>
  );
}