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

  return (
    <div className="app">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Top Navigation Bar */}
      <header className="app-navbar">
        <div className="app-container navbar-inner">
          <div className="brand-wrapper" onClick={() => setActiveTab("search")} role="button" tabIndex={0}>
            <div className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className="brand-info">
              <span className="brand-name">Snap2Find</span>
              <span className="brand-tagline">AI Visual Lost & Found</span>
            </div>
          </div>

          <div className="navbar-actions">
            <a href="tel:7990273944" className="navbar-author-pill" title="Contact Developer Meet Patel">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Meet Patel</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span className="navbar-phone-text">7990273944</span>
            </a>

            <div className="ai-status-pill">
              <span className="pulse-dot" />
              <span>AI Engine Ready</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="app-container" style={{ flex: 1, paddingBottom: "48px" }}>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Computer Vision Matcher
          </div>
          <h1 className="hero-title">
            Lost something? <span className="hero-highlight">Let the photo do the talking.</span>
          </h1>
          <p className="hero-subtitle">
            Upload a picture to instantly scan for matches using deep visual embeddings, or report a found item to reunite it with its owner.
          </p>
        </section>

        {/* Dynamic Metric Counter */}
        <StatsStrip />

        {/* Segmented Tab Controls */}
        <div className="nav-tabs-wrapper">
          <div className="nav-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "search"}
              className={`nav-tab ${activeTab === "search" ? "active" : ""}`}
              onClick={() => setActiveTab("search")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Lost & Found Gallery
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "reunited"}
              className={`nav-tab ${activeTab === "reunited" ? "active" : ""}`}
              onClick={() => setActiveTab("reunited")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Reunited Items
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
              title="Community Lost & Found Board"
              subtitle="Browse all registered items that community members have lost or found."
            />
          )}
          {activeTab === "reunited" && (
            <BrowseItems
              status="recovered"
              title="Reunited Hall of Fame"
              subtitle="Success stories! Items that were verified and returned to their rightful owners."
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