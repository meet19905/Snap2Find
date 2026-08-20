import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import PhotoInput from "./PhotoInput";
import ResultCard from "./ResultCard";

export default function ReportFound() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("idle");
  const [resultCategory, setResultCategory] = useState("");
  const [matches, setMatches] = useState([]);

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
      setImage(null);
      setPreview(null);
      setPhone("");
      setDescription("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2><strong>Report the item you found</strong></h2>
      <p className="panel-subtitle">Upload a photo — Snap2Find will tag its category automatically.</p>

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
        {status === "loading" ? "Uploading & Analyzing..." : "Report item"}
      </button>

      {status === "success" && (
        <div style={{ marginTop: "1rem" }}>
          <p className="status-message success" style={{ marginBottom: "1rem" }}>
            Tagged as "{resultCategory}". Thanks for reporting!
          </p>

          {matches && matches.length > 0 ? (
            <>
              <p style={{ marginBottom: "1rem" }}>
                <strong>Similar match found!</strong> Is this what you found? If so, please contact the owner using the number provided. The item has been added to the lost and found gallery.
              </p>
              <div className="results-grid">
                {matches.map((match) => (
                  <ResultCard
                    key={match.id}
                    match={match}
                    hideClaimButton={true}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="status-message">
              No matching lost item found. It has been added to the lost and found gallery.
            </p>
          )}
        </div>
      )}
      {status === "error" && (
        <p className="status-message error">
          Something went wrong. Make sure the backend is running, then try again.
        </p>
      )}
    </form>
  );
}