import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import ItemModal from "./ItemModal";

export default function ResultCard({ match, onRecovered, hideClaimButton }) {
  const [showModal, setShowModal] = useState(false);
  const hasSimilarity = typeof match.similarity === "number";
  const similarityPercent = hasSimilarity ? Math.round(match.similarity * 100) : null;
  const imageUrl = `${API_BASE}/${match.image_path}`;

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
            {match.location && <p className="tag-location" style={{fontWeight: 'bold', margin: '0.2rem 0', color: '#555', fontSize: '0.9rem'}}>Found at: {match.location}</p>}
            {match.description && <p className="tag-description">{match.description}</p>}
            
           <div className="tag-actions">
            {match.status === "recovered" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                <div className="tag-reunited-badge" style={{ backgroundColor: "#4CAF50", color: "white", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold" }}>
                  Reunited!
                </div>
                <div className="tag-call-btn" style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", opacity: 0.9 }}>
                  Contact: {match.phone_number || "No number"}
                </div>
              </div>
            ) : (
              <>
                <div className="tag-call-btn" style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", opacity: 0.9 }}>
                  Contact: {match.phone_number || "No number"}
                </div>
                {!hideClaimButton && (
                  <button className="tag-recover-btn" onClick={() => setShowModal(true)}>
                    {match.type === 'lost' ? "I found this — mark as reunited" : "This is mine — mark as reunited"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    {showModal && (
        <ItemModal
          item={{ ...match, imageUrl, hideClaimButton }}
          onClose={() => setShowModal(false)}
          onRecovered={(id) => {
            setShowModal(false);
            onRecovered(id);
          }}
        />
      )}
    </>
  );
}