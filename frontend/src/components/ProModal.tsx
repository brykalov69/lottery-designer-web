import CollapseSection from "./CollapseSection";

type ProModalProps = {
  open: boolean;
  reason?: string;
  onClose: () => void;
};

const REASONS: Record<string, { title: string; features: string[] }> = {
  analytics_quads: {
    title: "Advanced Analytics",
    features: [
      "Quads (4-number combinations)",
      "Quints (5-number combinations)",
      "Rare pattern frequency analysis",
    ],
  },
  greedy_fast: {
    title: "Advanced Greedy Optimizer",
    features: [
      "Fast optimization mode",
      "Hybrid optimization strategy",
      "Deeper coverage trade-off analysis",
    ],
  },
  budget_money: {
    title: "Smart Budget (Money Mode)",
    features: [
      "Optimize by total budget",
      "Ticket cost awareness",
      "Spend control insights",
    ],
  },
  ai_insights: {
    title: "AI Insights",
    features: [
      "Adjacency analysis",
      "Heatmap patterns",
      "Sequential drift",
      "Per-ball positional AI",
    ],
  },
};

export default function ProModal({ open, reason, onClose }: ProModalProps) {
  if (!open) return null;

  const cfg = (reason && REASONS[reason]) || {
    title: "PRO Features",
    features: [],
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>🔓 Unlock PRO</h2>

        <p style={{ color: "#C8CCD4", marginBottom: 12 }}>
          PRO features provide <b>deeper analytical insight</b>.<br />
          They do <b>not</b> predict lottery outcomes and do not guarantee wins.
        </p>

        <CollapseSection title={cfg.title} defaultOpen>
          <ul style={{ paddingLeft: 18 }}>
            {cfg.features.map((f, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{f}</li>
            ))}
          </ul>
        </CollapseSection>

        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={() => alert("PRO is coming soon")}
          >
            Unlock PRO
          </button>

          <button className="btn btn-secondary" onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
