type Metrics = {
  coverage: number;
  diversity: number;
  frequency: number;
  positional: number;
  driftPenalty: number; // 0 or 1
};

export default function SingleSystemQuality({
  label,
  metrics,
}: {
  label: "Greedy" | "Budget";
  metrics: Metrics;
}) {
  return (
    <div style={{ background: "#1F232B", borderRadius: 12, padding: 14, border: "1px solid #2B2F38" }}>
      <b>{label} — Single System Analysis</b>
      <ul style={{ marginTop: 8 }}>
        <li>Coverage: {metrics.coverage.toFixed(2)}</li>
        <li>Diversity: {metrics.diversity.toFixed(2)}</li>
        <li>Frequency alignment: {metrics.frequency.toFixed(2)}</li>
        <li>Positional balance: {metrics.positional.toFixed(2)}</li>
        <li>Drift conflicts: {metrics.driftPenalty ? "Yes" : "No"}</li>
      </ul>
    </div>
  );
}
