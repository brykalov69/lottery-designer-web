import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

export default function SmartTipsPanel({ isPro }: { isPro: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadTips = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/ai_tips?is_pro=${isPro}`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTips();
  }, [isPro]);

  if (loading) return <p style={{ color: "#aaa" }}>Loading AI tips…</p>;
  if (!data) return <p>No tips available.</p>;
  if (data.error) return <p style={{ color: "red" }}>{data.error}</p>;

  const tips: string[] = data.tips || [];

  return (
    <div style={{ color: "white" }}>
      {tips.map((tip, i) => (
        <div
          key={i}
          style={{
            marginBottom: 10,
            padding: 10,
            background: "#222",
            borderRadius: 6,
            border: "1px solid #333",
          }}
        >
          {tip}
        </div>
      ))}

      {data.mode === "free_preview" && (
        <p style={{ marginTop: 10, color: "#999" }}>
          🔒 Unlock PRO to view the full set of AI insights.
        </p>
      )}
    </div>
  );
}
