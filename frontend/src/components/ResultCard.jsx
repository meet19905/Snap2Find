import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import ItemModal from "./ItemModal";

export default function ResultCard({ match, onRecovered, hideClaimButton }) {
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasSimilarity = typeof match.similarity === "number";
  const similarityPercent = hasSimilarity ? Math.round(match.similarity * 100) : null;

  const imageUrl = `${API_BASE}/${match.image_path}`;
  const thumbUrl = `${API_BASE}/${match.thumb_path || match.image_path}`;

  return (
    <>
      <div className="tag-card">
        <div className="tag-hole"></div>
        <div className="tag-body">
          <button className="tag-image-btn" onClick={() => setShowModal(true)} style={{ display: "flex", width: "100%", height: "200px", position: "relative", backgroundColor: "#f0f2f5" }}>
            <img 
              src={thumbUrl} 
              alt={match.category} 
              className={`tag-image ${imageLoaded ? "loaded" : "loading"}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              style={{ width: match.matched_image_path ? "50%" : "100%", objectFit: "cover", transition: "opacity 0.3s ease" }} 
            />
            {match.matched_image_path && (
              <img 
                src={`${API_BASE}/${match.matched_image_path}`} 
                alt="Match" 
                className="tag-image" 
                loading="lazy"
                decoding="async"
                style={{ width: "50%", objectFit: "cover", borderLeft: "2px dashed rgba(255,255,255,0.3)" }} 
              />
            )}
          </button>
          <div className="tag-perforation"></div>
          <div className="tag-info">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "flex-start" }}>
              <span className="tag-category" style={{ margin: 0 }}>{match.category}</span>
              {match.type && (
                <span className="tag-category" style={{ margin: 0, backgroundColor: match.type === 'lost' ? '#f59e0b' : '#3b82f6', color: '#fff', fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                  {match.type === 'lost' ? 'Searching' : 'Reported'}
                </span>
              )}
            </div>
            {hasSimilarity && <span className="tag-similarity">{similarityPercent}% match</span>}
            {match.location && <p className="tag-location" style={{ fontWeight: 'bold', margin: '0.2rem 0', color: '#555', fontSize: '0.9rem' }}>Found at: {match.location}</p>}
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
                      Mark as reunited
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