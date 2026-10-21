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
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrapper reunited">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.totalRecovered}</span>
          <span className="stat-label">Items Reunited</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper missing">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.stillMissing}</span>
          <span className="stat-label">Currently Missing</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper visitors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.totalVisitors}</span>
          <span className="stat-label">Community Visitors</span>
        </div>
      </div>
    </div>
  );
}