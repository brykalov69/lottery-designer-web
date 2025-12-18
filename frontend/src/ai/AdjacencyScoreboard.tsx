
export default function AdjacencyScoreboard({ data }: { data?: any }) {
    if (!data || !data.adjacency_index) return null;

    // Build a list of numbers with their metrics
    const rows = Object.entries(data.adjacency_index).map(([n, score]: any) => {
        const number = Number(n);
        const repeat = data.repeat_rate[n] ?? 0;
        const neighbor = data.neighbor_rate[n] ?? 0;

        // TAG rules
        const tags: string[] = [];

        if (score >= 0.7) tags.push("🔥 High adjacency");
        else if (score >= 0.5) tags.push("⭐ Strong");

        if (repeat >= 0.4) tags.push("🔁 Strong repeat");
        if (neighbor >= 0.45) tags.push("↔ Neighbor-linked");

        if (score <= 0.1) tags.push("❄️ Zero adjacency");
        if (repeat < 0.1 && neighbor < 0.1) tags.push("🧊 Cold flow");

        if (neighbor > repeat) tags.push("→ Shift follower");

        return {
            number,
            score,
            repeat,
            neighbor,
            tags,
        };
    });

    // Sort rows by score descending
    const sorted = rows.sort((a, b) => b.score - a.score);

    // coloring function for score backgrounds
    const bgColor = (score: number) => {
        if (score >= 0.7) return "#2ecc71";     // green
        if (score >= 0.5) return "#27ae60";     // mid green
        if (score >= 0.3) return "#444";        // neutral
        if (score <= 0.15) return "#8e44ad";    // purple (very low)
        return "#555";
    };

    return (
        <div style={{ marginTop: 30 }}>
            <h3>Adjacency Scoreboard (PRO)</h3>

            <p style={{ color: "#bbb", marginBottom: 10 }}>
                AI-ranked numbers based on repeat probability, neighbor affinity, and adjacency pattern strength.
            </p>

            <div
                style={{
                    maxHeight: 400,
                    overflowY: "auto",
                    border: "1px solid #333",
                    padding: 8,
                    borderRadius: 8,
                    background: "#111",
                }}
            >
                {sorted.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            padding: 10,
                            marginBottom: 6,
                            borderRadius: 6,
                            background: "#222",
                            border: "1px solid #333",
                            color: "white",
                        }}
                    >
                        {/* Top strip with color */}
                        <div
                            style={{
                                height: 5,
                                width: "100%",
                                background: bgColor(item.score),
                                borderRadius: 4,
                                marginBottom: 6,
                            }}
                        />

                        {/* Basic info */}
                        <b>{item.number}</b>
                        {" — "}
                        Score: {item.score.toFixed(3)}

                        <div style={{ fontSize: 13, color: "#ddd", marginTop: 4 }}>
                            Repeat: {(item.repeat * 100).toFixed(1)}%  
                            {" | "}
                            Neighbor: {(item.neighbor * 100).toFixed(1)}%
                        </div>

                        {/* Tags */}
                        {item.tags.length > 0 && (
                            <div style={{ marginTop: 5, fontSize: 13, color: "#ccc" }}>
                                {item.tags.map((t, idx) => (
                                    <span key={idx} style={{ marginRight: 8 }}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
