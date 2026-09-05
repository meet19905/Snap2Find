import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import PhotoInput from "./PhotoInput";
import ResultCard from "./ResultCard";

export default function SearchLost() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("idle");
  const [matches, setMatches] = useState([]);
  const [addedToGallery, setAddedToGallery] = useState(false);
  const [isAddingToGallery, setIsAddingToGallery] = useState(false);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!image) return;

    setStatus("loading");
    setAddedToGallery(false);
    const formData = new FormData();
    formData.append("image", image);
    formData.append("phone_number", phone);
    formData.append("description", description);
    formData.append("location", location);

    try {
      const res = await axios.post(`${API_BASE}/api/lost`, formData);
      setMatches(res.data.matches);
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

    try {
      await axios.post(`${API_BASE}/api/report-lost`, formData);
      setAddedToGallery(true);
    } catch (err) {
      console.error(err);
      alert("Failed to add to gallery. Please try again.");
    } finally {
      setIsAddingToGallery(false);
    }
  }

  return (
    <div className="panel">
      <h2><strong>Search for your lost item</strong></h2>
      <p className="panel-subtitle">Upload a photo of what you lost — we'll search visually.</p>

      <form onSubmit={handleSubmit}>
        <PhotoInput preview={preview} onChange={handleImageChange} />

        <label className="field-label">
          Your phone number
          <input
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            pattern="[0-9]{10}"
            minLength="10"
            maxLength="10"
            title="Please enter a valid 10-digit phone number"
          />
          <span style={{ color: "#d32f2f", fontSize: "0.8rem", marginTop: "4px", display: "block", fontWeight: "500" }}>
            * Important: A valid 10-digit phone number is required so the finder can contact you.
          </span>
        </label>

        <label className="field-label">
          Description (optional)
          <textarea
            placeholder="Any specific details?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </label>

        <label className="field-label">
          Location (optional)
          <input
            type="text"
            placeholder="e.g. Library, Cafeteria"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>

        <button type="submit" className="submit-btn" disabled={status === "loading"}>
          {status === "loading" ? "Analyzing image & Searching..." : "Search"}
        </button>
      </form>

      {status === "error" && (
        <p className="status-message error">
          Something went wrong. Make sure the backend is running, then try again.
        </p>
      )}

      {status === "success" && (
        <div style={{ marginTop: "1rem" }}>
          {!addedToGallery ? (
            <div className="status-message" style={{ marginBottom: "1.5rem" }}>
              {matches.length > 0 && <p><strong>None of these are your item?</strong></p>}
              <p><strong>Add your item to the lost and found gallery.</strong> This way, if someone finds it later, they can reach out to you!</p>
              <button
                className="submit-btn"
                onClick={handleAddToGallery}
                disabled={isAddingToGallery}
                style={{ marginTop: "1rem" }}
              >
                {isAddingToGallery ? "Adding..." : "Add to Lost & Found Gallery"}
              </button>
            </div>
          ) : (
            <div className="status-message success" style={{ marginBottom: "1.5rem", color: "#2e7d32", backgroundColor: "#e8f5e9", padding: "1rem", borderRadius: "8px" }}>
              <p>✅ Added to the Lost & Found Gallery!</p>
            </div>
          )}

          {matches.length > 0 ? (
            <div className="results-grid">
              {matches.map((match) => (
                <ResultCard
                  key={match.id}
                  match={match}
                  hideClaimButton={false}
                  onRecovered={(id) => setMatches((prev) => prev.map(m => m.id === id ? { ...m, status: "recovered" } : m))}
                />
              ))}
            </div>
          ) : (
            <div className="status-message">
              <p>No exact matches found yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}