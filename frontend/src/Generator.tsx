import { useEffect, useState } from "react";
import CollapseSection from "./components/CollapseSection";
import DataInputPanel from "./components/DataInputPanel";
import ExportPanel from "./components/ExportPanel";

import { generateSystem } from "./api/api";
import { parseNumberList } from "./utils/numberParser";
import { useSessionStore } from "./stores/useSessionStore";
import HelpTip from "./components/HelpTip";

export default function Generator({ aiRanges }: { aiRanges?: any }) {
  // -----------------------------
  // STORE (persistent)
  // -----------------------------
  const session = useSessionStore();

  const input = session.generator.input;
  const result = session.generator.result;

  const setInput = session.setGeneratorInput;
  const setResult = session.setGeneratorResult;

  // -----------------------------
  // UI WARNINGS (B)
  // -----------------------------
  const [showGroupWarning, setShowGroupWarning] = useState(false);

  // -----------------------------
  // AI → Generator
  // -----------------------------
  useEffect(() => {
    if (aiRanges && Object.keys(aiRanges).length > 0) {
      setInput({
        perBallRanges: aiRanges,
        rangeMode: "perball",
      });
    }
  }, [aiRanges]);

  // -----------------------------
  // GENERATE
  // -----------------------------
  const handleGenerate = async () => {
    setResult(null);
    setShowGroupWarning(false);

    // ---- BASE NUMBERS (SAFE DEFAULT) ----
    let baseNumbers: number[];

    if (input.numbersInput.trim()) {
      const baseRes = parseNumberList(input.numbersInput, {
        minRequired: 5,
        maxValue: 99,
      });

      if (!baseRes.ok) return;
      baseNumbers = baseRes.numbers;
    } else {
      // Default base numbers
      baseNumbers = [1, 2, 3, 4, 5, 6];
    }

    // ---- FIXED POSITIONS ----
    let fixedPositions: any = null;
    if (input.fixedFirstInput.trim()) {
      const fixedRes = parseNumberList(input.fixedFirstInput, {
        minRequired: 1,
        maxValue: 99,
      });

      if (!fixedRes.ok) return;
      fixedPositions = { 0: fixedRes.numbers };
    }

    // ---- FORCED NUMBERS ----
    let forcedNumbers: number[] | null = null;
    if (input.forcedInput.trim()) {
      const forcedRes = parseNumberList(input.forcedInput, {
        minRequired: 1,
        maxValue: 99,
      });

      if (!forcedRes.ok) return;
      forcedNumbers = forcedRes.numbers;
    }

    // ---- GROUPS ----
    let groups: any = null;
    if (input.groupAInput || input.groupBInput || input.groupCInput) {
      const parseGroup = (label: string, value: string) => {
        if (!value.trim()) return [];
        const r = parseNumberList(value, { minRequired: 1, maxValue: 99 });
        if (!r.ok) throw new Error(`${label} group: ${r.error}`);
        return r.numbers;
      };

      try {
        groups = {
          A: parseGroup("A", input.groupAInput),
          B: parseGroup("B", input.groupBInput),
          C: parseGroup("C", input.groupCInput),
        };
      } catch {
        return;
      }
    }

    // ---- B2: GROUPS OUTSIDE BASE WARNING ----
    if (groups) {
      const baseSet = new Set(baseNumbers);
      const allGroupNumbers = [
        ...(groups.A || []),
        ...(groups.B || []),
        ...(groups.C || []),
      ];

      const hasOutside = allGroupNumbers.some((n) => !baseSet.has(n));
      if (hasOutside) {
        setShowGroupWarning(true);
      }
    }

    // ---- PAYLOAD (CANONICAL) ----
    const payload = {
      numbers: baseNumbers,

      limit:
        input.limit && parseInt(input.limit) > 0
          ? parseInt(input.limit)
          : null,

      fixed_positions: fixedPositions,
      forced_numbers: forcedNumbers,

      groups:
        groups && Object.keys(groups).length > 0
          ? groups
          : null,

      group_limits:
        input.quotaA || input.quotaB || input.quotaC
          ? {
              A: input.quotaA ? parseInt(input.quotaA) : undefined,
              B: input.quotaB ? parseInt(input.quotaB) : undefined,
              C: input.quotaC ? parseInt(input.quotaC) : undefined,
            }
          : null,

      range_mode: input.rangeMode || "global",

      per_ball_ranges:
        input.perBallRanges && Object.keys(input.perBallRanges).length > 0
          ? input.perBallRanges
          : null,
    };

    const out = await generateSystem(payload);
    setResult(out);
  };

  // -----------------------------
  // RESULT TEXT
  // -----------------------------
  const resultText =
    result?.combinations
      ?.map((c: number[]) => c.join(" "))
      .join("\n") ?? "";

  // =====================================================
  // UI
  // =====================================================
  return (
    <>
      <h1>Lottery System Generator</h1>

      <div style={{ fontSize: 13, color: "#C8CCD4", marginBottom: 12 }}>
        To start, enter at least 5 numbers.<br />
        Allowed range: <strong>1–99</strong>.<br /><br />
        If no numbers are entered, a default example system is generated
        to demonstrate how the tool works.
      </div>

      <DataInputPanel
        title={
          <>
            Base Numbers
            <HelpTip text="Base Numbers define the main pool used to generate combinations.
Add more numbers to increase variety, or fewer to generate tighter systems." />
          </>
        }
        subtitle="Enter numbers manually"
        value={input.numbersInput}
        onChange={(v) => setInput({ numbersInput: v })}
        hint="Use spaces, commas, or paste from PDF"
      />

      <DataInputPanel
        title={
          <>
            Fixed Position – Ball #1
            <HelpTip text="Restricts which numbers may appear in the first position." />
          </>
        }
        subtitle="Restrict possible values for the first ball"
        value={input.fixedFirstInput}
        onChange={(v) => setInput({ fixedFirstInput: v })}
        hint="Optional. Leave empty to disable."
      />

      <DataInputPanel
        title={
          <>
            Forced Numbers
            <HelpTip text="These numbers will appear in every generated combination." />
          </>
        }
        subtitle="These numbers must appear in every combination"
        value={input.forcedInput}
        onChange={(v) => setInput({ forcedInput: v })}
        hint="Optional."
      />

      {/* GROUPS */}
      <div className="collapse-card">
        <div className="collapse-content">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Groups
            <HelpTip
              text={
                "Groups are filters, not independent number pools.\n\n" +
                "Base Numbers define the generation pool.\n" +
                "Groups only apply to numbers already present in Base Numbers.\n\n" +
                "If Base Numbers are provided, group numbers outside Base will be ignored."
              }
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            <DataInputPanel
              title="Group A"
              value={input.groupAInput}
              onChange={(v) => setInput({ groupAInput: v })}
              placeholder="1 5 12"
              rows={1}
            />
            <DataInputPanel
              title="Group B"
              value={input.groupBInput}
              onChange={(v) => setInput({ groupBInput: v })}
              placeholder="7 9 22"
              rows={1}
            />
            <DataInputPanel
              title="Group C"
              value={input.groupCInput}
              onChange={(v) => setInput({ groupCInput: v })}
              placeholder="3 18 27"
              rows={1}
            />
          </div>
        </div>
      </div>

      <CollapseSection title="Group Quotas & Limits" defaultOpen>
        <input
          placeholder="A max"
          value={input.quotaA}
          onChange={(e) => setInput({ quotaA: e.target.value })}
        />
        <input
          placeholder="B max"
          value={input.quotaB}
          onChange={(e) => setInput({ quotaB: e.target.value })}
        />
        <input
          placeholder="C max"
          value={input.quotaC}
          onChange={(e) => setInput({ quotaC: e.target.value })}
        />
        <input
          placeholder="Max combinations"
          value={input.limit}
          onChange={(e) => setInput({ limit: e.target.value })}
        />
      </CollapseSection>

      <CollapseSection title="Generate & Result" defaultOpen>
        <button onClick={handleGenerate} className="btn btn-primary">
          Generate System
        </button>

        {result && (
          <>
            <DataInputPanel
              title="Generated Combinations"
              subtitle={`Total combinations: ${result.count}`}
              value={resultText}
              onChange={() => {}}
              readOnly
              rows={10}
              footer={
                <ExportPanel
                  rows={result.combinations}
                  filename="generated_system"
                />
              }
            />

            {/* B1 — Sequential exclusion info */}
            <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 6 }}>
              Some highly sequential combinations were excluded
              to improve diversity.
            </div>

            {/* B2 — Groups outside base */}
            {showGroupWarning && (
              <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 4 }}>
                Some group numbers are not present in Base Numbers
                and were ignored.
              </div>
            )}
          </>
        )}
      </CollapseSection>
    </>
  );
}
