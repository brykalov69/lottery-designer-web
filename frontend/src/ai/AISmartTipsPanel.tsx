import { useEffect, useState } from "react";
import { useHistoryStore } from "../stores/historyStore";

type Tip = {
  type: "strength" | "caution" | "balance" | "conflict" | "guidance";
  message: string;
};

type TipsBlock = {
  rank: number;
  pattern: number[];
  fusion_score: number;
  tips: Tip[];
};

type ApiResponse = {
  mode?: "pro" | "free_preview";
  tips?: TipsBlock[];
  note?: string;
  error?: string;
};

function tipColor(type: Tip["type"]) {
  switch (type) {
    case "strength":
      return "#4CAF50";
    case "caution":
      return "#FFC107";
    case "conflict":
      return "#FF5252";
    case "balance":
      return "#4F7FFF";
    case "guidance":
    default:
      return "#C8CCD4";
  }
}

function tipLabel(type: Tip["type"]) {
  switch (type) {
    case "strength":
      return "Strength";
    case "caution":
      return "Caution";
    case "conflict":
      return "Conflict";
    case "balance":
      return "Balance";
    case "guidance":
    default:
      return "Guidance";
  }
}

export default function AISmartTipsPanel({ isPro }: { isPro: boolean }) {
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

    fetch("http://localhost:8000/ai_smart_tips")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() =>
        setData({ error: "Failed to load AI Smart Tips." })
      )
      .finally(() => setLoading(false));
  }, [isPro, history.payload]);

  // -------------------------
  // EMPTY STATE
  // -------------------------
  if (!history.payload) {
    return (
      <p style={{ color: "#C8CCD4" }}>
        Load historical data to enable AI Smart Tips.
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
          🔒 AI Smart Tips (PRO)
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#C8CCD4",
            lineHeight: 1.5,
          }}
        >
          AI Smart Tips translate AI results into human-readable insights.
          They highlight strengths, weaknesses and potential conflicts
          in ranked candidates.
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
  if (loading) return <p>Loading AI Smart Tips…</p>;
  if (!data) return <p>Loading AI Smart Tips…</p>;
  if (data.error) return <p style={{ color: "#e74c3c" }}>{data.error}</p>;

  const blocks = data.tips || [];

  if (!blocks.length) {
    return (
      <div
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 14,
          border: "1px solid #2B2F38",
        }}
      >
        <b>No smart tips available</b>
        <div
          style={{
            marginTop: 6,
            color: "#C8CCD4",
            fontSize: 13,
          }}
        >
          Try running Predictor first.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {blocks.map((b, idx) => (
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
            Rank #{b.rank} — {b.pattern.join(" – ")}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#C8CCD4",
              marginBottom: 10,
            }}
          >
            Fusion Score: <b>{b.fusion_score}</b>
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {b.tips.map((t, i) => (
              <li
                key={i}
                style={{
                  marginBottom: 6,
                  color: tipColor(t.type),
                  fontSize: 13,
                }}
              >
                <b>{tipLabel(t.type)}:</b> {t.message}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
