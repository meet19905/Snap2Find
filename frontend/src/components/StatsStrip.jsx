import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";

export default function StatsStrip() {
  const [stats, setStats] = useState({ totalFound: 0, totalRecovered: 0, totalVisitors: 0 });

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/stats`)
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="stats-strip">
      <div className="stat-stub">
        <span className="stat-number">{stats.totalFound}</span>
        <span className="stat-label">Items reported</span>
      </div>
      <div className="stat-stub">
        <span className="stat-number">{stats.totalRecovered}</span>
        <span className="stat-label">Reunited</span>
      </div>
      <div className="stat-stub">
        <span className="stat-number">{stats.totalVisitors}</span>
        <span className="stat-label">Visitors</span>
      </div>
    </div>
  );
}