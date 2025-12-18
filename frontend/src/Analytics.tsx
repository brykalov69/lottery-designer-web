// Analytics.tsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CollapseSection from "./components/CollapseSection";
import { useHistoryStore } from "./stores/historyStore";
import HelpTip from "./components/HelpTip";


type Tab = "triplets" | "quads" | "quints";
type ComboCount = [number[], number];

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

  // 🔑 ONLY MAIN BALLS FOR ANALYTICS
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
        // show only 2+ occurrences
        .filter(([, count]) => count >= 2);

      arr.sort((a, b) =>
        sortOrder === "asc" ? a[1] - b[1] : b[1] - a[1]
      );

      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 0;
      return safeLimit ? arr.slice(0, safeLimit) : arr;
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

  return (
    <>
      <h1>Analytics</h1>
<div style={{ color: "#C8CCD4", marginBottom: 12 }}>
  Repeated combinations indicate stable historical patterns <br />
  that can be reused as building blocks for your own systems.
</div>



      <CollapseSection
  title={
    <>
      View
      <HelpTip
        text="Triplets show 3-number combinations that repeat in history.
Greedy Optimizer maximizes coverage of these triplets.
Quads and Quints provide deeper analytical insight."
      />
    </>
  }
  defaultOpen
>

        <button
          className={`btn ${
            tab === "triplets" ? "btn-active" : "btn-secondary"
          }`}
          onClick={() => setTab("triplets")}
        >
          Triplets
        </button>
        <button
          className={`btn ${
            tab === "quads" ? "btn-active" : "btn-secondary"
          }`}
          onClick={() => setTab("quads")}
        >
          Quads
        </button>
        <button
          className={`btn ${
            tab === "quints" ? "btn-active" : "btn-secondary"
          }`}
          onClick={() => setTab("quints")}
        >
          Quints
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

      <CollapseSection
  title={
    <>
      Results
      <HelpTip
        text="These combinations are extracted from historical draws.
They highlight frequently recurring patterns,
not future predictions."
      />
    </>
  }
  defaultOpen
>

        {tab === "triplets" && renderCards(comboStats.triplets)}
        {tab === "quads" && renderCards(comboStats.quads)}
        {tab === "quints" && renderCards(comboStats.quints)}
      </CollapseSection>
    </>
  );
}
