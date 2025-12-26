import { useEffect, useState, useRef } from "react";
import CollapseSection from "./components/CollapseSection";
import DataInputPanel from "./components/DataInputPanel";
import ExportPanel from "./components/ExportPanel";
import HelpTip from "./components/HelpTip";

import { generateSystem } from "./api/api";
import { parseNumberList } from "./utils/numberParser";
import { useSessionStore } from "./stores/useSessionStore";

import { track } from "./utils/analytics";

// --------------------------------------------------
// INSTANT PREVIEW (demo-first, honest UX)
// --------------------------------------------------
function generatePreviewCombinations(): number[][] {
  return [
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 6],
  ];
}

export default function Generator({ aiRanges }: { aiRanges?: any }) {
  // -----------------------------
  // STORE (persistent)
  // -----------------------------
  const session = useSessionStore();

  const input = session.generator.input;
  const result = session.generator.result;
  const status = session.generator.status;
  const error = session.generator.error;

  const setInput = session.setGeneratorInput;
  const setResult = session.setGeneratorResult;
  const setStatus = session.setGeneratorStatus;
  const setError = session.setGeneratorError;

  // -----------------------------
  // UI STATE
  // -----------------------------
  const [showGroupWarning, setShowGroupWarning] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
const previewTrackedRef = useRef(false);

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

  useEffect(() => {
  if (isPreview && !previewTrackedRef.current) {
    previewTrackedRef.current = true;

    track("preview_shown", {
      page: "generator",
    });
  }
}, [isPreview]);

  // -----------------------------
  // GENERATE
  // -----------------------------
  const handleGenerate = async () => {
    previewTrackedRef.current = false;
    // 🔥 Instant preview
    setResult({
      combinations: generatePreviewCombinations(),
      count: 2,
    });
    setIsPreview(true);

    setError(null);
    setShowGroupWarning(false);

    try {
      setStatus("running");

      // ---- BASE NUMBERS ----
      let baseNumbers: number[];

      if (input.numbersInput.trim()) {
        const baseRes = parseNumberList(input.numbersInput, {
          minRequired: 5,
          maxValue: 99,
        });
        if (!baseRes.ok) {
          setStatus("idle");
          setIsPreview(false);
          return;
        }
        baseNumbers = baseRes.numbers;
      } else {
        baseNumbers = [1, 2, 3, 4, 5, 6];
      }

      // ---- FIXED POSITIONS ----
      let fixedPositions: any = null;
      if (input.fixedFirstInput.trim()) {
        const fixedRes = parseNumberList(input.fixedFirstInput, {
          minRequired: 1,
          maxValue: 99,
        });
        if (!fixedRes.ok) {
          setStatus("idle");
          setIsPreview(false);
          return;
        }
        fixedPositions = { 0: fixedRes.numbers };
      }

      // ---- FORCED NUMBERS ----
      let forcedNumbers: number[] | null = null;
      if (input.forcedInput.trim()) {
        const forcedRes = parseNumberList(input.forcedInput, {
          minRequired: 1,
          maxValue: 99,
        });
        if (!forcedRes.ok) {
          setStatus("idle");
          setIsPreview(false);
          return;
        }
        forcedNumbers = forcedRes.numbers;
      }

      // ---- GROUPS ----
      let groups: any = null;
      if (input.groupAInput || input.groupBInput || input.groupCInput) {
        const parseGroup = (value: string) => {
          if (!value.trim()) return [];
          const r = parseNumberList(value, { minRequired: 1, maxValue: 99 });
          if (!r.ok) throw new Error();
          return r.numbers;
        };

        try {
          groups = {
            A: parseGroup(input.groupAInput),
            B: parseGroup(input.groupBInput),
            C: parseGroup(input.groupCInput),
          };
        } catch {
          setStatus("idle");
          setIsPreview(false);
          return;
        }
      }

      // ---- GROUP WARNING (B2) ----
      if (groups) {
        const baseSet = new Set(baseNumbers);
        const allGroupNumbers = [
          ...(groups.A || []),
          ...(groups.B || []),
          ...(groups.C || []),
        ];
        if (allGroupNumbers.some((n) => !baseSet.has(n))) {
          setShowGroupWarning(true);
        }
      }

      // ---- PAYLOAD ----
      const payload = {
        numbers: baseNumbers,
        limit:
          input.limit && parseInt(input.limit) > 0
            ? parseInt(input.limit)
            : null,
        fixed_positions: fixedPositions,
        forced_numbers: forcedNumbers,
        groups: groups && Object.keys(groups).length > 0 ? groups : null,
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
          input.perBallRanges &&
          Object.keys(input.perBallRanges).length > 0
            ? input.perBallRanges
            : null,
      };

      const out = await generateSystem(payload);

      setResult(out);
      setIsPreview(false);

      track("system_generated", {
        mode: "generator",
        combinations: out?.count ?? 0,
      });

      setStatus("done");
    } catch (e: any) {
      setIsPreview(false);
      setError(e?.message ?? "Generation failed");
      setStatus("error");
    }
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
        Currently, the Generator is configured for 5-ball lottery formats.
      </div>

      {/* ---------------- BASE NUMBERS ---------------- */}
      <DataInputPanel
        title={
          <>
            Base Numbers
            <HelpTip text="Base Numbers define the main pool used to generate combinations. Add more numbers for variety, fewer for tighter systems." />
          </>
        }
        subtitle="Enter numbers manually"
        value={input.numbersInput}
        onChange={(v) => setInput({ numbersInput: v })}
        hint="Use spaces, commas, or paste from PDF"
      />

      {/* ---------------- FIXED POSITION ---------------- */}
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

      {/* ---------------- FORCED NUMBERS ---------------- */}
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

      {/* ---------------- GROUPS ---------------- */}
      <div className="collapse-card">
        <div className="collapse-content">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Groups
            <HelpTip
              text={
                "Groups are filters, not independent pools.\n\n" +
                "Base Numbers define the generation pool.\n" +
                "Groups only apply to numbers already present in Base Numbers."
              }
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
<CollapseSection
  id="generator.groupLimits"
  title={
    <>
      Group Quotas & Limits
      <HelpTip
        text={
          "The total number of selected group quotas\n" +
          "(A + B + C) must equal the number of balls\n" +
          "in the lottery system being generated.\n\n" +
          "For example:\n" +
          "• 5-ball lottery → A + B + C = 5\n" +
          "• 6-ball lottery → A + B + C = 6\n\n" +
          "Group limits restrict how many numbers\n" +
          "from each group may appear in a combination.\n\n" +
          "Example:\n" +
          "A max = 2 → no more than 2 numbers from Group A\n" +
          "will appear in any generated combination."
        }
      />
    </>
  }
  defaultOpen
>
  <input
    placeholder="A max"
    value={input.quotaA}
    onChange={(e) => setInput({ quotaA: e.target.value })}
    style={{ width: "100%" }}
  />
  <input
    placeholder="B max"
    value={input.quotaB}
    onChange={(e) => setInput({ quotaB: e.target.value })}
    style={{ width: "100%" }}
  />
  <input
    placeholder="C max"
    value={input.quotaC}
    onChange={(e) => setInput({ quotaC: e.target.value })}
    style={{ width: "100%" }}
  />
  <input
    placeholder="Max combinations"
    value={input.limit}
    onChange={(e) => setInput({ limit: e.target.value })}
    style={{ width: "100%" }}
  />
</CollapseSection>

      {/* ---------------- GENERATE & RESULT ---------------- */}
<div className="collapse-card">
  <div
    className="collapse-header"
    style={{ cursor: "default" }}
  >
    <strong>Generate & Result</strong>
  </div>

  <div className="collapse-content">
    <button
      onClick={handleGenerate}
      className="btn btn-primary"
      disabled={status === "running"}
      style={{ width: "100%", maxWidth: 320 }}
    >
      {status === "running" ? "Generating…" : "Generate System"}
    </button>

    {status === "running" && isPreview && (
      <div
        style={{
          fontSize: 12,
          color: "#9AA0AA",
          marginTop: 6,
          lineHeight: 1.4,
        }}
      >
        Engine is waking up… showing a quick preview meanwhile.
      </div>
    )}

    {error && (
      <div style={{ color: "#ff6b6b", marginTop: 8 }}>
        {error}
      </div>
    )}

    {result && (
      <>
        <DataInputPanel
          title="Generated Combinations"
          subtitle={
            isPreview
              ? "Preview (engine is waking up)"
              : `Total combinations: ${result.count}`
          }
          value={resultText}
          onChange={() => {}}
          readOnly
          rows={10}
          footer={
            !isPreview && (
              <ExportPanel
                rows={result.combinations}
                filename="generated_system"
              />
            )
          }
        />

        {/* B1 */}
        <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 6 }}>
          Some highly sequential combinations were excluded
          to improve diversity.
        </div>

        {/* B2 */}
        {showGroupWarning && (
          <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 4 }}>
            Some group numbers are not present in Base Numbers
            and were ignored.
          </div>
        )}
      </>
    )}
  </div>
  </div>
  </>
);
}

