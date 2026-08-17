import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import ResultCard from "./ResultCard";

const CATEGORIES = ["all", "calculator", "ID card", "wallet", "earbuds", "keys", "water bottle", "phone", "bag"];

export default function BrowseItems({ type = "found", status = "unclaimed", title, subtitle, hideCategories = false }) {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [fetchStatus, setFetchStatus] = useState("loading");

  useEffect(() => {
    setFetchStatus("loading");
    axios
      .get(`${API_BASE}/api/items`, { params: { category: activeCategory, type, status } })
      .then((res) => {
        setItems(res.data.items);
        setFetchStatus("success");
      })
      .catch(() => setFetchStatus("error"));
  }, [activeCategory, type, status]);

  return (
    <div className="panel">
      <h2>{title}</h2>
      <p className="panel-subtitle">{subtitle}</p>

      {!hideCategories && (
        <div className="chip-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? "chip active" : "chip"}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {fetchStatus === "loading" && <p className="status-message">Loading...</p>}
      {fetchStatus === "error" && <p className="status-message error">Couldn't load items. Is the backend running?</p>}
      {fetchStatus === "success" && items.length === 0 && (
        <p className="status-message">Nothing found in this category yet.</p>
      )}

      {items.length > 0 && (
        <div className="results-grid">
          {items.map((item) => (
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