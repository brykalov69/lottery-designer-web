import { useEffect, useState } from "react";
import AdjacencyScoreboard from "./AdjacencyScoreboard";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdjacencyPanel({ isPro }: { isPro: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/ai_adjacency?is_pro=${isPro}`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);

      if (json?.error) {
        setError(json.error);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load adjacency analysis.");
      setData(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [isPro]);

  if (loading) {
    return <p style={{ color: "#aaa" }}>Loading adjacency analysis...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!data) {
    return <p style={{ color: "#bbb" }}>No adjacency data available.</p>;
  }

  // ============================================================
  // UNIFIED VIEW (FREE + PRO)
  // ============================================================
  return (
    <div style={{ padding: 20 }}>
      {/* Intro */}
      <p style={{ color: "#bbb" }}>
        Analysis based on repeat events, neighbor events,
        and adjacency index.
      </p>

      {/* Last Draw */}
      <h3 style={{ marginTop: 20 }}>Last Draw</h3>
      <p style={{ color: "white" }}>
        {Array.isArray(data.last_draw)
          ? data.last_draw.join(", ")
          : "—"}
      </p>

      {/* Likely Followers */}
      <h3 style={{ marginTop: 20 }}>
        Likely Followers (Top 10)
      </h3>
      <div>
        {Array.isArray(data.likely_followers) &&
        data.likely_followers.length > 0 ? (
          data.likely_followers.map((x: any, i: number) => (
            <div
              key={i}
              style={{
                color: "white",
                padding: "4px 0",
                borderBottom: "1px solid #333",
              }}
            >
              {x.from} → {x.to} (count: {x.count})
            </div>
          ))
        ) : (
          <p style={{ color: "#777" }}>
            No adjacency data.
          </p>
        )}
      </div>

      {/* Scoreboard */}
      <h3 style={{ marginTop: 40 }}>
        Adjacency Scoreboard
      </h3>
      <AdjacencyScoreboard data={data} />
    </div>
  );
}
