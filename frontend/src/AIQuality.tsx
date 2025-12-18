import { useState } from "react";
import CollapseSection from "./components/CollapseSection";
import { useSessionStore } from "./stores/sessionStore";

import SingleSystemQuality from "./ai/quality/SingleSystemQuality";
import CompareSystems from "./ai/quality/CompareSystems";
import AIVerdict from "./ai/quality/AIVerdict";

type Metrics = {
  coverage: number;
  diversity: number;
  frequency: number;
  positional: number;
  driftPenalty: number;
};

// -------------------------------------
// REAL (but simple) frontend metrics
// -------------------------------------

function computeMetrics(system: number[][]): Metrics {
  if (!system.length) {
    return {
      coverage: 0,
      diversity: 0,
      frequency: 0,
      positional: 0,
      driftPenalty: 0,
    };
  }

  // ---- Coverage by triplets ----
  const allNumbers = Array.from(new Set(system.flat())).sort((a, b) => a - b);

  const universeTriplets = new Set<string>();
  for (let i = 0; i < allNumbers.length; i++) {
    for (let j = i + 1; j < allNumbers.length; j++) {
      for (let k = j + 1; k < allNumbers.length; k++) {
        universeTriplets.add(
          `${allNumbers[i]}-${allNumbers[j]}-${allNumbers[k]}`
        );
      }
    }
  }

  const coveredTriplets = new Set<string>();
  for (const row of system) {
    for (let i = 0; i < row.length; i++) {
      for (let j = i + 1; j < row.length; j++) {
        for (let k = j + 1; k < row.length; k++) {
          const t = [row[i], row[j], row[k]].sort((a, b) => a - b);
          coveredTriplets.add(`${t[0]}-${t[1]}-${t[2]}`);
        }
      }
    }
  }

  const coverage =
    universeTriplets.size > 0
      ? coveredTriplets.size / universeTriplets.size
      : 0;

  // ---- Diversity ----
  const uniqueCombos = new Set(system.map((r) => r.join(","))).size;
  const diversity = uniqueCombos / system.length;

  return {
    coverage: Number(coverage.toFixed(2)),
    diversity: Number(diversity.toFixed(2)),
    frequency: 0.6,   // placeholder (future AI)
    positional: 0.65, // placeholder
    driftPenalty: 0,  // placeholder
  };
}

export default function AIQuality() {
  const session = useSessionStore();

  const isPro = session.isPro === true;

  const greedyResult = session.greedy?.result?.system ?? null;
  const budgetResult = session.budget?.result?.system ?? null;

  const [greedySystem, setGreedySystem] = useState<number[][] | null>(null);
  const [budgetSystem, setBudgetSystem] = useState<number[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const greedyMetrics = greedySystem
    ? computeMetrics(greedySystem)
    : null;

  const budgetMetrics = budgetSystem
    ? computeMetrics(budgetSystem)
    : null;

  return (
    <>
      <h1>AI Quality</h1>
      <p style={{ color: "#C8CCD4", marginBottom: 12 }}>
        Evaluate the quality of AI-generated systems and compare optimization strategies.
      </p>

      {/* LOAD SYSTEMS */}
      <CollapseSection title="Load Systems" defaultOpen>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (!greedyResult) {
                setError("No Greedy system found. Generate a system first.");
                return;
              }
              setGreedySystem(greedyResult);
              setError(null);
            }}
          >
            Load Greedy System
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              if (!budgetResult) {
                setError("No Budget system found. Generate a system first.");
                return;
              }
              setBudgetSystem(budgetResult);
              setError(null);
            }}
          >
            Load Budget System
          </button>
        </div>

        {error && (
          <p style={{ color: "#e74c3c", marginTop: 8 }}>{error}</p>
        )}
      </CollapseSection>

      {/* FREE — SINGLE SYSTEM ANALYSIS */}
      {greedySystem && (
        <CollapseSection title="Single System Analysis (FREE)" defaultOpen>
          <SingleSystemQuality label="Greedy" metrics={greedyMetrics!} />
        </CollapseSection>
      )}

      {budgetSystem && (
        <CollapseSection title="Single System Analysis (FREE)">
          <SingleSystemQuality label="Budget" metrics={budgetMetrics!} />
        </CollapseSection>
      )}

      {/* PRO — COMPARE */}
      <CollapseSection title="Compare Greedy vs Budget (PRO)">
        {isPro ? (
          greedySystem && budgetSystem ? (
            <>
              <CompareSystems
                greedy={greedyMetrics!}
                budget={budgetMetrics!}
              />
              <AIVerdict
                greedy={greedyMetrics!}
                budget={budgetMetrics!}
              />
            </>
          ) : (
            <p style={{ color: "#C8CCD4" }}>
              Both systems are required for comparison.
            </p>
          )
        ) : (
          <p style={{ color: "#C8CCD4" }}>
            🔒 Unlock PRO to compare Greedy vs Budget systems and understand trade-offs.
          </p>
        )}
      </CollapseSection>
    </>
  );
}
