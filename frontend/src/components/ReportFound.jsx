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
      alert("Please upload a photo of the item and enter your contact number.");
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
      alert("Failed to post to the board. Please try again.");
    } finally {
      setIsAddingToGallery(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--info)" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          Report an Item You Found
        </h2>
        <p className="panel-subtitle">
          Found something that belongs to someone else? Take a photo to see if they're actively searching for it, or list it so they can claim it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <PhotoInput preview={preview} onChange={handleImageChange} onClear={handleClearImage} />

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="found-phone">
              <span>Your Phone Number</span>
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
            <span className="form-hint">So the verified owner can reach you to collect their belonging.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="found-location">
              <span>Where did you find it?</span>
            </label>
            <input
              id="found-location"
              type="text"
              className="form-input"
              placeholder="e.g. Cafeteria Table 12, Student Center"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <span className="form-hint">Or where it is currently placed (e.g. with receptionist).</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="found-desc">
            <span>Condition or handover notes</span>
          </label>
          <textarea
            id="found-desc"
            className="form-textarea"
            placeholder="Describe condition, or if you submitted it to a campus desk or security guard..."
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
              Checking active lost reports...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Check If Reported Missing
            </>
          )}
        </button>
      </form>

      {/* Human Loading Indicator */}
      {status === "loading" && (
        <div className="ai-scan-banner">
          <div className="scan-line" />
          <div className="scan-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
              <path d="M12 6v6l4 2" />
            </svg>
            Checking database for matching lost reports
          </div>
          <div className="scan-desc">
            Matching photo against active inquiries submitted by people looking for this item...
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="gallery-callout-card" style={{ borderColor: "var(--error-border)", background: "var(--error-bg)" }}>
          <div className="callout-text">
            <h4 style={{ color: "var(--error)" }}>Could not submit report</h4>
            <p style={{ color: "var(--text-secondary)" }}>
              Unable to reach the server. Please verify your connection and try again.
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleSubmit}>
            Try Again
          </button>
        </div>
      )}

      {/* Success View */}
      {status === "success" && (
        <div>
          {/* Category Confirmation */}
          {resultCategory && (
            <div className="ai-detection-card">
              <div className="ai-detection-info">
                <div className="ai-icon-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </div>
                <div>
                  <div className="ai-detection-label">Identified Item Type</div>
                  <div className="ai-detection-value">{resultCategory}</div>
                </div>
              </div>

              <div className="category-select-wrapper">
                <select
                  className="form-select"
                  value={resultCategory}
                  onChange={(e) => setResultCategory(e.target.value)}
                  aria-label="Change category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      Change to: {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Add to Public Board */}
          {!addedToGallery ? (
            <div className="gallery-callout-card">
              <div className="callout-text">
                <h4>Publish to the Lost & Found Board</h4>
                <p>Help the owner spot this item by listing it in the public community gallery.</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToGallery}
                disabled={isAddingToGallery}
              >
                {isAddingToGallery ? "Publishing..." : "Publish to Community Board"}
              </button>
            </div>
          ) : (
            <div className="gallery-callout-card" style={{ borderColor: "var(--success-border)", background: "var(--success-bg)" }}>
              <div className="callout-text">
                <h4 style={{ color: "var(--success)" }}>Published to Lost & Found Board</h4>
                <p style={{ color: "var(--text-secondary)" }}>Thank you for helping! The owner can now see this listing and reach out to you.</p>
              </div>
            </div>
          )}

          {/* Matching Lost Inquiries */}
          {matches.length > 0 ? (
            <div>
              <div className="results-header-bar">
                <h3 className="results-heading">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Matching Inquiries from Owners ({matches.length})
                </h3>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Someone is searching for this</span>
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
                <h4>No one has reported this lost yet</h4>
                <p>Be sure you've published it to the board above so when the owner searches, they'll find it right away.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}