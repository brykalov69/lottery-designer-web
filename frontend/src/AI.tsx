// AI.tsx

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

export default function AI() {
  const { history } = useHistoryStore();

  // временно, до auth / лицензий
  const isPro = false;

  return (
    <>
      <h1>AI Insights Suite</h1>
      <p>Your advanced analytical and predictive AI tools.</p>
      <div style={{ fontSize: 13, color: "#C8CCD4", marginBottom: 12 }}>
  AI Insights analyze historical data to highlight structural patterns
  and statistical signals.<br />
  They do not predict future outcomes and do not guarantee winnings.
</div>


      {/* 🧠 AI SUMMARY */}
      <AISummary />

      {/* 🔍 GLOBAL FREQUENCY — FREE */}
            <CollapseSection title="Global Frequency (FREE)" defaultOpen>
        <GlobalFrequencyCards />
      </CollapseSection>

      <CollapseSection title="Per-Ball Positional AI">
        <PerBallPositionalPanel isPro={isPro} />
      </CollapseSection>

      <CollapseSection title="AI Recommended Patterns">
        <AIRecommendedPatternsPanel isPro={isPro} />
      </CollapseSection>

      <CollapseSection title="Adjacency & Follow-Up Analysis" defaultOpen>
        <AdjacencyPreview isPro={isPro} />
      </CollapseSection>

      <CollapseSection title="Sequential Drift Patterns (PRO)" defaultOpen>
        <SequentialDriftPanel isPro={isPro} />
      </CollapseSection>

      <CollapseSection title="Next Draw Predictor">
        <NextDrawPredictorPanel isPro={isPro} />
      </CollapseSection>

      <CollapseSection title="AI Ticket Generator">
        <AITicketGeneratorPanel isPro={isPro} />
      </CollapseSection>

      <CollapseSection title="AI Smart Tips">
        <AISmartTipsPanel isPro={isPro} />
      </CollapseSection>

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
