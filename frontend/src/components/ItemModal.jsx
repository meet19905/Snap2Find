import { useState } from "react";

export default function ItemModal({ item, onClose, onRecover, recovering }) {
  const [claimantPhone, setClaimantPhone] = useState("");
  const [error, setError] = useState("");

  if (!item) return null;

  const hasSimilarity = typeof item.similarity === "number";
  const similarityPercent = hasSimilarity ? Math.round(item.similarity * 100) : null;

  function handleConfirm() {
    if (claimantPhone.trim().length < 10) {
      setError("Enter a valid phone number to confirm this is yours.");
      return;
    }
    setError("");
    onRecover(claimantPhone.trim());
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <img src={item.imageUrl} alt={item.category} className="modal-image" />

        <div className="modal-info">
          <span className="tag-category">{item.category}</span>
          {hasSimilarity && <span className="tag-similarity">{similarityPercent}% match</span>}
          {item.description && <p className="tag-description">{item.description}</p>}

          <a href={`tel:${item.phone_number}`} className="tag-call-btn">
            Call {item.phone_number}
          </a>

          <div className="claim-section">
            <label className="field-label">
              Your phone number (to confirm this is your item)
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={claimantPhone}
                onChange={(e) => setClaimantPhone(e.target.value)}
              />
            </label>
            {error && <p className="status-message error">{error}</p>}
            <button className="tag-recover-btn" onClick={handleConfirm} disabled={recovering}>
              {recovering ? "Confirming..." : "This is mine — mark as recovered"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}