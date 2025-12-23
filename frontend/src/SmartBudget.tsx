import CollapseSection from "./components/CollapseSection";
import DataInputPanel from "./components/DataInputPanel";
import ExportPanel from "./components/ExportPanel";
import HelpTip from "./components/HelpTip";
import { runBudget } from "./api/budget";
import { useSessionStore } from "./stores/useSessionStore";

import { track } from "./utils/analytics";


export default function SmartBudget() {
  const session = useSessionStore();
  const { budget, isPro, openProModal } = session;

  const input = budget.input;
  const result = budget.result;

  /* =========================
     HELPERS
  ========================= */

  const parseNumbers = (): number[] =>
    input.numbersInput
      .split(/[,\s]+/)
      .map((n) => Number(n))
      .filter((n) => !isNaN(n));

  const setMode = (mode: "count" | "money") => {
    if (mode === "money" && !isPro) {
      openProModal("budget_money");
      return;
    }
    session.setBudgetInput({ mode });
  };

  const budgetValue = Number(input.budget);
  const ticketCostValue = Number(input.ticketCost);

  // B11 — small budget warning
  const smallBudget =
    input.mode === "money" &&
    budgetValue > 0 &&
    ticketCostValue > 0 &&
    budgetValue < ticketCostValue * 5;

  /* =========================
     RUN
  ========================= */

  const run = async () => {
    const numbers = parseNumbers();

    if (numbers.length < 5) {
      session.setBudgetError("Enter at least 5 base numbers.");
      return;
    }

    try {
      session.setBudgetError(null);
      session.setBudgetResult(null);

        const payload: any = {
        numbers,
        mode: input.mode,
      };

      if (input.mode === "count") {
        const tc = Number(input.ticketCount);
        if (!tc || tc <= 0) {
          session.setBudgetError("Ticket count must be greater than 0.");
          return;
        }
        payload.ticket_count = tc;
      }

      if (input.mode === "money") {
        if (!isPro) {
          openProModal("budget_money");
          return;
        }

        const b = Number(input.budget);
        const c = Number(input.ticketCost);
        if (!b || !c) {
          session.setBudgetError("Budget and ticket cost are required.");
          return;
        }
        payload.budget = b;
        payload.ticket_cost = c;
      }

     const res = await runBudget(payload);
session.setBudgetResult(res);

track("budget_run", {
  mode: input.mode,
  systemSize: res?.system?.length ?? 0,
});

    } catch (e: any) {
      session.setBudgetError(e?.message ?? "Budget optimization failed");
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
      <h1>Smart Budget</h1>

      <div style={{ fontSize: 13, color: "#C8CCD4", marginBottom: 12 }}>
        Smart Budget helps allocate your budget efficiently
        across generated systems.<br />
        It does not increase winning odds.
        It helps control how many tickets you play
        and how much you spend.
      </div>

      {/* BASE NUMBERS */}
      <CollapseSection id="budget.base" title="Base Numbers" defaultOpen>
        <textarea
          value={input.numbersInput}
          onChange={(e) =>
            session.setBudgetInput({ numbersInput: e.target.value })
          }
          rows={3}
          style={{ width: "100%" }}
          placeholder="Enter numbers separated by space or comma"
        />
      </CollapseSection>

      {/* MODE SELECTION */}
      <CollapseSection id="budget.mode"
        title={
          <>
            Optimization Mode
            <HelpTip
              text="Choose how the system is constrained.
By Ticket Count: fixed number of tickets.
By Budget (PRO): fixed total budget and ticket cost."
            />
          </>
        }
        defaultOpen
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={
              input.mode === "count"
                ? "btn btn-primary"
                : "btn"
            }
            onClick={() => setMode("count")}
          >
            By Ticket Count
          </button>

          <button
            className={
              input.mode === "money"
                ? "btn btn-primary"
                : "btn"
            }
            onClick={() => setMode("money")}
          >
            By Budget {!isPro && "🔒"}
          </button>
        </div>
      </CollapseSection>

      {/* PARAMETERS */}
      <CollapseSection id="budget.params" title="Budget Parameters" defaultOpen>
        {input.mode === "count" && (
          <label>
            Number of tickets:
            <input
              type="number"
              min={1}
              value={input.ticketCount}
              onChange={(e) =>
                session.setBudgetInput({
                  ticketCount: e.target.value,
                })
              }
              style={{ width: 100, marginLeft: 8 }}
            />
          </label>
        )}

        {input.mode === "money" && (
          <>
            <div style={{ display: "flex", gap: 16 }}>
              <label>
                Total budget:
                <input
                  type="number"
                  min={1}
                  value={input.budget}
                  onChange={(e) =>
                    session.setBudgetInput({
                      budget: e.target.value,
                    })
                  }
                  style={{ width: 120, marginLeft: 8 }}
                />
              </label>

              <label>
                Ticket cost:
                <input
                  type="number"
                  min={1}
                  value={input.ticketCost}
                  onChange={(e) =>
                    session.setBudgetInput({
                      ticketCost: e.target.value,
                    })
                  }
                  style={{ width: 120, marginLeft: 8 }}
                />
              </label>
            </div>

            {/* B12 — ticket price region note */}
            <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 4 }}>
              Ticket prices vary by lottery and region.
              Ensure the ticket cost matches your local lottery.
            </div>

            {/* B11 — small budget warning */}
            {smallBudget && (
              <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 6 }}>
                With very small budgets, coverage improvements may be limited.
              </div>
            )}
          </>
        )}
      </CollapseSection>

      {/* RUN */}
      <CollapseSection id="budget.run" title="Run Budget Optimizer" defaultOpen>
        <button className="btn btn-primary" onClick={run}>
          Run Smart Budget
        </button>

        {budget.error && (
          <p style={{ color: "#e74c3c", marginTop: 8 }}>
            {budget.error}
          </p>
        )}
      </CollapseSection>

      {/* RESULTS */}
      {result && (
        <CollapseSection id="budget.results" title="Results" defaultOpen>
          {result.coverage !== undefined && (
            <p>
              <strong>
                Coverage
                <HelpTip
                  text="Coverage here is a secondary indicator.
Smart Budget prioritizes respecting the chosen limits,
not maximizing coverage."
                />
                :
              </strong>{" "}
              {result.coverage.toFixed(2)}%
            </p>
          )}

          <p>
            <strong>System size:</strong>{" "}
            {result.system.length}
          </p>

          <DataInputPanel
            title="Budget System"
            value={resultText}
            onChange={() => {}}
            readOnly
            rows={10}
            footer={
              <ExportPanel
                rows={result.system}
                filename="budget_system"
              />
            }
          />

          {/* B13 — disclaimer */}
          <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 10 }}>
            Budget optimization does not guarantee winnings.
          </div>
        </CollapseSection>
      )}
    </>
  );
}
