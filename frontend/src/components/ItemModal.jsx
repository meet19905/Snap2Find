import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import PhotoInput from "./PhotoInput";

export default function ItemModal({ item, onClose, onRecovered }) {
  const [claimantPhone, setClaimantPhone] = useState("");
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [verifyImage, setVerifyImage] = useState(null);
  const [preview, setPreview] = useState(null);

  if (!item) return null;

  const hasSimilarity = typeof item.similarity === "number";
  const similarityPercent = hasSimilarity ? Math.round(item.similarity * 100) : null;

  function handleImageChange(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVerifyImage(file);
      const reader = new FileReader();
      reader.onload = (evt) => setPreview(evt.target.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleConfirm() {
    if (claimantPhone.trim().length < 10) {
      setError("Enter a valid phone number.");
      return;
    }
    if (!verifyImage) {
      setError("Please upload a photo of the item for verification.");
      return;
    }

    setRecovering(true);
    setError("");

    const formData = new FormData();
    formData.append("image", verifyImage);
    formData.append("claimant_phone", claimantPhone.trim());

    try {
      const res = await axios.post(`${API_BASE}/api/items/${item.id}/verify-claim`, formData);
      if (res.data.success) {
        onRecovered(item.id);
      } else {
        setError("Unable to verify: " + (res.data.error || "The photo does not match closely enough."));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "An error occurred during verification.");
    } finally {
      setRecovering(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div style={{ display: "flex", width: "100%", maxHeight: "50vh", overflow: "hidden", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
          <img src={item.imageUrl} alt={item.category} className="modal-image" style={{ width: item.matched_image_path ? "50%" : "100%", borderRadius: 0, objectFit: "cover" }} />
          {item.matched_image_path && (
            <img src={`${API_BASE}/${item.matched_image_path}`} alt="Match" className="modal-image" style={{ width: "50%", borderRadius: 0, objectFit: "cover", borderLeft: "2px dashed rgba(255,255,255,0.3)" }} />
          )}
        </div>

        <div className="modal-info">
          <span className="tag-category">{item.category}</span>
          {hasSimilarity && <span className="tag-similarity">{similarityPercent}% match</span>}
          {item.description && <p className="tag-description">{item.description}</p>}

          <a 
            href={`tel:${item.phone_number}`} 
            className="tag-call-btn" 
            style={{ 
              marginBottom: "1rem", 
              display: "inline-block",
              pointerEvents: (item.phone_number || "").includes('*') ? 'none' : 'auto',
              textDecoration: "none"
            }}
          >
            Contact: {item.phone_number || "No number"}
          </a>

          {item.status !== "recovered" && !item.hideClaimButton && (
            <div className="claim-section">
              <p style={{marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-color)"}}>
                <strong>AI Verification Required</strong><br/>
                Please upload a photo of you with the item, or an older photo of the item, to prove ownership.
              </p>
              
              <PhotoInput preview={preview} onChange={handleImageChange} />
              
              <label className="field-label" style={{marginTop: "1rem"}}>
                {item.type === 'lost' ? "Your phone number (to help the owner contact you)" : "Your phone number (so the finder can coordinate with you)"}
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={claimantPhone}
                  onChange={(e) => setClaimantPhone(e.target.value)}
                />
              </label>
              {error && <p className="status-message error">{error}</p>}
              <button className="tag-recover-btn" onClick={handleConfirm} disabled={recovering}>
                {recovering ? "Verifying with AI..." : "Verify & Claim"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}