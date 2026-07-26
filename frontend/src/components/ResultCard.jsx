import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import ItemModal from "./ItemModal";

export default function ResultCard({ match, onRecovered }) {
  const [recovering, setRecovering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const hasSimilarity = typeof match.similarity === "number";
  const similarityPercent = hasSimilarity ? Math.round(match.similarity * 100) : null;
  const imageUrl = `${API_BASE}/${match.image_path}`;

  async function handleRecover(claimantPhone) {
    setRecovering(true);
    try {
      await axios.post(`${API_BASE}/api/items/${match.id}/recover`, {
        claimant_phone: claimantPhone,
      });
      setShowModal(false);
      onRecovered(match.id);
    } catch (err) {
      console.error(err);
      setRecovering(false);
    }
  }

  return (
    <>
      <div className="tag-card">
        <div className="tag-hole"></div>
        <div className="tag-body">
          <button className="tag-image-btn" onClick={() => setShowModal(true)}>
            <img src={imageUrl} alt={match.category} className="tag-image" />
          </button>
          <div className="tag-perforation"></div>
          <div className="tag-info">
            <span className="tag-category">{match.category}</span>
            {hasSimilarity && <span className="tag-similarity">{similarityPercent}% match</span>}
            {match.description && <p className="tag-description">{match.description}</p>}
            <a href={`tel:${match.phone_number}`} className="tag-call-btn">
              Call {match.phone_number}
            </a>
            <button className="tag-recover-btn" onClick={() => setShowModal(true)}>
              This is mine — mark as recovered
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <ItemModal
          item={{ ...match, imageUrl }}
          onClose={() => setShowModal(false)}
          onRecover={handleRecover}
          recovering={recovering}
        />
      )}
    </>
  );
}