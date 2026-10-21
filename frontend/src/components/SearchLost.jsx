import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import PhotoInput from "./PhotoInput";
import ResultCard from "./ResultCard";

const CATEGORIES = ["calculator", "ID card", "wallet", "earbuds", "keys", "water bottle", "phone", "bag"];

export default function SearchLost() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("idle");
  const [searchedCategory, setSearchedCategory] = useState("");
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
    if (!image) {
      alert("Please upload or take a photo of the item you lost.");
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
      const res = await axios.post(`${API_BASE}/api/lost`, formData);
      setSearchedCategory(res.data.searched_category || "");
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
    if (searchedCategory) {
      formData.append("category", searchedCategory);
    }

    try {
      await axios.post(`${API_BASE}/api/report-lost`, formData);
      setAddedToGallery(true);
    } catch (err) {
      console.error(err);
      alert("Failed to add to gallery. Please verify the backend connection and try again.");
    } finally {
      setIsAddingToGallery(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search for Your Lost Item
        </h2>
        <p className="panel-subtitle">
          Upload an image of your item. Our computer vision engine extracts deep embeddings and cross-matches against reported finds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <PhotoInput preview={preview} onChange={handleImageChange} onClear={handleClearImage} />

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="lost-phone">
              <span>Your Contact Phone Number</span>
              <span className="form-label-required">*</span>
            </label>
            <input
              id="lost-phone"
              type="tel"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              pattern="[0-9]{10}"
              minLength={10}
              maxLength={10}
              title="Please enter a valid 10-digit mobile number"
            />
            <span className="form-hint">Required so a finder can securely coordinate returning your item.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="lost-location">
              <span>Estimated Lost Location</span>
            </label>
            <input
              id="lost-location"
              type="text"
              className="form-input"
              placeholder="e.g. Science Library, 2nd Floor, Desk 14"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <span className="form-hint">Optional: helps filter nearby items faster.</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="lost-desc">
            <span>Distinct Features or Description</span>
          </label>
          <textarea
            id="lost-desc"
            className="form-textarea"
            placeholder="Unique stickers, scratches, case color, brand specifics, or identifiers..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={status === "loading" || !image}
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
              Extracting Features & Scanning Database...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Scan & Find Visual Matches
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
            Computer Vision Pipeline Active
          </div>
          <div className="scan-desc">
            Generating 512-dimension visual embeddings and running cosine similarity search across all found items...
          </div>
        </div>
      )}

      {/* Error Banner */}
      {status === "error" && (
        <div className="gallery-callout-card" style={{ borderColor: "var(--error-border)", background: "var(--error-bg)" }}>
          <div className="callout-text">
            <h4 style={{ color: "var(--error)" }}>Search Request Failed</h4>
            <p style={{ color: "var(--text-secondary)" }}>
              Unable to reach the visual search service. Please ensure the backend and AI microservice are running, then try again.
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleSubmit}>
            Retry Search
          </button>
        </div>
      )}

      {/* Search Results */}
      {status === "success" && (
        <div>
          {/* AI Category Detection Header */}
          {searchedCategory && (
            <div className="ai-detection-card">
              <div className="ai-detection-info">
                <div className="ai-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <div className="ai-detection-label">AI Detected Classification</div>
                  <div className="ai-detection-value">{searchedCategory}</div>
                </div>
              </div>

              <div className="category-select-wrapper">
                <select
                  className="form-select"
                  value={searchedCategory}
                  onChange={(e) => setSearchedCategory(e.target.value)}
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

          {/* Add to Gallery Prompt */}
          {!addedToGallery ? (
            <div className="gallery-callout-card">
              <div className="callout-text">
                <h4>Didn't find your item among the matches?</h4>
                <p>Register this lost item in the public gallery so community finders can match and contact you.</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToGallery}
                disabled={isAddingToGallery}
              >
                {isAddingToGallery ? "Listing..." : "Post to Public Lost Gallery"}
              </button>
            </div>
          ) : (
            <div className="gallery-callout-card" style={{ borderColor: "var(--success-border)", background: "var(--success-bg)" }}>
              <div className="callout-text">
                <h4 style={{ color: "var(--success)" }}>Listed in Public Gallery</h4>
                <p style={{ color: "var(--text-secondary)" }}>Your item is now actively tracked. If anyone reports finding it, they will be prompted to contact you.</p>
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="results-header-bar">
            <h3 className="results-heading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Matching Candidates ({matches.length})
            </h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Ranked by visual similarity</span>
          </div>

          {matches.length > 0 ? (
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
          ) : (
            <div className="gallery-callout-card" style={{ textAlign: "center", justifyContent: "center" }}>
              <div className="callout-text">
                <h4>No Close Visual Matches Found Yet</h4>
                <p>Be sure you've posted your lost item to the gallery above so you can be notified when it turns up.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}