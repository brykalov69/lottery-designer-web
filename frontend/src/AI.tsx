import CollapseSection from "./components/CollapseSection";
import LockedTeaser from "./components/LockedTeaser";

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
import { IS_PRO } from "./config/flags";

import { track } from "./utils/analytics";

export default function AI() {
  const { history } = useHistoryStore();
  const { openProModal } = useSessionStore();

  return (
    <>
      <h1>AI Insights Suite</h1>

      <div style={{ fontSize: 13, color: "#C8CCD4", marginBottom: 12 }}>
        AI Insights analyze historical data to highlight structural patterns
        and statistical signals.
        <br />
        They do not predict future outcomes and do not guarantee winnings.
      </div>

      {/* 🧠 AI SUMMARY (FREE) */}
      <AISummary />

      {/* 🔍 GLOBAL FREQUENCY — FREE */}
      <CollapseSection
        id="ai.globalFrequency"
        title="Global Frequency (FREE)"
        defaultOpen
      >
        <GlobalFrequencyCards />
      </CollapseSection>

      {/* ========================= PRO INSIGHTS GATE ========================= */}
      {!IS_PRO && (
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
            onClick={() => {
              track("unlock_pro_clicked", {
                source: "ai_insights",
              });
              openProModal("ai_insights");
            }}
          >
            🔒 Unlock PRO
          </button>
        </div>
      )}

      {/* PER-BALL POSITIONAL */}
      <CollapseSection
        id="ai.perBallPositional"
        title="Per-Ball Positional AI"
      >
        <PerBallPositionalPanel isPro={IS_PRO} />
      </CollapseSection>

      {/* AI RECOMMENDED PATTERNS */}
      <CollapseSection
        id="ai.recommendedPatterns"
        title="AI Recommended Patterns"
      >
        <AIRecommendedPatternsPanel isPro={IS_PRO} />
      </CollapseSection>

      {/* ========================= ADJACENCY (TEASER) ========================= */}
      <div className="collapse-card">
        <div className="collapse-header">
          Adjacency & Follow-Up Analysis
        </div>
        <div className="collapse-content">
          <LockedTeaser
            locked={!IS_PRO}
            cta="Unlock PRO to explore full follow-up patterns and transition matrices."
          >
            <AdjacencyPreview isPro={IS_PRO} />
          </LockedTeaser>
        </div>
      </div>

      {/* SEQUENTIAL DRIFT */}
      <CollapseSection
        id="ai.sequentialDrift"
        title="Sequential Drift Patterns"
      >
        <SequentialDriftPanel isPro={IS_PRO} />
      </CollapseSection>

      {/* NEXT DRAW */}
      <CollapseSection
        id="ai.nextDraw"
        title="Next Draw Predictor"
      >
        <NextDrawPredictorPanel isPro={IS_PRO} />
      </CollapseSection>

      {/* AI TICKET GENERATOR */}
      <CollapseSection
        id="ai.ticketGenerator"
        title="AI Ticket Generator"
      >
        <AITicketGeneratorPanel isPro={IS_PRO} />
      </CollapseSection>

      {/* AI SMART TIPS */}
      <CollapseSection
        id="ai.smartTips"
        title="AI Smart Tips"
      >
        <AISmartTipsPanel isPro={IS_PRO} />
      </CollapseSection>

      {/* ========================= HEATMAP (TEASER) ========================= */}
      <div className="collapse-card">
        <div className="collapse-header">
          Heatmap & Hot/Cold Zones
        </div>
        <div className="collapse-content">
          <LockedTeaser
            locked={!IS_PRO}
            cta="Unlock PRO to see all hot & cold zones and understand number ranges."
          >
            <HeatmapPreview isPro={IS_PRO} />
          </LockedTeaser>
        </div>
      </div>

      {!history.payload && (
        <p style={{ color: "#C8CCD4", marginTop: 12 }}>
          Load historical data to unlock AI analysis.
        </p>
      )}

      <div style={{ fontSize: 12, color: "#9AA0AA", marginTop: 16 }}>
        AI insights provide analytical observations based on historical data.
        <br />
        They are not recommendations and should not be interpreted as
        predictions.
      </div>
    </>
  );
}
