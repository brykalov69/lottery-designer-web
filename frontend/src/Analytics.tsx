import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CollapseSection from "./components/CollapseSection";
import { useHistoryStore } from "./stores/historyStore";
import { useSessionStore } from "./stores/useSessionStore";
import HelpTip from "./components/HelpTip";

type Tab = "triplets" | "quads" | "quints";
type ComboCount = [number[], number];

// Soft Launch: PRO disabled
const isPro = false;

function combosK(arr: number[], k: number): number[][] {
  const res: number[][] = [];
  const n = arr.length;
  if (k <= 0 || k > n) return res;

  const pick = (start: number, cur: number[]) => {
    if (cur.length === k) {
      res.push([...cur]);
      return;
    }
    for (let i = start; i <= n - (k - cur.length); i++) {
      cur.push(arr[i]);
      pick(i + 1, cur);
      cur.pop();
    }
  };

  pick(0, []);
  return res;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { history } = useHistoryStore();

  // 🔑 PRO MODAL (TEST)
  const { openProModal } = useSessionStore();

  const [tab, setTab] = useState<Tab>("triplets");
  const [limit, setLimit] = useState<number>(20);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // EMPTY STATE
  if (!history.payload) {
    return (
      <>
        <h1>Analytics</h1>
        <div className="empty-state">
          <p>No historical data loaded.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/history")}
          >
            Load Historical Data
          </button>
        </div>
      </>
    );
  }

  // ONLY MAIN BALLS
  const draws = history.payload.draws.map((d) => d.main);

  const comboStats = useMemo(() => {
    const triples = new Map<string, number>();
    const quads = new Map<string, number>();
    const quints = new Map<string, number>();

    for (const draw of draws) {
      const sorted = [...draw].sort((a, b) => a - b);

      for (const c of combosK(sorted, 3)) {
        const key = c.join(",");
        triples.set(key, (triples.get(key) ?? 0) + 1);
      }
      for (const c of combosK(sorted, 4)) {
        const key = c.join(",");
        quads.set(key, (quads.get(key) ?? 0) + 1);
      }
      for (const c of combosK(sorted, 5)) {
        const key = c.join(",");
        quints.set(key, (quints.get(key) ?? 0) + 1);
      }
    }

    const toArray = (m: Map<string, number>): ComboCount[] => {
      const arr: ComboCount[] = Array.from(m.entries())
        .map(([k, v]) => [k.split(",").map(Number), v] as ComboCount)
        .filter(([, count]) => count >= 2);

      arr.sort((a, b) =>
        sortOrder === "asc" ? a[1] - b[1] : b[1] - a[1]
      );

      return limit > 0 ? arr.slice(0, limit) : arr;
    };

    return {
      triplets: toArray(triples),
      quads: toArray(quads),
      quints: toArray(quints),
    };
  }, [draws, limit, sortOrder]);

  const renderCards = (items: ComboCount[]) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 12,
      }}
    >
      {items.map(([combo, count], idx) => (
        <div key={idx} className="collapse-card">
          <div className="collapse-content" style={{ textAlign: "center" }}>
            <b>{combo.join(", ")}</b>
            <div style={{ marginTop: 6, color: "#C8CCD4" }}>
              Count: {count}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyWarning = () => (
    <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 8 }}>
      No repeated combinations found.<br />
      This is normal for smaller or highly diverse datasets.
    </div>
  );

  const renderProGate = (title: string, description: string) => (
    <div
      className="collapse-card"
      style={{ textAlign: "center", padding: 20 }}
    >
      <h3>{title}</h3>
      <p style={{ color: "#C8CCD4", marginBottom: 12 }}>
        {description}
      </p>
      <button
        className="btn btn-secondary"
        onClick={() => openProModal("analytics_quints")}
      >
        🔒 Unlock PRO
      </button>
    </div>
  );

  return (
    <>
      <h1>Analytics</h1>

      {/* 🔒 TEST BUTTON — REMOVE AFTER TEST */}
     <button
  className="btn btn-secondary"
  style={{ opacity: 0.6, marginBottom: 8 }}
  onClick={() => openProModal("analytics_quints")}
>
  🔒 Test PRO Modal (dev)
</button>


      <div style={{ fontSize: 13, color: "#C8CCD4", marginBottom: 12 }}>
        Analytics identify number combinations that appeared together
        multiple times in historical draws.<br />
        Only main balls are analyzed. Bonus or extra balls are ignored.
      </div>

      <CollapseSection title="View" defaultOpen>
        <button
          className={`btn ${
            tab === "triplets" ? "btn-active" : "btn-secondary"
          }`}
          onClick={() => setTab("triplets")}
        >
          Triplets
          <HelpTip text="Triplets are combinations of 3 numbers that appeared together more than once." />
        </button>

        <button
          className={`btn ${
            tab === "quads" ? "btn-active" : "btn-secondary"
          }`}
          onClick={() => setTab("quads")}
        >
          Quads
          <HelpTip text="Quads are rare 4-number combinations and are available in PRO." />
        </button>

        <button
          className={`btn ${
            tab === "quints" ? "btn-active" : "btn-secondary"
          }`}
          onClick={() => setTab("quints")}
        >
          Quints
          <HelpTip text="Quints are very rare 5-number patterns available in PRO." />
        </button>
      </CollapseSection>

      <CollapseSection title="Options" defaultOpen>
        <label>Limit</label>
        <input
          type="number"
          value={limit}
          min={0}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{ width: 120, marginLeft: 8 }}
        />

        <label style={{ marginLeft: 16 }}>Sort</label>
        <select
          value={sortOrder}
          onChange={(e) =>
            setSortOrder(e.target.value as "asc" | "desc")
          }
          style={{ marginLeft: 8 }}
        >
          <option value="desc">Most frequent</option>
          <option value="asc">Least frequent</option>
        </select>
      </CollapseSection>

      <CollapseSection title="Results" defaultOpen>
        {/* B7 — general hint */}
        <div style={{ fontSize: 12, color: "#9AA0AA", marginBottom: 8 }}>
          Limited historical data or active filters may reduce available results.
        </div>

        {/* Triplets (FREE) */}
        {tab === "triplets" &&
          (comboStats.triplets.length > 0
            ? renderCards(comboStats.triplets)
            : renderEmptyWarning())}

        {/* Quads (PRO) */}
        {tab === "quads" &&
          (isPro
            ? comboStats.quads.length > 0
              ? renderCards(comboStats.quads)
              : renderEmptyWarning()
            : renderProGate(
                "Quads (PRO)",
                "4-number combinations appear much less frequently and provide deeper structural insight."
              ))}

        {/* Quints (PRO) */}
        {tab === "quints" &&
          (isPro
            ? comboStats.quints.length > 0
              ? renderCards(comboStats.quints)
              : renderEmptyWarning()
            : renderProGate(
                "Quints (PRO)",
                "5-number patterns are extremely rare and represent the strongest analytical signals."
              ))}
      </CollapseSection>
    </>
  );
}
