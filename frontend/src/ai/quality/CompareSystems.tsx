type Metrics = {
  coverage: number;
  diversity: number;
  frequency: number;
  positional: number;
  driftPenalty: number;
};

function diff(a: number, b: number) {
  if (Math.abs(a - b) < 0.03) return "≈";
  return a > b ? "↑" : "↓";
}

export default function CompareSystems({
  greedy,
  budget,
}: {
  greedy: Metrics;
  budget: Metrics;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <b>Metric</b><b>Greedy</b><b>Budget</b>

        <span>Coverage</span><span>{greedy.coverage.toFixed(2)} {diff(greedy.coverage, budget.coverage)}</span><span>{budget.coverage.toFixed(2)}</span>
        <span>Diversity</span><span>{greedy.diversity.toFixed(2)} {diff(greedy.diversity, budget.diversity)}</span><span>{budget.diversity.toFixed(2)}</span>
        <span>Frequency</span><span>{greedy.frequency.toFixed(2)} {diff(greedy.frequency, budget.frequency)}</span><span>{budget.frequency.toFixed(2)}</span>
        <span>Positional</span><span>{greedy.positional.toFixed(2)} {diff(greedy.positional, budget.positional)}</span><span>{budget.positional.toFixed(2)}</span>
        <span>Drift conflicts</span><span>{greedy.driftPenalty ? "Yes" : "No"}</span><span>{budget.driftPenalty ? "Yes" : "No"}</span>
      </div>
    </div>
  );
}
