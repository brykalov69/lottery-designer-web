import CollapseSection from "../components/CollapseSection";
import { useHistoryStore } from "../stores/historyStore";
import { useSessionStore } from "../stores/useSessionStore";

import { track } from "../utils/analytics"; // путь как в Generator

type HistoryState = "shallow" | "optimal" | "over";
type SystemType = "generator" | "greedy" | "budget" | "hybrid";

export default function AISummary() {
  const { history } = useHistoryStore();
  const {
    openProModal,
    isPro,
    generator,
    greedy,
    budget,
  } = useSessionStore();

  const hasHistory = Boolean(history.payload);
  const totalDraws = history.payload?.meta.totalDraws ?? 0;

  const hasGenerator = Boolean(generator.result);
  const hasGreedy = Boolean(greedy.result);
  const hasBudget = Boolean(budget.result);

  const systemsUsed = [
    hasGenerator && "generator",
    hasGreedy && "greedy",
    hasBudget && "budget",
  ].filter(Boolean) as SystemType[];

  const hasAnySystem = systemsUsed.length > 0;

  // =========================
  // DERIVED STATES (V2)
  // =========================

  let historyState: HistoryState;
  if (!hasHistory) {
    historyState = "shallow";
  } else if (totalDraws < 30) {
    historyState = "shallow";
  } else if (totalDraws <= 150) {
    historyState = "optimal";
  } else {
    historyState = "over";
  }

  let systemType: SystemType;
  if (hasGreedy && hasBudget) {
    systemType = "hybrid";
  } else if (hasGreedy) {
    systemType = "greedy";
  } else if (hasBudget) {
    systemType = "budget";
  } else {
    systemType = "generator";
  }

  // =========================
  // READINESS
  // =========================

  let readinessMessage: string | null = null;

  if (!hasHistory) {
    readinessMessage =
      "Load historical data to activate meaningful AI analysis.";
  } else if (!hasAnySystem) {
    readinessMessage =
      "Generate at least one system to receive AI insights.";
  }

  // =========================
  // VERDICT V2
  // =========================

  let verdict = "";

  if (!hasHistory || !hasAnySystem) {
    verdict =
      "Insufficient data to produce a full AI summary.";
  } else if (historyState === "shallow") {
    verdict =
      "The system structure is defined, but historical depth is insufficient for stable analytical insights.";
  } else if (historyState === "optimal") {
    if (systemType === "hybrid") {
      verdict =
        "The system benefits from multiple optimization approaches supported by sufficient historical depth.";
    } else if (systemType === "greedy") {
      verdict =
        "Greedy optimization is supported by adequate historical data, providing meaningful structural insights.";
    } else if (systemType === "budget") {
      verdict =
        "Budget-based optimization aligns well with the available historical data.";
    } else {
      verdict =
        "The system is structurally sound under the current historical context.";
    }
  } else {
    verdict =
      "The analysis is based on extensive historical data. While this improves overall stability, it may smooth out recent trends.";
  }

  // =========================
  // STRENGTHS V2
  // =========================

  const strengths: string[] = [];

  if (hasHistory) {
    strengths.push("Historical data is available for analysis.");
  }

  if (historyState === "optimal") {
    strengths.push(
      "Historical depth is sufficient to support stable structural insights."
    );
  }

  if (historyState === "over") {
    strengths.push(
      "Large historical dataset provides high statistical stability."
    );
  }

  if (systemType === "greedy") {
    strengths.push(
      "Greedy optimization improves structural coverage across combinations."
    );
  }

  if (systemType === "budget") {
    strengths.push(
      "Budget-based optimization ensures controlled system size and cost."
    );
  }

  if (systemType === "hybrid") {
    strengths.push(
      "Multiple optimization strategies are combined to balance trade-offs."
    );
  }

  if (systemType === "generator") {
    strengths.push(
      "The system structure remains flexible without heavy optimization constraints."
    );
  }

  // =========================
  // RISKS V2
  // =========================

  const risks: string[] = [];

  if (historyState === "shallow") {
    risks.push(
      "Limited historical depth may cause random fluctuations to appear significant."
    );
  }

  if (historyState === "over") {
    risks.push(
      "Extensive historical data may smooth out recent trends and reduce sensitivity."
    );
  }

  if (systemType === "generator") {
  risks.push(
    "Generator-based systems preserve flexibility but do not actively optimize for coverage efficiency."
  );
}


  if (systemType === "greedy") {
  risks.push(
    "Greedy optimization prioritizes maximum coverage efficiency with minimal system size."
  );
}

 if (systemType === "budget") {
  risks.push(
    "Budget-based optimization prioritizes cost control over broader structural exploration."
  );
}

  if (hasAnySystem && systemsUsed.length === 1) {
    risks.push(
      "Relying on a single optimization approach may limit comparative insights."
    );
  }

// =========================
// NEXT STEPS V2
// =========================
const nextSteps: string[] = [];

if (!hasHistory) {
  nextSteps.push(
    "Load historical data to enable deeper structural insights."
  );
} else if (!hasAnySystem) {
  nextSteps.push(
    "Generate a system to receive AI-based structural feedback."
  );
} else {
  // History-related guidance
  if (historyState === "shallow") {
    nextSteps.push(
      "Consider loading additional historical draws to reduce analytical noise."
    );
  }

  if (historyState === "over") {
    nextSteps.push(
      "Focus analysis on recent draws to improve sensitivity to current trends."
    );
  }

  // System-type guidance
  if (systemType === "generator" && !hasGreedy) {
    nextSteps.push(
      "Try Greedy optimization to explore coverage-efficient system structures."
    );
  }

  if (systemType === "generator" && !hasBudget) {
    nextSteps.push(
      "Explore Budget optimization to evaluate cost-controlled system designs."
    );
  }

  if (systemType === "greedy" && !hasBudget) {
    nextSteps.push(
      "Compare Greedy and Budget systems to understand coverage versus cost trade-offs."
    );
  }

  if (systemType === "budget" && !hasGreedy) {
    nextSteps.push(
      "Generate a Greedy system to compare structural coverage profiles."
    );
  }

  if (systemType === "hybrid") {
    nextSteps.push(
      "Review AI Quality metrics to compare optimization trade-offs."
    );
  }
}
// Fallback: always provide at least one actionable step
if (nextSteps.length === 0) {
  nextSteps.push(
    "Review the generated system structure and consider exploring an alternative optimization approach for comparison."
  );
}

  // =========================
  // FREE vs PRO FILTER
  // =========================

 const visibleStrengths = isPro
  ? strengths
  : strengths.slice(0, 1);

const visibleRisks = isPro
  ? risks
  : risks.slice(0, 1);

const visibleNextSteps = isPro
  ? nextSteps
  : nextSteps.slice(0, 1);


  // =========================
  // RENDER
  // =========================

  return (
    <CollapseSection
      id="ai.summary"
      title="AI Summary"
      defaultOpen
    >
      <div
        style={{
          background: "#1F232B",
          borderRadius: 12,
          padding: 16,
          border: "1px solid #2B2F38",
        }}
      >
        {readinessMessage && (
          <div
            style={{
              fontSize: 13,
              color: "#9AA0AA",
              marginBottom: 12,
            }}
          >
            {readinessMessage}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <h3>Verdict</h3>
          <p style={{ color: "#C8CCD4" }}>{verdict}</p>
        </div>

        {visibleStrengths.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3>Strengths</h3>
            <ul style={{ color: "#C8CCD4" }}>
              {visibleStrengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {visibleRisks.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3>Risks</h3>
            <ul style={{ color: "#C8CCD4" }}>
              {visibleRisks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

{/* NEXT STEPS */}
{visibleNextSteps.length > 0 && (
  <div style={{ marginBottom: 14 }}>
    <h3>Next Steps</h3>
    <ul style={{ color: "#C8CCD4" }}>
      {visibleNextSteps.map((n, i) => (
        <li key={i}>{n}</li>
      ))}
    </ul>
  </div>
)}

        {!isPro && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop:
                "1px dashed #2B2F38",
            }}
          >
            <button
  className="btn btn-primary"
  onClick={() => {
    track("unlock_pro_clicked", {
      source: "ai_summary",
    });
    openProModal("ai_summary");
  }}
>
  Unlock full AI Summary (PRO)
</button>
          </div>
        )}
      </div>
    </CollapseSection>
  );
}
