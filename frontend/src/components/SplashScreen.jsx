import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), 2500);
    const finishTimer = setTimeout(() => onFinish(), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen ${fadingOut ? "fade-out" : ""}`}>
      <h1 className="splash-title">Snap2Find</h1>
      <p className="splash-tagline">Ctrl+F for real life.</p>
      <div className="splash-footer">
        <p className="splash-author">
          Crafted with <span className="emoji-pop">💡</span> & <span className="emoji-pop">☕</span> by <br/>
          <strong>Meet Patel</strong>
        </p>
      </div>
    </div>
  );
}