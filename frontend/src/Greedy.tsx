// frontend/src/Greedy.tsx

import CollapseSection from "./components/CollapseSection";
import DataInputPanel from "./components/DataInputPanel";
import ExportPanel from "./components/ExportPanel";
import HelpTip from "./components/HelpTip";
import { runGreedy } from "./api/greedy";
import { useSessionStore } from "./stores/useSessionStore";

export default function Greedy() {
  const session = useSessionStore();
  const { greedy, isPro } = session;
  const input = greedy.input;
  const result = greedy.result;

  /* =========================
     HELPERS
  ========================= */

  const requirePro = () => {
    // 👉 позже можно заменить на modal / paywall
    alert(
      "This feature is available in PRO version.\nUpgrade to unlock Fast & Hybrid modes."
    );
  };

  const setMode = (mode: "classic" | "fast" | "hybrid") => {
    if ((mode === "fast" || mode === "hybrid") && !isPro) {
      requirePro();
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
<p style={{ color: "#C8CCD4", marginBottom: 12 }}>
  Use Greedy Optimizer to maximize coverage of number triplets
  with the smallest possible system. <br />
  Best when you want strong protection with limited tickets.
</p>


      {/* INPUT NUMBERS */}
      <CollapseSection title="Input Numbers" defaultOpen>
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
  subtitle={!isPro ? "Fast & Hybrid are PRO features" : undefined}
  defaultOpen
>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={input.mode === "classic" ? "btn btn-primary" : "btn"}
            onClick={() => setMode("classic")}
          >
            Classic
          </button>

          <button
            className={
              input.mode === "fast"
                ? "btn btn-primary"
                : isPro
                ? "btn"
                : "btn btn-disabled"
            }
            onClick={() => setMode("fast")}
          >
            Fast {!isPro && "🔒"}
          </button>

          <button
            className={
              input.mode === "hybrid"
                ? "btn btn-primary"
                : isPro
                ? "btn"
                : "btn btn-disabled"
            }
            onClick={() => setMode("hybrid")}
          >
            Hybrid {!isPro && "🔒"}
          </button>
        </div>
      </CollapseSection>

      {/* RUN */}
      <CollapseSection title="Run Optimizer" defaultOpen>
        <button
          className="btn btn-primary"
          onClick={run}
          disabled={greedy.status === "running"}
        >
          {greedy.status === "running" ? "Running..." : "Run Greedy"}
        </button>

        {greedy.error && (
          <p style={{ color: "#ff6b6b", marginTop: 8 }}>
            {greedy.error}
          </p>
        )}
      </CollapseSection>

      {/* RESULTS */}
      {result && (
        <CollapseSection title="Results" defaultOpen>
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
