import { useEffect, useState } from "react";
import { useHistoryStore } from "../stores/historyStore";

type RankBreakdown = {
  frequency: number;
  positional: number;
  pattern_score: number;
  drift_penalty: number;
};

type Candidate = {
  pattern: number[];
  fusion_score: number;
  rank_breakdown: RankBreakdown;
};

type ApiResponse = {
  mode?: "pro";
  candidates?: Candidate[];
  error?: string;
};

function scoreColor(score: number) {
  if (score >= 0.7) return "#4CAF50";
  if (score >= 0.5) return "#FFC107";
  return "#FF5252";
}

export default function NextDrawPredictorPanel({ isPro }: { isPro: boolean }) {
  const { history } = useHistoryStore();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPro || !history.payload) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch("http://localhost:8000/ai_predictor")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => setData({ error: "Failed to load predictor." }))
      .finally(() => setLoading(false));
  }, [isPro, history.payload]);

  // -------------------------
  // EMPTY STATE
  // -------------------------
  if (!history.payload) {
    return (
      <p style={{ color: "#C8CCD4" }}>
        Load historical data to enable next draw prediction.
      </p>
    );
  }

  // -------------------------
  // FREE (locked explanation)
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
          🔒 Next Draw Predictor (PRO)
        </div>

        <div style={{ fontSize: 13, color: "#C8CCD4", lineHeight: 1.5 }}>
          Ranks candidates for the next draw by combining all AI signals:
          <ul style={{ marginTop: 6 }}>
            <li>Frequency</li>
            <li>Heatmap</li>
            <li>Adjacency</li>
            <li>Sequential drift</li>
            <li>Per-ball positional structure</li>
            <li>AI Recommended Patterns</li>
          </ul>
          This is a ranking, not a prediction.
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary">Upgrade to PRO</button>
        </div>
      </div>
    );
  }

  // -------------------------
  // PRO VIEW
  // -------------------------
  if (loading) return <p>Loading Next Draw Predictor…</p>;
  if (!data) return <p>Loading Next Draw Predictor…</p>;
  if (data.error) return <p style={{ color: "#e74c3c" }}>{data.error}</p>;

  const candidates = data.candidates || [];

  if (!candidates.length) {
    return (
      <div
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 14,
          border: "1px solid #2B2F38",
        }}
      >
        <b>No ranked candidates available</b>
        <div style={{ marginTop: 6, color: "#C8CCD4", fontSize: 13 }}>
          Try increasing history size or adjusting earlier AI modules.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 14,
          border: "1px solid #2B2F38",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: "bold" }}>
          Next Draw Predictor
        </div>

        <div style={{ fontSize: 13, color: "#C8CCD4", marginTop: 6 }}>
          Fusion-based ranking using multiple historical AI signals.
          Results are based on consistency, not prediction.
        </div>
      </div>

      {/* Ranked candidates */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {candidates.map((c, idx) => (
          <div
            key={idx}
            style={{
              background: "#1F232B",
              borderRadius: 12,
              padding: 14,
              border: "1px solid #2B2F38",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: 6 }}>
              Rank #{idx + 1}
            </div>

            <div style={{ fontSize: 18, fontWeight: "bold" }}>
              {c.pattern.join(" – ")}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                fontWeight: "bold",
                color: scoreColor(c.fusion_score),
              }}
            >
              Fusion Score: {c.fusion_score}
            </div>

            <div style={{ marginTop: 10, fontSize: 12 }}>
              <b>Why this candidate:</b>
              <ul style={{ marginTop: 4 }}>
                <li>Frequency: {c.rank_breakdown.frequency}</li>
                <li>Positional: {c.rank_breakdown.positional}</li>
                <li>Pattern score: {c.rank_breakdown.pattern_score}</li>
                {c.rank_breakdown.drift_penalty > 0 ? (
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
    </>
  );
}
