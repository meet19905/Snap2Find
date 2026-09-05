import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./config";
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

  useEffect(() => {
    if (!sessionStorage.getItem("snap2find-visited")) {
      axios.post(`${API_BASE}/api/visit`).catch(() => {});
      sessionStorage.setItem("snap2find-visited", "true");
    }
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="app">
      <ThemeToggle />
      <header className="app-header">
        <h1>Snap2Find</h1>
        <p>Lost something? Found something? Let the photo do the talking.</p>
      </header>

      <StatsStrip />

      <div className="tab-switcher">
        <button className={activeTab === "search" ? "tab active" : "tab"} onClick={() => setActiveTab("search")}>
          I lost something
        </button>
        <button className={activeTab === "found" ? "tab active" : "tab"} onClick={() => setActiveTab("found")}>
          I found something
        </button>
        <button className={activeTab === "browse-all" ? "tab active" : "tab"} onClick={() => setActiveTab("browse-all")}>
          View Lost & Found Gallery
        </button>
        <button className={activeTab === "reunited" ? "tab active" : "tab"} onClick={() => setActiveTab("reunited")}>
          View Reunited Items
        </button>
      </div>

      <main>
        {activeTab === "search" && <SearchLost />}
        {activeTab === "found" && <ReportFound />}
        {activeTab === "browse-all" && <BrowseItems type="all" status="unclaimed" title="Lost & Found Gallery" subtitle="Browse items that people have lost or found." />}
        {activeTab === "reunited" && <BrowseItems status="recovered" title="Reunited Items" subtitle="Success stories! Check here if your item was claimed." hideCategories={true} />}
      </main>

      <Footer />
    </div>
  );
}

export default App;