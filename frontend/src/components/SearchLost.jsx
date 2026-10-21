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
      alert("Could not post to the board right now. Please try again.");
    } finally {
      setIsAddingToGallery(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search for a Lost Item
        </h2>
        <p className="panel-subtitle">
          Upload a photo of what you lost. We'll search recently reported found items across campus and public spots.
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
            <span className="form-hint">So the person who found your item can contact you directly.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="lost-location">
              <span>Where do you think you lost it?</span>
            </label>
            <input
              id="lost-location"
              type="text"
              className="form-input"
              placeholder="e.g. Central Library 2nd floor, Cafeteria"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <span className="form-hint">Helps narrow down matches from the same building or area.</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="lost-desc">
            <span>Description & identifying details</span>
          </label>
          <textarea
            id="lost-desc"
            className="form-textarea"
            placeholder="Color, brand, keychains, stickers, case type, scratches, or any unique signs..."
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
              Searching reported found items...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search Database by Photo
            </>
          )}
        </button>
      </form>

      {/* Human Loading Feedback */}
      {status === "loading" && (
        <div className="ai-scan-banner">
          <div className="scan-line" />
          <div className="scan-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Comparing photo against reported items
          </div>
          <div className="scan-desc">
            Checking shape, color, and item category against all found belongings...
          </div>
        </div>
      )}

      {/* Error Banner */}
      {status === "error" && (
        <div className="gallery-callout-card" style={{ borderColor: "var(--error-border)", background: "var(--error-bg)" }}>
          <div className="callout-text">
            <h4 style={{ color: "var(--error)" }}>Could not complete search</h4>
            <p style={{ color: "var(--text-secondary)" }}>
              The server could not be reached. Please check if the local server is running and try again.
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleSubmit}>
            Try Again
          </button>
        </div>
      )}

      {/* Search Results */}
      {status === "success" && (
        <div>
          {/* Category Confirmation Card */}
          {searchedCategory && (
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
                  <div className="ai-detection-value">{searchedCategory}</div>
                </div>
              </div>

              <div className="category-select-wrapper">
                <select
                  className="form-select"
                  value={searchedCategory}
                  onChange={(e) => setSearchedCategory(e.target.value)}
                  aria-label="Change item category"
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

          {/* Add to Gallery Prompt */}
          {!addedToGallery ? (
            <div className="gallery-callout-card">
              <div className="callout-text">
                <h4>None of these look like your item?</h4>
                <p>Register this lost item on the public board so when someone finds it, they can identify and contact you.</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToGallery}
                disabled={isAddingToGallery}
              >
                {isAddingToGallery ? "Posting..." : "Post to Lost & Found Board"}
              </button>
            </div>
          ) : (
            <div className="gallery-callout-card" style={{ borderColor: "var(--success-border)", background: "var(--success-bg)" }}>
              <div className="callout-text">
                <h4 style={{ color: "var(--success)" }}>Posted to the Community Board</h4>
                <p style={{ color: "var(--text-secondary)" }}>Your item is now registered. Finders can spot it and call you at {phone}.</p>
              </div>
            </div>
          )}

          {/* Results Grid Header */}
          <div className="results-header-bar">
            <h3 className="results-heading">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Possible Matches ({matches.length})
            </h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Sorted by photo similarity</span>
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
                <h4>No matching items found yet</h4>
                <p>Make sure you clicked "Post to Lost & Found Board" above so anyone who finds it can get in touch with you.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}