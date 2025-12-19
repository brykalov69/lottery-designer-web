import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

interface TicketsResponse {
  mode: string;
  tickets: {
    aggressive?: number[];
    balanced?: number[];
    conservative?: number[];
    wildcard?: number[];
  };
  ball_count?: number;
  draws_used?: number;
  error?: string;
}

export default function TicketGeneratorPanel({ isPro }: { isPro: boolean }) {
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/ai_tickets?is_pro=${isPro}`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setData({
        mode: "error",
        tickets: {},
        error: "Failed to load tickets.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, [isPro]);

  if (loading) return <p style={{ color: "#aaa" }}>Generating tickets…</p>;
  if (!data) return <p>No ticket data.</p>;
  if (data.error) return <p style={{ color: "red" }}>{data.error}</p>;

  const t = data.tickets || {};

  // Helper to render a single ticket row
  const TicketRow = (label: string, nums?: number[]) => {
    if (!nums || nums.length === 0) return null;

    return (
      <div
        style={{
          padding: 10,
          marginBottom: 10,
          background: "#222",
          borderRadius: 6,
          border: "1px solid #333",
          color: "white",
        }}
      >
        <b style={{ fontSize: 16 }}>{label}:</b>

        <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
          {nums.map((n, i) => (
            <div
              key={i}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#444",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 16,
                border: "1px solid #777",
              }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h4 style={{ color: "#eee", marginBottom: 15 }}>
        AI Ticket Generator
      </h4>

      {data.mode === "free_preview" && (
        <div style={{ color: "#ccc", marginBottom: 10 }}>
          Preview mode: showing only Balanced ticket.
        </div>
      )}

      {/* TICKET TYPES */}
      {TicketRow("🔥 Aggressive Ticket", t.aggressive)}
      {TicketRow("⚖️ Balanced Ticket", t.balanced)}
      {TicketRow("🛡 Conservative Ticket", t.conservative)}
      {TicketRow("🎲 Wildcard Ticket", t.wildcard)}

      {!isPro && (
        <p style={{ marginTop: 10, color: "#999" }}>
          Unlock PRO to generate all AI-powered ticket sets.
        </p>
      )}
    </div>
  );
}
