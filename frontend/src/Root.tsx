// frontend/src/Root.tsx
import { Routes, Route, Link, useLocation } from "react-router-dom";

import Generator from "./Generator";
import HistoricalData from "./HistoricalData";
import Analytics from "./Analytics";
import AI from "./AI";
import GreedyPage from "./Greedy";
import SmartBudget from "./SmartBudget";
import AIQuality from "./AIQuality";

import ProModal from "./components/ProModal";
import { useSessionStore } from "./stores/useSessionStore";
import { IS_PRO } from "./config/flags";

import Landing from "./Landing";

// -----------------------------
// NAV TABS
// -----------------------------
function NavTabs() {
  const location = useLocation();

  const tabs = [
    { path: "/generator", label: "Generator", pro: false },
    { path: "/history", label: "Historical Data", pro: false },
    { path: "/analytics", label: "Analytics", pro: false },
    { path: "/ai", label: "AI Insights", pro: true },
    { path: "/greedy", label: "Greedy Optimizer", pro: true },
    { path: "/budget", label: "Smart Budget", pro: true },
    { path: "/ai_quality", label: "AI Quality", pro: true },
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
              {t.label} {!IS_PRO && t.pro && "🔒"}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

// -----------------------------
// ROOT
// -----------------------------
export default function Root() {
  const { proModal, closeProModal } = useSessionStore();

  return (
    <>
      {/* Global disclaimer */}
      <div style={{ fontSize: 12, color: "#9AA0AA", marginBottom: 8 }}>
        This tool provides analytical insights only.
        It does not predict lottery outcomes or guarantee winnings.
      </div>

      <NavTabs />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/history" element={<HistoricalData />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/greedy" element={<GreedyPage />} />
        <Route path="/budget" element={<SmartBudget />} />
        <Route path="/ai_quality" element={<AIQuality />} />
      </Routes>

      {/* 🔓 PRO MODAL (GLOBAL) */}
      <ProModal
        open={proModal.open}
        reason={proModal.reason}
        onClose={closeProModal}
      />
    </>
  );
}
