import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import PhotoInput from "./PhotoInput";

export default function ReportFound() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("idle");
  const [resultCategory, setResultCategory] = useState("");

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
      <h2>Report a found item</h2>
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
        <p className="status-message success">
          Tagged as "{resultCategory}". Thanks for reporting!
        </p>
      )}
      {status === "error" && (
        <p className="status-message error">
          Something went wrong. Make sure the backend is running, then try again.
        </p>
      )}
    </form>
  );
}