import { useState } from "react";
import { API_BASE } from "../config";
import ItemModal from "./ItemModal";

export default function ResultCard({ match, onRecovered, hideClaimButton }) {
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasSimilarity = typeof match.similarity === "number";
  const similarityPercent = hasSimilarity ? Math.round(match.similarity * 100) : null;

  let similarityTier = "medium";
  if (similarityPercent >= 85) similarityTier = "high";
  else if (similarityPercent < 70) similarityTier = "low";

  const imageUrl = `${API_BASE}/${match.image_path}`;
  const thumbUrl = `${API_BASE}/${match.thumb_path || match.image_path}`;

  return (
    <>
      <div className="result-card">
        {/* Media Container */}
        <div className="card-media-container" onClick={() => setShowModal(true)}>
          {/* Floating Badges */}
          <div className="card-floating-badges">
            {hasSimilarity ? (
              <span className={`similarity-badge ${similarityTier}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                {similarityPercent}% Match
              </span>
            ) : <span />}

            {match.type && (
              <span className={`type-pill ${match.status === "recovered" ? "recovered" : match.type}`}>
                {match.status === "recovered" ? "Reunited" : match.type === "lost" ? "Reported Lost" : "Found Item"}
              </span>
            )}
          </div>

          {/* Image / Comparison Split */}
          {match.matched_image_path ? (
            <div className="card-media-split">
              <div className="card-split-pane">
                <img
                  src={thumbUrl}
                  alt={match.category}
                  loading="lazy"
                  decoding="async"
                />
                <span className="card-split-label left">Your Upload</span>
              </div>
              <div className="card-split-divider" />
              <div className="card-split-pane">
                <img
                  src={`${API_BASE}/${match.matched_image_path}`}
                  alt="Matched Record"
                  loading="lazy"
                  decoding="async"
                />
                <span className="card-split-label right">Database Match</span>
              </div>
            </div>
          ) : (
            <img
              src={thumbUrl}
              alt={match.category}
              className="card-image-single"
              loading="lazy"
              decoding="async"
              style={{ opacity: imageLoaded ? 1 : 0.7 }}
              onLoad={() => setImageLoaded(true)}
            />
          )}
        </div>

        {/* Card Body */}
        <div className="card-content">
          <div className="card-category-row">
            <span className="card-category-title">{match.category}</span>
          </div>

          {match.location && (
            <div className="card-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{match.location}</span>
            </div>
          )}

          {match.description ? (
            <p className="card-desc">{match.description}</p>
          ) : (
            <p className="card-desc" style={{ fontStyle: "italic", opacity: 0.6 }}>No additional description provided.</p>
          )}

          {/* Action Row */}
          <div className="card-actions">
            {match.status === "recovered" ? (
              <div className="reunited-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Item Successfully Reunited!
              </div>
            ) : (
              <>
                {match.phone_number ? (
                  <a href={`tel:${match.phone_number}`} className="contact-button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Contact: {match.phone_number}
                  </a>
                ) : (
                  <div className="contact-button" style={{ opacity: 0.7, cursor: "default" }}>
                    No direct contact number
                  </div>
                )}

                {!hideClaimButton && (
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    onClick={() => setShowModal(true)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Verify & Claim Item
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <ItemModal
          item={{ ...match, imageUrl, hideClaimButton }}
          onClose={() => setShowModal(false)}
          onRecovered={(id) => {
            setShowModal(false);
            if (onRecovered) onRecovered(id);
          }}
        />
      )}
    </>
  );
}