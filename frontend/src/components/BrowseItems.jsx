import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import ResultCard from "./ResultCard";

const CATEGORIES = ["all", "calculator", "ID card", "wallet", "earbuds", "keys", "water bottle", "phone", "bag"];

export default function BrowseItems({
  type = "found",
  status = "unclaimed",
  title,
  subtitle,
  hideCategories = false,
}) {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchStatus, setFetchStatus] = useState("loading");

  useEffect(() => {
    setFetchStatus("loading");
    axios
      .get(`${API_BASE}/api/items`, { params: { category: activeCategory, type, status } })
      .then((res) => {
        setItems(res.data.items || []);
        setFetchStatus("success");
      })
      .catch((err) => {
        console.error(err);
        setFetchStatus("error");
      });
  }, [activeCategory, type, status]);

  // Client-side quick filter for location or description
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          {title}
        </h2>
        <p className="panel-subtitle">{subtitle}</p>
      </div>

      {/* Category Pills & Quick Filter */}
      {!hideCategories && (
        <div>
          <div className="chip-bar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`chip ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "24px", maxWidth: "420px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by keyword, brand, or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {fetchStatus === "loading" && (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block", color: "var(--accent)" }}>
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
          </svg>
          Loading listings...
        </div>
      )}

      {/* Error state */}
      {fetchStatus === "error" && (
        <div className="gallery-callout-card" style={{ borderColor: "var(--error-border)", background: "var(--error-bg)" }}>
          <div className="callout-text">
            <h4 style={{ color: "var(--error)" }}>Could not load items</h4>
            <p style={{ color: "var(--text-secondary)" }}>
              Please check if the backend server is running and reload the page.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {fetchStatus === "success" && filteredItems.length === 0 && (
        <div className="gallery-callout-card" style={{ textAlign: "center", justifyContent: "center", padding: "48px 24px" }}>
          <div className="callout-text">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", margin: "0 auto 12px", display: "block" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <h4>No items found</h4>
            <p>
              {searchQuery
                ? `No items matching "${searchQuery}". Try a different keyword.`
                : activeCategory !== "all"
                ? `No items recorded under "${activeCategory}" yet.`
                : "No items currently listed in this section."}
            </p>
          </div>
        </div>
      )}

      {/* Grid of Results */}
      {fetchStatus === "success" && filteredItems.length > 0 && (
        <div className="results-grid">
          {filteredItems.map((item) => (
            <ResultCard
              key={item.id}
              match={item}
              onRecovered={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}