import { useHistoryStore } from "../stores/historyStore";
import { useSessionStore } from "../stores/useSessionStore";

export default function AISummary() {
  const { history } = useHistoryStore();
  const { openProModal, isPro } = useSessionStore();

  const hasHistory = !!history.payload;
  const totalDraws = history.payload?.meta.totalDraws ?? 0;
  const ballCount = history.payload?.ballCount;

  return (
    <div
      className="ai-summary-card"
      style={{
        background: "#1F232B",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        border: "1px solid #2B2F38",
      }}
    >
      <h3 style={{ marginTop: 0 }}>AI Summary</h3>

      <ul style={{ listStyle: "none", padding: 0, margin: "12px 0" }}>
        <li style={{ marginBottom: 6 }}>
          {hasHistory ? "✓" : "✕"}{" "}
          <b>History</b>{" "}
          {hasHistory
            ? `loaded (${totalDraws} draws${
                ballCount ? `, ${ballCount} main balls` : ""
              })`
            : "not loaded"}
        </li>

        <li style={{ marginBottom: 6 }}>
          ✓ <b>Global Frequency</b>{" "}
          <span style={{ color: "#C8CCD4" }}>(FREE)</span>
        </li>

        <li style={{ marginBottom: 6 }}>
          {isPro ? "✓" : "🔒"} <b>Heatmap & Hot/Cold Zones</b>{" "}
          <span style={{ color: "#C8CCD4" }}>(PRO)</span>
        </li>

        <li style={{ marginBottom: 6 }}>
          {isPro ? "✓" : "🔒"} <b>AI Patterns & Clusters</b>{" "}
          <span style={{ color: "#C8CCD4" }}>(PRO)</span>
        </li>

        <li style={{ marginBottom: 6 }}>
          {isPro ? "✓" : "🔒"} <b>Adjacency & Follow-Up Analysis</b>{" "}
          <span style={{ color: "#C8CCD4" }}>(PRO)</span>
        </li>

        <li>
          {isPro ? "✓" : "🔒"} <b>Next Draw Predictor</b>{" "}
          <span style={{ color: "#C8CCD4" }}>(PRO)</span>
        </li>
      </ul>

      {!hasHistory && (
        <div
          style={{
            fontSize: 13,
            color: "#C8CCD4",
            marginTop: 10,
          }}
        >
          Load historical data to activate AI analysis.
        </div>
      )}

      {!isPro && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px dashed #2B2F38",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontSize: 13 }}>
            Unlock advanced AI analysis, patterns and predictions.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => openProModal("ai_summary")}
          >
            Upgrade to PRO
          </button>
        </div>
      )}
    </div>
  );
}
