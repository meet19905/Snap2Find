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
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!image || !phone) return;

    setStatus("loading");
    setAddedToGallery(false);
    const formData = new FormData();
    formData.append("image", image);
    formData.append("phone_number", phone);
    formData.append("description", description);
    formData.append("location", location);

    try {
      const res = await axios.post(`${API_BASE}/api/found`, formData);
      setResultCategory(res.data.category);
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
      alert("Failed to add to gallery. Please try again.");
    } finally {
      setIsAddingToGallery(false);
    }
  }

  return (
    <div className="panel">
      <h2><strong>Report a found item</strong></h2>
      <p className="panel-subtitle">Upload a photo to see if someone has already reported it lost.</p>

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
            * Important: A valid 10-digit phone number is required so the owner can contact you to retrieve it.
          </span>
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


        <label className="field-label">
          Description (optional)
          <textarea
            placeholder="Where did you find it?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>

        <button type="submit" className="submit-btn" disabled={status === "loading"}>
          {status === "loading" ? "Analyzing image & Searching..." : "Check if reported lost"}
        </button>
      </form>

      {status === "error" && (
        <p className="status-message error">
          Something went wrong. Make sure the backend is running, then try again.
        </p>
      )}

      {status === "success" && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem", color: "#1e293b" }}>
              Category (AI auto-detected — select to change):
            </label>
            <select
              value={resultCategory}
              onChange={(e) => setResultCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem",
                borderRadius: "8px",
                border: "1px solid #94a3b8",
                fontSize: "1rem",
                fontWeight: "600",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                cursor: "pointer"
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {!addedToGallery ? (
            <div className="status-message" style={{ marginBottom: "1.5rem" }}>
              {matches.length > 0 && <p><strong>None of these are the item?</strong></p>}
              <p><strong>Add to lost and found gallery.</strong> Help the owner find it by adding it to the gallery.</p>
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
              <p style={{ gridColumn: "1 / -1", marginBottom: "0.5rem" }}>
                <strong>We found some possible matches!</strong> Is this the item you found? If so, you can contact the owner and verify it to reunite it.
              </p>
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
              <p>No matching lost items found yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}