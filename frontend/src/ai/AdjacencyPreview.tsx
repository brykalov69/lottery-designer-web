import { useEffect, useState } from "react";
import { useHistoryStore } from "../stores/historyStore";

const API_BASE = import.meta.env.VITE_API_URL;

type Follower = {
  from: number;
  to: number;
  count: number;
};

type AdjacencyData = {
  last_draw: number[];
  likely_followers: Follower[];
};

export default function AdjacencyPreview({ isPro }: { isPro: boolean }) {
  const { history } = useHistoryStore();

  const [data, setData] = useState<AdjacencyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!history.payload) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/ai_adjacency?is_pro=${isPro}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (json?.error) {
          setError(json.error);
          setData(null);
        } else {
          setData(json);
        }
      })
      .catch(() => {
        setError("Failed to load adjacency data.");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [history.payload, isPro]);

  if (!history.payload) {
    return (
      <p style={{ color: "#C8CCD4" }}>
        Load historical data to see adjacency analysis.
      </p>
    );
  }

  if (loading) return <p>Loading adjacency analysis…</p>;
  if (error) return <p style={{ color: "#e74c3c" }}>{error}</p>;
  if (!data) return <p>No adjacency data available.</p>;

  const preview = isPro
    ? data.likely_followers
    : data.likely_followers.slice(0, 5);

  return (
    <>
      {/* LAST DRAW */}
      <div
        style={{
          background: "#1F232B",
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
          border: "1px solid #2B2F38",
        }}
      >
        <b>Last Draw</b>
        <div style={{ marginTop: 6 }}>
          {Array.isArray(data.last_draw)
            ? data.last_draw.join(", ")
            : "—"}
        </div>
      </div>

      {/* FOLLOW-UP PREVIEW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {preview.map((f, idx) => (
          <div
            key={idx}
            style={{
              background: "#1F232B",
              borderRadius: 10,
              padding: 12,
              border: "1px solid #2B2F38",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {f.from} → {f.to}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#C8CCD4",
                marginTop: 4,
              }}
            >
              Appeared together {f.count} times
            </div>
          </div>
        ))}
      </div>

      {!isPro && (
        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            color: "#C8CCD4",
          }}
        >
          🔒 Unlock PRO to explore full follow-up patterns and transition
          matrices.
        </div>
      )}
    </>
  );
}
