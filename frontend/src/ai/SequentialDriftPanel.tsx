import { useEffect, useState } from "react";
import { useHistoryStore } from "../stores/historyStore";

const API_BASE = import.meta.env.VITE_API_URL;

type DriftExample = {
  from_draw: number;
  to_draw: number;
  from_date?: string | null;
  to_date?: string | null;
};

type DriftPattern = {
  direction: "ascending" | "descending";
  chain: number[];
  length: number;
  observed: number;
  examples?: DriftExample[];
};

type DriftResponse = {
  mode?: "pro" | "free_preview";
  draws_used?: number;
  min_length?: number;
  ascending?: DriftPattern[];
  descending?: DriftPattern[];
  note?: string;
  error?: string;
};

function formatChain(chain: number[]) {
  return chain.join(" → ");
}

function directionLabel(dir: "ascending" | "descending") {
  return dir === "ascending" ? "↑ Ascending Drift" : "↓ Descending Drift";
}

function directionIcon(dir: "ascending" | "descending") {
  return dir === "ascending" ? "↑" : "↓";
}

export default function SequentialDriftPanel({ isPro }: { isPro: boolean }) {
  const { history } = useHistoryStore();

  const [data, setData] = useState<DriftResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!history.payload) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(`${API_BASE}/ai_sequential_drift?is_pro=${isPro}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() =>
        setData({ error: "Failed to load sequential drift." })
      )
      .finally(() => setLoading(false));
  }, [isPro, history.payload]);

  // -------------------------
  // EMPTY STATE (no history)
  // -------------------------
  if (!history.payload) {
    return (
      <p style={{ color: "#C8CCD4" }}>
        Load historical data to analyze sequential drift patterns.
      </p>
    );
  }

  // -------------------------
  // FREE: locked explanation
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
          🔒 Sequential Drift Patterns (PRO)
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#C8CCD4",
            lineHeight: 1.5,
          }}
        >
          Detects <b>directional movement</b> of numbers across consecutive draws.
          <br />
          Examples:
          <br />
          • ↑ <b>15 → 16 → 17</b> (ascending drift)
          <br />
          • ↓ <b>28 → 27 → 26</b> (descending drift)
          <br />
          <br />
          Unlock PRO to reveal real drift chains found in your historical data.
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
  // PRO: data view
  // -------------------------
  if (loading) return <p>Loading sequential drift…</p>;
  if (!data) return <p>Loading sequential drift…</p>;
  if (data.error) return <p style={{ color: "#e74c3c" }}>{data.error}</p>;

  const ascending = data.ascending || [];
  const descending = data.descending || [];
  const hasAny = ascending.length > 0 || descending.length > 0;

  return (
    <>
      {/* Header / explanation */}
      <div
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 14,
          border: "1px solid #2B2F38",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: "bold" }}>Sequential Drift Patterns</div>
        <div
          style={{
            fontSize: 13,
            color: "#C8CCD4",
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          Finds cases where numbers move consistently <b>up</b> or <b>down</b>{" "}
          across consecutive draws. This is a pattern report based on history
          (not a prediction).
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#C8CCD4",
            marginTop: 10,
          }}
        >
          Draws used: <b>{data.draws_used ?? "-"}</b> · Min chain length:{" "}
          <b>{data.min_length ?? 3}</b>
        </div>
      </div>

      {!hasAny && (
        <div
          style={{
            background: "#1F232B",
            borderRadius: 12,
            padding: 14,
            border: "1px solid #2B2F38",
          }}
        >
          <b>No drift patterns found</b>
          <div
            style={{
              marginTop: 6,
              color: "#C8CCD4",
              fontSize: 13,
            }}
          >
            Try increasing history size or reducing minimum chain length.
          </div>
        </div>
      )}

      {/* Ascending + Descending */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {ascending.map((p, idx) => (
          <DriftCard key={`asc-${idx}`} p={p} />
        ))}

        {descending.map((p, idx) => (
          <DriftCard key={`desc-${idx}`} p={p} />
        ))}
      </div>
    </>
  );
}

function DriftCard({ p }: { p: DriftPattern }) {
  const title = directionLabel(p.direction);
  const icon = directionIcon(p.direction);
  const ex = p.examples?.[0];

  const dateLine =
    ex && (ex.from_date || ex.to_date)
      ? `${ex.from_date ?? "?"} → ${ex.to_date ?? "?"}`
      : null;

  const drawLine =
    ex ? `Draws #${ex.from_draw} → #${ex.to_draw}` : null;

  return (
    <div
      style={{
        background: "#1F232B",
        borderRadius: 12,
        padding: 14,
        border: "1px solid #2B2F38",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "#2B2F38",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
        >
          {icon}
        </div>

        <div style={{ fontWeight: "bold" }}>{title}</div>
      </div>

      <div style={{ marginTop: 10, fontSize: 16, fontWeight: "bold" }}>
        {formatChain(p.chain)}
      </div>

      <div style={{ marginTop: 6, fontSize: 12, color: "#C8CCD4" }}>
        Observed <b>{p.observed}</b> time(s) · Length:{" "}
        <b>{p.length}</b>
      </div>

      {(dateLine || drawLine) && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#C8CCD4" }}>
          {dateLine && (
            <div>
              Date range: <b>{dateLine}</b>
            </div>
          )}
          {drawLine && (
            <div style={{ marginTop: 2 }}>{drawLine}</div>
          )}
        </div>
      )}
    </div>
  );
}
