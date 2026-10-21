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
  const referenceId = `#LF-${String(item.id).padStart(4, "0")}`;

  function handleImageChange(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVerifyImage(file);
      const reader = new FileReader();
      reader.onload = (evt) => setPreview(evt.target.result);
      reader.readAsDataURL(file);
    }
  }

  function handleClearImage() {
    setVerifyImage(null);
    setPreview(null);
  }

  async function handleConfirm() {
    if (claimantPhone.trim().length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!verifyImage) {
      setError("Please upload a photo proving ownership (e.g. an older photo of the item).");
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
        setError("Verification unsuccessful: " + (res.data.error || "The uploaded photo does not match closely enough."));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Could not complete verification right now. Please try again.");
    } finally {
      setRecovering(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Modal Image Header */}
        <div className="modal-image-header">
          {item.matched_image_path ? (
            <div className="card-media-split">
              <div className="card-split-pane">
                <img src={item.imageUrl} alt={item.category} />
                <span className="card-split-label left">Your Photo</span>
              </div>
              <div className="card-split-divider" />
              <div className="card-split-pane">
                <img src={`${API_BASE}/${item.matched_image_path}`} alt="Database Match" />
                <span className="card-split-label right">Reported Item</span>
              </div>
            </div>
          ) : (
            <img src={item.imageUrl} alt={item.category} />
          )}
        </div>

        {/* Modal Details Body */}
        <div className="modal-body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h3 className="modal-item-title" style={{ margin: 0 }}>{item.category}</h3>
            <span className="card-ref-badge">{referenceId}</span>
          </div>

          <div className="modal-meta-row">
            {hasSimilarity && (
              <span className="similarity-badge high">
                {similarityPercent}% match
              </span>
            )}

            {item.type && (
              <span className={`type-pill ${item.status === "recovered" ? "recovered" : item.type}`}>
                {item.status === "recovered"
                  ? "Returned"
                  : item.type === "lost"
                  ? "Lost Report"
                  : "Found Item"}
              </span>
            )}

            {item.location && (
              <span className="card-location" style={{ margin: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {item.location}
              </span>
            )}
          </div>

          {item.description ? (
            <p className="modal-description">{item.description}</p>
          ) : (
            <p className="modal-description" style={{ fontStyle: "italic", opacity: 0.6 }}>
              No detailed notes attached to this item.
            </p>
          )}

          {item.phone_number && (
            <a
              href={`tel:${item.phone_number}`}
              className="contact-button"
              style={{ marginBottom: "16px", textDecoration: "none" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Call Contact Person: {item.phone_number}</span>
            </a>
          )}

          {/* Claim Ownership Section */}
          {item.status !== "recovered" && !item.hideClaimButton && (
            <div className="claim-box">
              <div className="claim-box-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Claim This Item
              </div>
              <p className="claim-box-desc">
                To prevent false claims, please upload a photo proving ownership (an older picture of the item, or a photo of you holding it).
              </p>

              <PhotoInput preview={preview} onChange={handleImageChange} onClear={handleClearImage} />

              <div className="form-group" style={{ marginTop: "14px", marginBottom: "14px" }}>
                <label className="form-label" htmlFor="claim-phone">
                  <span>Your Phone Number (for pickup coordination)</span>
                  <span className="form-label-required">*</span>
                </label>
                <input
                  id="claim-phone"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={claimantPhone}
                  onChange={(e) => setClaimantPhone(e.target.value)}
                  pattern="[0-9]{10}"
                  maxLength={10}
                />
              </div>

              {error && (
                <div style={{ color: "var(--error)", background: "var(--error-bg)", border: "1px solid var(--error-border)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "14px" }}>
                  {error}
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={handleConfirm}
                disabled={recovering || !verifyImage || claimantPhone.length < 10}
              >
                {recovering ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                    </svg>
                    Verifying proof of ownership...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Confirm & Claim Item
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}