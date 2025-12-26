import CollapseSection from "./components/CollapseSection";
import { useSessionStore } from "./stores/useSessionStore";
import { IS_PRO } from "./config/flags";

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

/* -------------------------------------
   SIMPLE FRONTEND METRICS (STRUCTURAL)
------------------------------------- */

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
  const {
    openProModal,
    greedy,
    budget,
    aiQuality,
    setAIQuality,
    setUICollapse,
  } = useSessionStore();

  const greedySystem =
    aiQuality.useGreedy ? greedy.result?.system ?? null : null;

  const budgetSystem =
    aiQuality.useBudget ? budget.result?.system ?? null : null;

  const greedyMetrics = greedySystem
    ? computeMetrics(greedySystem)
    : null;

  const budgetMetrics = budgetSystem
    ? computeMetrics(budgetSystem)
    : null;

  return (
    <>
      <h1>AI Quality</h1>

      <div style={{ fontSize: 13, color: "#C8CCD4", marginBottom: 12 }}>
        AI Quality evaluates the structural properties of generated systems.
        <br />
        It does not measure winning probability
        and does not provide predictions.
      </div>

      {/* LOAD SYSTEMS */}
      <CollapseSection
        id="aiQuality.load"
        title="Load Systems"
        defaultOpen
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (!greedy.result?.system) {
                setAIQuality({
                  error: "No Greedy system found. Generate a system first.",
                });
                return;
              }

              setAIQuality({ useGreedy: true, error: null });

              // 🔓 auto-open Greedy analysis
              setUICollapse("aiQuality.single.greedy", true);

              // 🔓 auto-open comparison if possible
              if (aiQuality.useBudget && IS_PRO) {
                setUICollapse("aiQuality.compare", true);
              }
            }}
          >
            Load Greedy System
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              if (!budget.result?.system) {
                setAIQuality({
                  error: "No Budget system found. Generate a system first.",
                });
                return;
              }

              setAIQuality({ useBudget: true, error: null });

              // 🔓 auto-open Budget analysis
              setUICollapse("aiQuality.single.budget", true);

              // 🔓 auto-open comparison if possible
              if (aiQuality.useGreedy && IS_PRO) {
                setUICollapse("aiQuality.compare", true);
              }
            }}
          >
            Load Budget System
          </button>
        </div>

        {aiQuality.error && (
          <p style={{ color: "#e74c3c", marginTop: 8 }}>
            {aiQuality.error}
          </p>
        )}
      </CollapseSection>

      {/* FREE — SINGLE SYSTEM ANALYSIS (GREEDY) */}
      {greedySystem && greedyMetrics && (
        <CollapseSection
          id="aiQuality.single.greedy"
          title="Single System Analysis (FREE)"
          defaultOpen
        >
          <SingleSystemQuality label="Greedy" metrics={greedyMetrics} />
        </CollapseSection>
      )}

      {/* FREE — SINGLE SYSTEM ANALYSIS (BUDGET) */}
      {budgetSystem && budgetMetrics && (
        <CollapseSection
          id="aiQuality.single.budget"
          title="Single System Analysis (FREE)"
        >
          <SingleSystemQuality label="Budget" metrics={budgetMetrics} />
        </CollapseSection>
      )}

      {/* PRO — COMPARISON */}
      <CollapseSection
        id="aiQuality.compare"
        title="Compare Greedy vs Budget (PRO)"
      >
        {IS_PRO ? (
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
          <div style={{ textAlign: "center", padding: 12 }}>
            <p style={{ color: "#C8CCD4", marginBottom: 10 }}>
              Unlock PRO to compare Greedy vs Budget systems
              and receive an AI verdict.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => openProModal("ai_quality")}
            >
              🔒 Unlock PRO
            </button>
          </div>
        )}
      </CollapseSection>

      <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 16 }}>
        Quality analysis evaluates structural balance,
        not outcome probability.
      </div>
    </>
  );
}
