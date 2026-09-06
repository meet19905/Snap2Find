import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";

export default function StatsStrip() {
  const [stats, setStats] = useState({ totalFound: 0, totalRecovered: 0, stillMissing: 0, totalVisitors: 0 });

  useEffect(() => {
    // Record visit and update visitor count
    axios
      .post(`${API_BASE}/api/visit`)
      .then((res) => {
        if (res.data && typeof res.data.totalVisitors === "number") {
          setStats((prev) => ({ ...prev, totalVisitors: res.data.totalVisitors }));
        }
      })
      .catch(() => {});

    // Fetch aggregate statistics
    axios
      .get(`${API_BASE}/api/stats`)
      .then((res) => {
        setStats((prev) => ({
          ...res.data,
          totalVisitors: res.data.totalVisitors || prev.totalVisitors,
        }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="stats-strip">

      <div className="stat-stub">
        <span className="stat-number">{stats.totalRecovered}</span>
        <span className="stat-label">Reunited</span>
      </div>
      <div className="stat-stub">
        <span className="stat-number">{stats.stillMissing}</span>
        <span className="stat-label">Still missing</span>
      </div>
      <div className="stat-stub">
        <span className="stat-number">{stats.totalVisitors}</span>
        <span className="stat-label">Visitors</span>
      </div>
    </div>
  );
}