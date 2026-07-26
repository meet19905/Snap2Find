import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import ResultCard from "./ResultCard";

const CATEGORIES = ["all", "calculator", "ID card", "wallet", "earbuds", "keys", "water bottle", "phone", "bag"];

export default function BrowseItems() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    axios
      .get(`${API_BASE}/api/items`, { params: { category: activeCategory } })
      .then((res) => {
        setItems(res.data.items);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [activeCategory]);

  return (
    <div className="panel">
      <h2>Browse found items</h2>
      <p className="panel-subtitle">No photo of what you lost? Browse everything reported so far.</p>

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

      {status === "loading" && <p className="status-message">Loading...</p>}
      {status === "error" && <p className="status-message error">Couldn't load items. Is the backend running?</p>}
      {status === "success" && items.length === 0 && (
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