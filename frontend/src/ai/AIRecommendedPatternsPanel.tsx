import { useEffect, useMemo, useState } from "react";
import { useHistoryStore } from "../stores/historyStore";

type PatternSignals = {
  frequency: number;
  positional: number;
  drift_penalty: number;
};

type PatternItem = {
  pattern: number[];
  observed: number;
  score: number;
  signals: PatternSignals;
};

type ApiResponse = {
  mode?: "pro" | "free_preview";
  patterns?: PatternItem[];
  note?: string;
  error?: string;
};

function scoreColor(score: number) {
  if (score >= 0.7) return "#4CAF50";
  if (score >= 0.5) return "#FFC107";
  return "#FF5252";
}

export default function AIRecommendedPatternsPanel({ isPro }: { isPro: boolean }) {
  const { history } = useHistoryStore();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const url = useMemo(() => {
    const qp = isPro ? "is_pro=true" : "is_pro=false";
    return `http://localhost:8000/ai_patterns?${qp}`;
  }, [isPro]);

  useEffect(() => {
    if (!history.payload) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(url)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() =>
        setData({ error: "Failed to load AI patterns." })
      )
      .finally(() => setLoading(false));
  }, [url, history.payload]);

  // -------------------------
  // EMPTY STATE
  // -------------------------
  if (!history.payload) {
    return (
      <p style={{ color: "#C8CCD4" }}>
        Load historical data to see AI recommended patterns.
      </p>
    );
  }

  if (loading) return <p>Loading AI Recommended Patterns…</p>;
  if (!data) return <p>Loading AI Recommended Patterns…</p>;
  if (data.error) return <p style={{ color: "#e74c3c" }}>{data.error}</p>;

  // -------------------------
  // FREE PREVIEW
  // -------------------------
  if (!isPro) {
    return (
      <div
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 14,
          border: "1px solid #2B2F38",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>
          🔒 AI Recommended Patterns (PRO)
        </div>

        <div style={{ fontSize: 13, color: "#C8CCD4", lineHeight: 1.5 }}>
          AI selects stable number structures by combining multiple historical
          signals:
          <ul style={{ marginTop: 6 }}>
            <li>Frequency strength</li>
            <li>Positional stability</li>
            <li>Adjacency & drift behavior</li>
          </ul>
          Unlock PRO to see real recommended patterns and why they were selected.
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary">Upgrade to PRO</button>
        </div>

        {data.note && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#C8CCD4",
            }}
          >
            {data.note}
          </div>
        )}
      </div>
    );
  }

  // -------------------------
  // PRO VIEW
  // -------------------------
  const patterns = data.patterns || [];

  if (!patterns.length) {
    return (
      <div
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 14,
          border: "1px solid #2B2F38",
        }}
      >
        <b>No recommended patterns found</b>
        <div
          style={{
            marginTop: 6,
            color: "#C8CCD4",
            fontSize: 13,
          }}
        >
          Try increasing history size or adjusting filters.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12,
      }}
    >
      {patterns.map((p, idx) => (
        <div
          key={idx}
          style={{
            background: "#1F232B",
            borderRadius: 12,
            padding: 14,
            border: "1px solid #2B2F38",
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: 16 }}>
            {p.pattern.join(" – ")}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: scoreColor(p.score),
              fontWeight: "bold",
            }}
          >
            Score: {p.score}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#C8CCD4",
              marginTop: 4,
            }}
          >
            Observed {p.observed} time(s)
          </div>

          <div style={{ marginTop: 8, fontSize: 12 }}>
            <b>Why selected:</b>
            <ul style={{ marginTop: 4 }}>
              <li>Frequency strength: {p.signals.frequency}</li>
              <li>Positional stability: {p.signals.positional}</li>
              {p.signals.drift_penalty > 0 ? (
                <li style={{ color: "#FF5252" }}>
                  Drift conflict detected
                </li>
              ) : (
                <li>No conflicting drift</li>
              )}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
