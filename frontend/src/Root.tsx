// frontend/src/Root.tsx
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useState } from "react";

import Generator from "./Generator";
import HistoricalData from "./HistoricalData";
import Analytics from "./Analytics";
import AI from "./AI";
import GreedyPage from "./Greedy";
import SmartBudget from "./SmartBudget";
import AIQuality from "./AIQuality";

// внутри Root.tsx
function NavTabs() {
  const location = useLocation();

  const tabs = [
    { path: "/", label: "Generator" },
    { path: "/history", label: "Historical Data" },
    { path: "/analytics", label: "Analytics" },
    { path: "/ai", label: "AI Insights" },
    { path: "/greedy", label: "Greedy Optimizer" },
    { path: "/budget", label: "Smart Budget" },
    { path: "/ai_quality", label: "AI Quality" },
  ];

  return (
    <header className="app-header">
      <nav className="nav-tabs">
        {tabs.map((t) => {
          const active = location.pathname === t.path;
          return (
            <Link
              key={t.path}
              to={t.path}
              className={`nav-tab ${active ? "active" : ""}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export default function Root() {
  const [aiRanges, setAiRanges] = useState<any>({});

  return (
    <>
   <div style={{ fontSize: 12, color: "#9AA0AA", marginBottom: 8 }}>
  This tool provides analytical insights only.
  It does not predict lottery outcomes or guarantee winnings.
</div>
      <NavTabs />
      <Routes>
        <Route path="/" element={<Generator aiRanges={aiRanges} />} />
        <Route path="/history" element={<HistoricalData />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/greedy" element={<GreedyPage />} />
        <Route path="/budget" element={<SmartBudget />} />
        <Route path="/ai_quality" element={<AIQuality />} />
      </Routes>
    </>
  );
}
