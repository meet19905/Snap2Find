export default function PhotoInput({ preview, onChange }) {
  return (
    <div className="photo-input">
      {preview ? (
        <img src={preview} alt="preview" className="photo-preview" />
      ) : (
        <div className="photo-placeholder">No photo selected</div>
      )}

      <div className="photo-buttons">
        <label className="photo-btn">
          📷 Take photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onChange}
            hidden
          />
        </label>
        <label className="photo-btn secondary">
          🖼️ Choose from gallery
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            hidden
          />
        </label>
      </div>
    </div>
  );
}