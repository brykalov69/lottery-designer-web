import CollapseSection from "./CollapseSection";

type ProReason =
  | "analytics_quads"
  | "analytics_quints"
  | "greedy_fast"
  | "greedy_hybrid"
  | "budget_money"
  | "ai_insights"
  | "ai_quality"
  | "generic";

type ProModalProps = {
  open: boolean;
  reason?: ProReason;
  onClose: () => void;
};

/* =========================
   CONTENT MAP
========================= */

const PRO_CONTENT: Record<
  ProReason,
  { title: string; bullets: string[] }
> = {
  analytics_quads: {
    title: "Advanced Analytics (PRO)",
    bullets: [
      "4-number combination frequency",
      "Rare structural patterns",
      "Deeper historical insight",
    ],
  },
  analytics_quints: {
    title: "Deep Pattern Analysis (PRO)",
    bullets: [
      "5-number rare patterns",
      "Strongest historical signals",
      "High-value analytical insight",
    ],
  },
  greedy_fast: {
    title: "Greedy Optimizer — Advanced Modes (PRO)",
    bullets: [
      "Fast optimization strategy",
      "Hybrid heuristic optimization",
      "Improved coverage efficiency",
    ],
  },
  greedy_hybrid: {
    title: "Greedy Optimizer — Advanced Modes (PRO)",
    bullets: [
      "Fast optimization strategy",
      "Hybrid heuristic optimization",
      "Improved coverage efficiency",
    ],
  },
  budget_money: {
    title: "Smart Budget — Money Mode (PRO)",
    bullets: [
      "Optimize systems by total budget",
      "Account for ticket cost",
      "Controlled spending strategies",
    ],
  },
  ai_insights: {
    title: "AI Insights (PRO)",
    bullets: [
      "Adjacency analysis",
      "Heatmap-based number regions",
      "Sequential drift patterns",
      "Per-ball positional AI",
    ],
  },
  ai_quality: {
    title: "AI Quality Analysis (PRO)",
    bullets: [
      "System quality comparison",
      "Stability and diversity metrics",
      "AI verdict summary",
    ],
  },
  generic: {
    title: "PRO Features",
    bullets: [
      "Advanced analytical tools",
      "Deeper system evaluation",
      "Extended optimization options",
    ],
  },
};

/* =========================
   COMPONENT
========================= */

export default function ProModal({
  open,
  reason = "generic",
  onClose,
}: ProModalProps) {
  if (!open) return null;

  const content = PRO_CONTENT[reason] || PRO_CONTENT.generic;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-card"
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 20,
          maxWidth: 520,
          width: "100%",
          border: "1px solid #2B2F38",
        }}
      >
        <h2 style={{ marginBottom: 12 }}>
          🔓 {content.title}
        </h2>

        <p style={{ color: "#C8CCD4", fontSize: 14, marginBottom: 12 }}>
          PRO features provide deeper analytical insight.
          They do <b>not</b> predict lottery outcomes
          and do <b>not</b> guarantee winnings.
        </p>

        <CollapseSection title="What you get with PRO" defaultOpen>
          <ul style={{ paddingLeft: 18, marginTop: 8 }}>
            {content.bullets.map((b, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {b}
              </li>
            ))}
          </ul>
        </CollapseSection>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Maybe later
          </button>

          <button
            className="btn btn-primary"
            onClick={() => {
              alert("PRO is coming soon");
              onClose();
            }}
          >
            Unlock PRO
          </button>
        </div>
      </div>
    </div>
  );
}
