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

  return (
    <div className="panel">
      <h2>Find your lost item</h2>
      <p className="panel-subtitle">Upload a photo of what you lost — we'll search visually.</p>

      <form onSubmit={handleSubmit}>
        <PhotoInput preview={preview} onChange={handleImageChange} />

        <label className="field-label" style={{marginBottom: "1rem", display: "block"}}>
          Your phone number (optional)
          <input
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </label>

        <label className="field-label" style={{marginBottom: "1rem", display: "block"}}>
          Description (optional)
          <textarea
            placeholder="Any specific details?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </label>

        <label className="field-label" style={{marginBottom: "1rem", display: "block"}}>
          Location (optional)
          <input
            type="text"
            placeholder="e.g. Library, Cafeteria"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
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

      {status === "success" && matches.length === 0 && (
        <p className="status-message">No matching items found yet. Check back later.</p>
      )}

      {matches.length > 0 && (
        <div className="results-grid" style={{ marginTop: "1rem" }}>
          {matches.map((match) => (
            <ResultCard
              key={match.id}
              match={match}
              hideClaimButton={true}
              onRecovered={(id) => setMatches((prev) => prev.filter((m) => m.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}