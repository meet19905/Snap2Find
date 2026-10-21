import { useState } from "react";
import ReportFound from "./components/ReportFound";
import SearchLost from "./components/SearchLost";
import BrowseItems from "./components/BrowseItems";
import StatsStrip from "./components/StatsStrip";
import ThemeToggle from "./components/ThemeToggle";
import SplashScreen from "./components/SplashScreen";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("search");
  const [showSplash, setShowSplash] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="app">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Top Navigation Bar */}
      <header className="app-navbar">
        <div className="app-container navbar-inner">
          <div className="brand-wrapper" onClick={() => setActiveTab("search")} role="button" tabIndex={0}>
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className="brand-info">
              <span className="brand-name">Snap2Find</span>
              <span className="brand-tagline">Lost & Found Directory</span>
            </div>
          </div>

          <div className="navbar-actions">
            <button
              type="button"
              className="navbar-help-btn"
              onClick={() => setShowHowItWorks((prev) => !prev)}
              aria-label="How it works"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>How it works</span>
            </button>

            <a href="tel:7990273944" className="navbar-author-pill" title="Contact Meet Patel">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Meet Patel</span>
              <span style={{ opacity: 0.35 }}>•</span>
              <span className="navbar-phone-text">7990273944</span>
            </a>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="app-container" style={{ flex: 1, paddingBottom: "48px" }}>
        {/* Human How It Works Explainer Banner */}
        {showHowItWorks && (
          <div className="how-it-works-card">
            <div className="how-it-works-header">
              <h3>How Snap2Find Works</h3>
              <button
                type="button"
                className="close-sm-btn"
                onClick={() => setShowHowItWorks(false)}
                aria-label="Close guide"
              >
                ✕
              </button>
            </div>
            <div className="how-steps-grid">
              <div className="how-step">
                <span className="step-num">1</span>
                <div>
                  <h4>Take or Upload a Photo</h4>
                  <p>Snap a picture of the item you lost or found on campus or in public.</p>
                </div>
              </div>
              <div className="how-step">
                <span className="step-num">2</span>
                <div>
                  <h4>Visual Comparison</h4>
                  <p>The system compares colors, shapes, and logos with existing reports.</p>
                </div>
              </div>
              <div className="how-step">
                <span className="step-num">3</span>
                <div>
                  <h4>Connect & Return</h4>
                  <p>Call the finder or owner directly to arrange a safe, public handoff.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">
            Campus & Community Lost Items
          </div>
          <h1 className="hero-title">
            Lost something? <span className="hero-highlight">Search by photo.</span>
          </h1>
          <p className="hero-subtitle">
            Upload a picture to check against recently found items, or register an item you found so the rightful owner can get it back.
          </p>
        </section>

        {/* Metric Counter */}
        <StatsStrip />

        {/* Tab Controls */}
        <div className="nav-tabs-wrapper">
          <div className="nav-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "search"}
              className={`nav-tab ${activeTab === "search" ? "active" : ""}`}
              onClick={() => setActiveTab("search")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              I Lost Something
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "found"}
              className={`nav-tab ${activeTab === "found" ? "active" : ""}`}
              onClick={() => setActiveTab("found")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              I Found Something
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "browse-all"}
              className={`nav-tab ${activeTab === "browse-all" ? "active" : ""}`}
              onClick={() => setActiveTab("browse-all")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              All Items
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "reunited"}
              className={`nav-tab ${activeTab === "reunited" ? "active" : ""}`}
              onClick={() => setActiveTab("reunited")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Claimed & Reunited
            </button>
          </div>
        </div>

        {/* Tab Content Panes */}
        <section>
          {activeTab === "search" && <SearchLost />}
          {activeTab === "found" && <ReportFound />}
          {activeTab === "browse-all" && (
            <BrowseItems
              type="all"
              status="unclaimed"
              title="Current Lost & Found Listings"
              subtitle="Browse items reported missing or found in public spaces."
            />
          )}
          {activeTab === "reunited" && (
            <BrowseItems
              status="recovered"
              title="Recently Claimed & Reunited Items"
              subtitle="Items that were verified and successfully returned to their owners."
              hideCategories={true}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;