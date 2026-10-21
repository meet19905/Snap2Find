import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import PhotoInput from "./PhotoInput";
import ResultCard from "./ResultCard";

const CATEGORIES = ["calculator", "ID card", "wallet", "earbuds", "keys", "water bottle", "phone", "bag"];

export default function ReportFound() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("idle");
  const [resultCategory, setResultCategory] = useState("");
  const [matches, setMatches] = useState([]);
  const [addedToGallery, setAddedToGallery] = useState(false);
  const [isAddingToGallery, setIsAddingToGallery] = useState(false);

  function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleClearImage() {
    setImage(null);
    setPreview(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!image || !phone) {
      alert("Please upload a photo and provide your phone number so the owner can contact you.");
      return;
    }

    setStatus("loading");
    setAddedToGallery(false);
    const formData = new FormData();
    formData.append("image", image);
    formData.append("phone_number", phone);
    formData.append("description", description);
    formData.append("location", location);

    try {
      const res = await axios.post(`${API_BASE}/api/found`, formData);
      setResultCategory(res.data.category || "");
      setMatches(res.data.matches || []);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  async function handleAddToGallery() {
    if (!image) return;
    setIsAddingToGallery(true);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("phone_number", phone);
    formData.append("description", description);
    formData.append("location", location);
    if (resultCategory) {
      formData.append("category", resultCategory);
    }

    try {
      await axios.post(`${API_BASE}/api/report-found`, formData);
      setAddedToGallery(true);
    } catch (err) {
      console.error(err);
      alert("Failed to add to gallery. Please verify backend connection and try again.");
    } finally {
      setIsAddingToGallery(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--info)" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          Report an Item You Found
        </h2>
        <p className="panel-subtitle">
          Help reunite an item with its owner. Take a picture, add pickup or handoff location, and check if an owner is actively searching.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <PhotoInput preview={preview} onChange={handleImageChange} onClear={handleClearImage} />

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="found-phone">
              <span>Your Contact Phone Number</span>
              <span className="form-label-required">*</span>
            </label>
            <input
              id="found-phone"
              type="tel"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              pattern="[0-9]{10}"
              minLength={10}
              maxLength={10}
              title="Please enter a valid 10-digit phone number"
            />
            <span className="form-hint">So the verified owner can coordinate returning their item.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="found-location">
              <span>Discovery / Holding Location</span>
            </label>
            <input
              id="found-location"
              type="text"
              className="form-input"
              placeholder="e.g. Campus Cafeteria, Lost & Found Office"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <span className="form-hint">Where you spotted it or where it's currently held.</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="found-desc">
            <span>Condition or Distinct Features</span>
          </label>
          <textarea
            id="found-desc"
            className="form-textarea"
            placeholder="Details about where exactly it was found, physical condition, distinctive stickers..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={status === "loading" || !image || !phone}
        >
          {status === "loading" ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
              Classifying & Checking Active Lost Reports...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Check for Matching Lost Reports
            </>
          )}
        </button>
      </form>

      {/* AI Scanning Active Banner */}
      {status === "loading" && (
        <div className="ai-scan-banner">
          <div className="scan-line" />
          <div className="scan-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
              <path d="M12 6v6l4 2" />
            </svg>
            AI Classification & Matching Active
          </div>
          <div className="scan-desc">
            Classifying object category and searching reported lost inquiries for potential matches...
          </div>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="gallery-callout-card" style={{ borderColor: "var(--error-border)", background: "var(--error-bg)" }}>
          <div className="callout-text">
            <h4 style={{ color: "var(--error)" }}>Submission Error</h4>
            <p style={{ color: "var(--text-secondary)" }}>
              Unable to record found item. Check backend connectivity and try again.
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleSubmit}>
            Retry
          </button>
        </div>
      )}

      {/* Success State */}
      {status === "success" && (
        <div>
          {/* AI Category Detection */}
          {resultCategory && (
            <div className="ai-detection-card">
              <div className="ai-detection-info">
                <div className="ai-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <div className="ai-detection-label">AI Category Identified</div>
                  <div className="ai-detection-value">{resultCategory}</div>
                </div>
              </div>

              <div className="category-select-wrapper">
                <select
                  className="form-select"
                  value={resultCategory}
                  onChange={(e) => setResultCategory(e.target.value)}
                  aria-label="Correct Category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      Category: {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Add to Gallery Card */}
          {!addedToGallery ? (
            <div className="gallery-callout-card">
              <div className="callout-text">
                <h4>List in Public Found Gallery</h4>
                <p>Allow anyone browsing the lost & found board to spot and claim this item.</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToGallery}
                disabled={isAddingToGallery}
              >
                {isAddingToGallery ? "Publishing..." : "Add to Public Found Board"}
              </button>
            </div>
          ) : (
            <div className="gallery-callout-card" style={{ borderColor: "var(--success-border)", background: "var(--success-bg)" }}>
              <div className="callout-text">
                <h4 style={{ color: "var(--success)" }}>Published to Found Gallery</h4>
                <p style={{ color: "var(--text-secondary)" }}>Thank you! The item is now listed in the public directory so the rightful owner can find and verify it.</p>
              </div>
            </div>
          )}

          {/* Matches Section */}
          {matches.length > 0 ? (
            <div>
              <div className="results-header-bar">
                <h3 className="results-heading">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Matching Lost Reports ({matches.length})
                </h3>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Someone might be looking for this</span>
              </div>

              <div className="results-grid">
                {matches.map((match) => (
                  <ResultCard
                    key={match.id}
                    match={match}
                    hideClaimButton={false}
                    onRecovered={(id) =>
                      setMatches((prev) =>
                        prev.map((m) => (m.id === id ? { ...m, status: "recovered" } : m))
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="gallery-callout-card" style={{ textAlign: "center", justifyContent: "center" }}>
              <div className="callout-text">
                <h4>No Pending Lost Inquiries Match Yet</h4>
                <p>The owner hasn't submitted a search yet. By publishing to the gallery above, they will see it when they check!</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}