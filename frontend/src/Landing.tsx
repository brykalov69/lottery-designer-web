import CollapseSection from "./components/CollapseSection";

export default function Landing() {
  return (
    <>
      {/* 1. HERO */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <h1>Stop letting a machine pick your lottery numbers.</h1>
        <p style={{ color: "#9AA0AA", maxWidth: 720 }}>
          Most lottery tickets today are generated in one click — fast, random,
          and opaque. LotteryDesigner helps you understand how combinations are
          structured before you play.
        </p>

        <a href="/generator" className="btn btn-primary" style={{ marginTop: 12 }}>
          Start generating
        </a>
      </section>

      {/* 2. PROBLEM */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        <h2>The problem with quick-picks</h2>
        <p>
          When a machine generates numbers, you don’t know why those numbers were
          chosen, how they relate to each other, or what your ticket actually
          covers.
        </p>
      </section>

      {/* 3. SHIFT */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        <h2>A different way to think</h2>
        <p>
          LotteryDesigner does not predict outcomes or guarantee winnings.
          Instead, it shows the structure behind combinations so you can make
          informed choices.
        </p>
      </section>

      {/* 4. VALUE */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        <h2>What you gain</h2>
        <ul>
          <li>See how combinations work together</li>
          <li>Control coverage instead of blind randomness</li>
          <li>Decide how much you play — and why</li>
        </ul>
      </section>

      {/* 5. CTA (повтор) */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        <a href="/generator" className="btn btn-primary">
          Go to Generator
        </a>
      </section>

      {/* 6. FAQ */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 40px" }}>
        <CollapseSection id="landing.faq" title="Frequently asked questions">
          <h3>Does LotteryDesigner predict winning numbers?</h3>
          <p>
            No. It provides analytical insight only and does not increase winning
            odds.
          </p>

          <h3>How is this different from a quick-pick?</h3>
          <p>
            Quick-picks generate isolated random tickets. LotteryDesigner shows
            how combinations relate and what they actually cover.
          </p>

          <h3>Is it legal to use?</h3>
          <p>
            Yes. It does not interact with lottery operators or influence draw
            results.
          </p>
        </CollapseSection>
      </section>
    </>
  );
}
