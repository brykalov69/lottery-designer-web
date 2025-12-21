import CollapseSection from "./components/CollapseSection";

import AISummary from "./ai/AISummary";
import GlobalFrequencyCards from "./ai/GlobalFrequencyCards";
import HeatmapPreview from "./ai/HeatmapPreview";
import AdjacencyPreview from "./ai/AdjacencyPreview";
import SequentialDriftPanel from "./ai/SequentialDriftPanel";
import PerBallPositionalPanel from "./ai/PerBallPositionalPanel";
import AIRecommendedPatternsPanel from "./ai/AIRecommendedPatternsPanel";
import NextDrawPredictorPanel from "./ai/NextDrawPredictorPanel";
import AISmartTipsPanel from "./ai/AISmartTipsPanel";
import AITicketGeneratorPanel from "./ai/AITicketGeneratorPanel";

import { useHistoryStore } from "./stores/historyStore";
import { useSessionStore } from "./stores/useSessionStore";

export default function AI() {
  const { history } = useHistoryStore();
  const { isPro, openProModal } = useSessionStore();

  return (
    <>
      <h1>AI Insights Suite</h1>

      <div style={{ fontSize: 13, color: "#C8CCD4", marginBottom: 12 }}>
        AI Insights analyze historical data to highlight structural patterns
        and statistical signals.<br />
        They do not predict future outcomes and do not guarantee winnings.
      </div>

      {/* 🧠 AI SUMMARY (FREE) */}
      <AISummary />

      {/* 🔍 GLOBAL FREQUENCY — FREE */}
      <CollapseSection title="Global Frequency (FREE)" defaultOpen>
        <GlobalFrequencyCards />
      </CollapseSection>

      {/* =========================
          PRO INSIGHTS BLOCK
      ========================= */}

      {!isPro && (
        <div
          className="collapse-card"
          style={{ padding: 16, textAlign: "center", marginBottom: 12 }}
        >
          <h3>Advanced AI Insights (PRO)</h3>
          <p style={{ color: "#C8CCD4", marginBottom: 10 }}>
            Unlock deeper AI-driven analysis, including positional structure,
            drift patterns, adjacency behavior and system recommendations.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => openProModal("ai_insights")}
          >
            🔒 Unlock PRO
          </button>
        </div>
      )}

      {/* PER-BALL POSITIONAL */}
      <CollapseSection title="Per-Ball Positional AI">
        <PerBallPositionalPanel isPro={isPro} />
      </CollapseSection>

      {/* AI RECOMMENDED PATTERNS */}
      <CollapseSection title="AI Recommended Patterns">
        <AIRecommendedPatternsPanel isPro={isPro} />
      </CollapseSection>

      {/* ADJACENCY */}
      <CollapseSection title="Adjacency & Follow-Up Analysis" defaultOpen>
        <AdjacencyPreview isPro={isPro} />
      </CollapseSection>

      {/* SEQUENTIAL DRIFT */}
      <CollapseSection title="Sequential Drift Patterns">
        <SequentialDriftPanel isPro={isPro} />
      </CollapseSection>

      {/* NEXT DRAW */}
      <CollapseSection title="Next Draw Predictor">
        <NextDrawPredictorPanel isPro={isPro} />
      </CollapseSection>

      {/* AI TICKET GENERATOR */}
      <CollapseSection title="AI Ticket Generator">
        <AITicketGeneratorPanel isPro={isPro} />
      </CollapseSection>

      {/* AI SMART TIPS */}
      <CollapseSection title="AI Smart Tips">
        <AISmartTipsPanel isPro={isPro} />
      </CollapseSection>

      {/* HEATMAP */}
      <CollapseSection title="Heatmap & Hot/Cold Zones" defaultOpen>
        <HeatmapPreview isPro={isPro} />
      </CollapseSection>

      {!history.payload && (
        <p style={{ color: "#C8CCD4", marginTop: 12 }}>
          Load historical data to unlock AI analysis.
        </p>
      )}

      <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 16 }}>
        AI insights provide analytical observations
        based on historical data.<br />
        They are not recommendations
        and should not be interpreted as predictions.
      </div>
    </>
  );
}
