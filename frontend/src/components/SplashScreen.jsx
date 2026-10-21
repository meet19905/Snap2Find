import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Smooth 1.6s reveal, then fade out
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 1500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 1900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(onFinish, 180);
  };

  return (
    <div
      className={`splash-overlay ${fadingOut ? "fade-out" : ""}`}
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      aria-label="Skip introduction"
    >
      <div className="splash-ambient-glow" />

      <div className="splash-center">
        {/* Simple Camera Icon */}
        <div className="splash-lens-wrapper">
          <div className="splash-ring-outer" />
          <div className="splash-ring-inner" />
          <div className="splash-lens-core">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </div>

        {/* Clean Human Branding */}
        <h1 className="splash-brand-title">
          Snap<span>2</span>Find
        </h1>
        <p className="splash-brand-tagline">
          Lost something? Snap a photo to search. Found something? Help return it.
        </p>

        {/* Creator Badge */}
        <div className="splash-author-box">
          <span className="splash-author-label">Created by</span>
          <div className="splash-author-main">
            <strong className="splash-author-name">Meet Patel</strong>
            <span className="splash-author-dot">•</span>
            <a
              href="tel:7990273944"
              className="splash-author-phone"
              onClick={(e) => e.stopPropagation()}
              title="Call Meet Patel"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              7990273944
            </a>
          </div>
        </div>

        {/* Minimal Progress Line */}
        <div className="splash-loader">
          <div className="splash-progress-track">
            <div className="splash-progress-fill" />
          </div>
          <span className="splash-status-text">Loading items...</span>
        </div>
      </div>

      <div className="splash-skip-hint">
        Click anywhere to continue
      </div>
    </div>
  );
}