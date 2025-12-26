import CollapseSection from "./components/CollapseSection";
import DataInputPanel from "./components/DataInputPanel";
import ExportPanel from "./components/ExportPanel";
import HelpTip from "./components/HelpTip";

import { runGreedy } from "./api/greedy";
import { useSessionStore } from "./stores/useSessionStore";
import { IS_PRO } from "./config/flags";

import { track } from "./utils/analytics";

export default function Greedy() {
  const session = useSessionStore();
  const { greedy, openProModal } = session;

  const input = greedy.input;
  const result = greedy.result;

  /* =========================
     MODE SELECTION
  ========================= */

  const setMode = (mode: "classic" | "fast" | "hybrid") => {
    if ((mode === "fast" || mode === "hybrid") && !IS_PRO) {
      openProModal(
        mode === "fast" ? "greedy_fast" : "greedy_hybrid"
      );
      return;
    }

    session.setGreedyInput({ mode });
  };

  /* =========================
     RUN
  ========================= */

  const run = async () => {
    const numbers = input.numbersInput
      .split(/[,\s]+/)
      .map((n) => Number(n))
      .filter((n) => !isNaN(n));

    if (numbers.length < 5) {
      session.setGreedyError("Enter at least 5 numbers");
      return;
    }

    try {
      session.setGreedyStatus("running");

      const res = await runGreedy({
        numbers,
        mode: input.mode,
        attempts: Number(input.attempts) || 5,
        sample_size: Number(input.sampleSize) || 200,
      });

      session.setGreedyResult(res);

      track("greedy_run", {
        mode: input.mode,
        systemSize: res?.system?.length ?? 0,
      });
    } catch (e: any) {
      session.setGreedyError(e?.message ?? "Greedy failed");
    }
  };

  /* =========================
     RESULT TEXT
  ========================= */

  const resultText =
    result?.system
      ?.map((row) => row.join(" "))
      .join("\n") ?? "";

  /* =========================
     UI
  ========================= */

  return (
    <>
      <h1>Greedy Optimizer</h1>

      <div style={{ fontSize: 13, color: "#C8CCD4", marginBottom: 12 }}>
        Greedy Optimizer builds compact systems that maximize coverage
        of repeated number combinations.<br />
        It does not predict outcomes. Its goal is to cover as many
        important patterns as possible using the smallest number of tickets.
      </div>

      {/* INPUT NUMBERS */}
      <CollapseSection id="greedy.input" title="Input Numbers" defaultOpen>
        <textarea
          value={input.numbersInput}
          onChange={(e) =>
            session.setGreedyInput({ numbersInput: e.target.value })
          }
          rows={3}
          style={{ width: "100%" }}
          placeholder="Enter numbers separated by space or comma"
        />
      </CollapseSection>

      {/* MODE SELECTION */}
      <CollapseSection
        id="greedy.mode"
        title={
          <>
            Mode Selection
            <HelpTip
              text="Classic: highest accuracy, slower.
Fast (PRO): optimized for speed.
Hybrid (PRO): balance between speed and coverage."
            />
          </>
        }
        subtitle={!IS_PRO ? "Fast & Hybrid are PRO features" : undefined}
        defaultOpen
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            className={
              input.mode === "classic"
                ? "btn btn-primary"
                : "btn"
            }
            onClick={() => setMode("classic")}
          >
            Classic
          </button>

          <button
            className={
              input.mode === "fast"
                ? "btn btn-primary"
                : "btn"
            }
            onClick={() => setMode("fast")}
          >
            Fast {!IS_PRO && "🔒"}
          </button>

          <button
            className={
              input.mode === "hybrid"
                ? "btn btn-primary"
                : "btn"
            }
            onClick={() => setMode("hybrid")}
          >
            Hybrid {!IS_PRO && "🔒"}
          </button>
        </div>

        {!IS_PRO && (
          <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 6 }}>
            Advanced Greedy modes provide faster convergence
            and improved coverage efficiency.
          </div>
        )}
      </CollapseSection>

      {/* RUN */}
      <CollapseSection id="greedy.run" title="Run Optimizer" defaultOpen>
        <button
          className="btn btn-primary"
          onClick={run}
          disabled={greedy.status === "running"}
        >
          {greedy.status === "running"
            ? "Running..."
            : "Run Greedy"}
        </button>

        <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 6 }}>
          Greedy optimization works best when historical data is loaded.
        </div>

        {greedy.error && (
          <p style={{ color: "#ff6b6b", marginTop: 8 }}>
            {greedy.error}
          </p>
        )}
      </CollapseSection>

      {/* RESULTS */}
      {result && (
        <CollapseSection id="greedy.results" title="Results" defaultOpen>
          <p>
            <strong>
              Coverage
              <HelpTip
                text="Coverage shows what percentage of all possible number triplets
(from your base pool) are covered by the generated system.
Higher coverage means stronger protection."
              />
              :
            </strong>{" "}
            {result.coverage !== undefined
              ? result.coverage.toFixed(2)
              : "—"}
            %
          </p>

          <p>
            <strong>System size:</strong> {result.system.length}
          </p>

          <DataInputPanel
            title="Greedy System"
            value={resultText}
            onChange={() => {}}
            readOnly
            rows={10}
            footer={
              <ExportPanel
                rows={result.system}
                filename="greedy_system"
              />
            }
          />
        </CollapseSection>
      )}
    </>
  );
}
