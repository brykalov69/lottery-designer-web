import { useEffect, useState } from "react";
import { useHistoryStore } from "../stores/historyStore";

const API_BASE = import.meta.env.VITE_API_URL;

type Ticket = {
  ticket: number[];
  strategy: string;
  source: {
    top_candidates_used: number;
    fusion_based: boolean;
  };
};

type ApiResponse = {
  mode?: "pro" | "free_preview";
  ticket_count?: number;
  balls_per_ticket?: number;
  strategy?: string;
  tickets?: Ticket[];
  note?: string;
  error?: string;
};

export default function AITicketGeneratorPanel({ isPro }: { isPro: boolean }) {
  const { history } = useHistoryStore();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [ticketCount, setTicketCount] = useState(4);
  const [strategy, setStrategy] =
    useState<"balanced" | "conservative" | "exploratory">("balanced");

  // -------------------------------------------------
  // LOAD PREVIEW (FREE)
  // -------------------------------------------------
  useEffect(() => {
    if (!history.payload) {
      setData(null);
      setLoading(false);
      return;
    }

    if (!isPro) {
      setLoading(true);
      fetch(`${API_BASE}/ai_ticket_generator?is_pro=false`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((json) => setData(json))
        .catch(() =>
          setData({ error: "Failed to load ticket generator preview." })
        )
        .finally(() => setLoading(false));
    }
  }, [history.payload, isPro]);

  // -------------------------------------------------
  // GENERATE (PRO)
  // -------------------------------------------------
  const generate = () => {
    if (!isPro || !history.payload) return;

    setLoading(true);
    fetch(
      `${API_BASE}/ai_ticket_generator?is_pro=true&ticket_count=${ticketCount}&strategy=${strategy}`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() =>
        setData({ error: "Failed to generate AI tickets." })
      )
      .finally(() => setLoading(false));
  };

  // -------------------------
  // EMPTY STATE
  // -------------------------
  if (!history.payload) {
    return (
      <p style={{ color: "#C8CCD4" }}>
        Load historical data to enable AI Ticket Generator.
      </p>
    );
  }

  // -------------------------
  // FREE
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
          🔒 AI Ticket Generator (PRO)
        </div>

        <div style={{ fontSize: 13, color: "#C8CCD4", lineHeight: 1.5 }}>
          Convert AI analysis into real lottery tickets.
          Control strategy, diversity and number of tickets.
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary">Upgrade to PRO</button>
        </div>

        {data?.note && (
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
  // PRO
  // -------------------------
  return (
    <>
      {/* Controls */}
      <div
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 14,
          border: "1px solid #2B2F38",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>
          AI Ticket Generator
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 10,
          }}
        >
          <label>
            Tickets:
            <input
              type="number"
              min={1}
              max={20}
              value={ticketCount}
              onChange={(e) =>
                setTicketCount(Number(e.target.value))
              }
              style={{ width: 70, marginLeft: 6 }}
            />
          </label>

          <label>
            Strategy:
            <select
              value={strategy}
              onChange={(e) =>
                setStrategy(e.target.value as any)
              }
              style={{ marginLeft: 6 }}
            >
              <option value="balanced">Balanced</option>
              <option value="conservative">Conservative</option>
              <option value="exploratory">Exploratory</option>
            </select>
          </label>

          <button className="btn btn-primary" onClick={generate}>
            Generate
          </button>
        </div>
      </div>

      {loading && <p>Generating tickets…</p>}
      {data?.error && (
        <p style={{ color: "#e74c3c" }}>{data.error}</p>
      )}

      {/* Tickets */}
      {data?.tickets && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {data.tickets.map((t, idx) => (
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
                Ticket #{idx + 1}
              </div>

              <div style={{ fontSize: 18, fontWeight: "bold" }}>
                {t.ticket.join(" – ")}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#C8CCD4",
                  marginTop: 8,
                }}
              >
                Strategy: <b>{t.strategy}</b>
                <br />
                Fusion-based generation
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
