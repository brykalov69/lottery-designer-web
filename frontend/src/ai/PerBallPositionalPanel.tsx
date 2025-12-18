import { useEffect, useMemo, useState } from "react";
import { useHistoryStore } from "../stores/historyStore";

type PositionData = {
  position: number;
  total_draws: number;
  top_numbers: number[];
  hot_range: { min: number | null; max: number | null };
  stability: "high" | "medium" | "low";
  stats?: {
    unique_numbers: number;
    std_dev: number;
  };
};

type ApiResponse = {
  mode?: "pro" | "free_preview";
  draws_used?: number;
  positions?: PositionData[];
  position?: PositionData;
  note?: string;
  error?: string;
};

function stabilityLabel(s: "high" | "medium" | "low") {
  if (s === "high") return "High stability";
  if (s === "medium") return "Medium stability";
  return "Low stability";
}

function stabilityColor(s: "high" | "medium" | "low") {
  if (s === "high") return "#4CAF50";
  if (s === "medium") return "#FFC107";
  return "#FF5252";
}

export default function PerBallPositionalPanel({ isPro }: { isPro: boolean }) {
  const { history } = useHistoryStore();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const url = useMemo(() => {
    const qp = isPro ? "is_pro=true" : "is_pro=false";
    return `http://localhost:8000/ai_per_ball_positional?${qp}`;
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
        setData({ error: "Failed to load positional analysis." })
      )
      .finally(() => setLoading(false));
  }, [url, history.payload]);

  // -------------------------
  // EMPTY STATE
  // -------------------------
  if (!history.payload) {
    return (
      <p style={{ color: "#C8CCD4" }}>
        Load historical data to see positional AI analysis.
      </p>
    );
  }

  if (loading) return <p>Loading positional analysis…</p>;
  if (!data) return <p>Loading positional analysis…</p>;
  if (data.error) return <p style={{ color: "#e74c3c" }}>{data.error}</p>;

  // -------------------------
  // FREE PREVIEW
  // -------------------------
  if (!isPro && data.position) {
    const p = data.position;

    return (
      <div
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 14,
          border: "1px solid #2B2F38",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>
          🔒 Per-Ball Positional AI (Preview)
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#C8CCD4",
            marginBottom: 10,
          }}
        >
          Preview shows how numbers behave at{" "}
          <b>Position {p.position}</b>.
        </div>

        <div style={{ marginBottom: 6 }}>
          <b>Hot range:</b>{" "}
          {p.hot_range.min} – {p.hot_range.max}
        </div>

        <div style={{ marginBottom: 6 }}>
          <b>Example number:</b> {p.top_numbers[0]}
        </div>

        <div style={{ color: stabilityColor(p.stability) }}>
          {stabilityLabel(p.stability)}
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
  const positions = data.positions || [];

  return (
    <>
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
          Per-Ball Positional AI
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#C8CCD4",
            marginTop: 6,
          }}
        >
          Analyzes number behavior by position within a draw.
          This reveals positional structure, not predictions.
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#C8CCD4",
            marginTop: 8,
          }}
        >
          Draws used: <b>{data.draws_used ?? "-"}</b>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {positions.map((p) => (
          <div
            key={p.position}
            style={{
              background: "#1F232B",
              borderRadius: 12,
              padding: 14,
              border: "1px solid #2B2F38",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: 6 }}>
              Position {p.position}
            </div>

            <div style={{ fontSize: 13 }}>
              <b>Hot range:</b>{" "}
              {p.hot_range.min} – {p.hot_range.max}
            </div>

            <div style={{ fontSize: 13, marginTop: 4 }}>
              <b>Top numbers:</b>{" "}
              {p.top_numbers.join(", ")}
            </div>

            <div
              style={{
                marginTop: 8,
                color: stabilityColor(p.stability),
                fontWeight: "bold",
              }}
            >
              {stabilityLabel(p.stability)}
            </div>

            {p.stats && (
              <div
                style={{
                  fontSize: 12,
                  color: "#C8CCD4",
                  marginTop: 6,
                }}
              >
                Unique numbers: {p.stats.unique_numbers}
                <br />
                Std dev: {p.stats.std_dev}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
