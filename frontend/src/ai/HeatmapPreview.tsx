import { useEffect, useState } from "react";
import { useHistoryStore } from "../stores/historyStore";

const API_BASE = import.meta.env.VITE_API_URL;

type Segment = {
  id: number;
  range: [number, number];
  count: number;
  score: number; // 0..1
};

export default function HeatmapPreview({ isPro }: { isPro: boolean }) {
  const { history } = useHistoryStore();

  const [segments, setSegments] = useState<Segment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!history.payload) {
      setSegments([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/ai_heatmap?is_pro=${isPro}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data?.error) {
          setError(data.error);
          setSegments([]);
        } else {
          setSegments(data.segments || []);
        }
      })
      .catch(() => {
        setError("Failed to load heatmap");
        setSegments([]);
      })
      .finally(() => setLoading(false));
  }, [history.payload, isPro]);

  if (!history.payload) {
    return (
      <p style={{ color: "#C8CCD4" }}>
        Load historical data to see heatmap analysis.
      </p>
    );
  }

  if (loading) return <p>Loading heatmap…</p>;
  if (error) return <p style={{ color: "#e74c3c" }}>{error}</p>;
  if (!segments.length) return <p>No heatmap data available.</p>;

  // FREE → preview only first segment
  const visible = isPro ? segments : segments.slice(0, 1);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {visible.map((s) => {
          const isHot = s.score >= 0.6;
          const title = isHot ? "🔥 Hot Zone" : "❄️ Cold Zone";
          const barColor = isHot ? "#FF8C42" : "#4F7FFF";

          return (
            <div
              key={s.id}
              style={{
                background: "#1F232B",
                borderRadius: 12,
                padding: 14,
                border: "1px solid #2B2F38",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                {title} {isPro ? "" : "(Preview)"}
              </div>

              <div style={{ fontSize: 14 }}>
                Numbers <b>{s.range[0]} – {s.range[1]}</b>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#C8CCD4",
                  marginTop: 4,
                  lineHeight: 1.4,
                }}
              >
                {isHot
                  ? "This range appeared more often than others in historical draws."
                  : "This range appeared less frequently in historical draws."}
              </div>

              <div style={{ fontSize: 12, marginTop: 8 }}>
                Appeared <b>{s.count}</b> times
              </div>

              <div
                style={{
                  marginTop: 8,
                  height: 8,
                  background: "#2B2F38",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.round(s.score * 100)}%`,
                    height: "100%",
                    background: barColor,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!isPro && (
        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            color: "#C8CCD4",
          }}
        >
          🔒 Unlock PRO to see <b>all hot & cold zones</b> and understand how
          number ranges influence predictions.
        </div>
      )}
    </>
  );
}
