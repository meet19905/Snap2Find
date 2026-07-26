import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import PhotoInput from "./PhotoInput";
import ResultCard from "./ResultCard";

export default function SearchLost() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
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

    try {
      const res = await axios.post(`${API_BASE}/api/search`, formData);
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

        <button type="submit" className="submit-btn" disabled={status === "loading"}>
          {status === "loading" ? "Searching..." : "Search"}
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
        <div className="results-grid">
          {matches.map((match) => (
            <ResultCard
              key={match.id}
              match={match}
              onRecovered={(id) => setMatches((prev) => prev.filter((m) => m.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}