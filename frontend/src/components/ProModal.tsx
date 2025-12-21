import CollapseSection from "./CollapseSection";

/* =========================
   PRO REASONS (SAFE)
========================= */

export type ProReason =
  | "analytics_quads"
  | "analytics_quints"
  | "greedy_fast"
  | "greedy_hybrid"
  | "budget_money"
  | "ai_insights"
  | "ai_quality"
  | "ai_summary"   // ✅ ДОБАВЛЕНО
  | "generic";

/* =========================
   PRO MODAL PROPS
========================= */

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
      "4-number combination frequency analysis",
      "Deeper structural insights",
      "Rare pattern detection",
    ],
  },

  analytics_quints: {
    title: "Deep Pattern Analysis (PRO)",
    bullets: [
      "5-number pattern detection",
      "Extremely rare combination insights",
      "High-signal historical structures",
    ],
  },

  greedy_fast: {
    title: "Greedy Fast Mode (PRO)",
    bullets: [
      "Much faster optimization",
      "Best for large number pools",
      "Speed-optimized heuristics",
    ],
  },

  greedy_hybrid: {
    title: "Greedy Hybrid Mode (PRO)",
    bullets: [
      "Balance between speed and coverage",
      "Advanced optimization strategy",
      "Recommended for experienced users",
    ],
  },

  budget_money: {
    title: "Money-Based Budget Optimization (PRO)",
    bullets: [
      "Optimize systems by real budget",
      "Control ticket cost and total spend",
      "Smarter allocation of resources",
    ],
  },

  ai_insights: {
    title: "AI Insights Suite (PRO)",
    bullets: [
      "Advanced AI-driven analysis modules",
      "Patterns, clusters and drift detection",
      "Statistical signal interpretation",
    ],
  },

  ai_quality: {
    title: "AI Quality Comparison (PRO)",
    bullets: [
      "Compare Greedy vs Budget systems",
      "Understand trade-offs",
      "AI-assisted verdict and insights",
    ],
  },

  ai_summary: {
    title: "AI Insights Overview (PRO)",
    bullets: [
      "Unlock all AI analysis modules",
      "Patterns, clusters and drift detection",
      "Advanced structural insights",
    ],
  },

  generic: {
    title: "Upgrade to PRO",
    bullets: [
      "Unlock advanced analytical features",
      "Access deeper insights",
      "Designed for serious players",
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
