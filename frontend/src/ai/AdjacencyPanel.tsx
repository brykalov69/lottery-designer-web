import React, { useEffect, useState } from "react";
import AdjacencyScoreboard from "./AdjacencyScoreboard";

export default function AdjacencyPanel({ isPro }: { isPro: boolean }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`http://localhost:8000/ai_adjacency?is_pro=${isPro}`);
            const json = await res.json();
            setData(json);

            if (json?.error && !json?.mode?.includes("preview")) {
                setError(json.error);
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load adjacency analysis.");
            setData(null);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [isPro]);

    if (loading) {
        return <p style={{ color: "#aaa" }}>Loading adjacency analysis...</p>;
    }

    if (error && !data?.mode?.includes("preview")) {
        return <p style={{ color: "red" }}>{error}</p>;
    }

    if (!data) {
        return <p style={{ color: "#bbb" }}>No adjacency data available.</p>;
    }

    // ============================================================
    // FREE PREVIEW MODE
    // ============================================================
    if (data.mode === "free_preview") {
        return (
            <div style={{ padding: 20, background: "#222", borderRadius: 8, marginTop: 30 }}>
                <h2>Adjacency & Follow-Up Analysis (PRO)</h2>

                <p style={{ color: "#bbb" }}>
                    Upgrade to PRO to unlock full adjacency analytics:
                </p>

                <ul style={{ color: "#bbb", marginBottom: 10 }}>
                    <li>🔍 Repeat & neighbor probability</li>
                    <li>📊 Full adjacency index</li>
                    <li>🔥 Top 10 likely followers</li>
                    <li>🎯 Extended top 20 candidates</li>
                    <li>🧠 AI-driven follow-up predictions</li>
                </ul>

                <hr style={{ border: "1px solid #444", margin: "12px 0" }} />

                <h4 style={{ color: "#ddd" }}>Preview Sample</h4>
                <p style={{ color: "#ccc" }}>
                    Last Draw: {Array.isArray(data.last_draw) ? data.last_draw.join(", ") : "—"}
                </p>

                {Array.isArray(data.likely_followers) && data.likely_followers.length > 0 && (
                    <>
                        <p style={{ marginTop: 8 }}>Likely Followers:</p>
                        <div style={{ color: "white" }}>
                            {data.likely_followers.map((x: any, i: number) => (
                                <div key={i}>
                                    {x.from} → {x.to} (count: {x.count})
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <button
                    style={{
                        marginTop: 15,
                        padding: "8px 20px",
                        background: "#f39c12",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        color: "white",
                        fontWeight: "bold",
                    }}
                >
                    Unlock PRO
                </button>
            </div>
        );
    }

    // ============================================================
    // FULL PRO MODE
    // ============================================================
    return (
        <div style={{ marginTop: 40, padding: 20, background: "#181818", borderRadius: 8 }}>
            <h2>Adjacency & Follow-Up Analysis</h2>

            <p style={{ color: "#bbb" }}>
                Analysis based on repeat events, neighbor events, and adjacency index.
            </p>

            {/* Last Draw */}
            <h3 style={{ marginTop: 20 }}>Last Draw</h3>
            <p style={{ color: "white" }}>
                {Array.isArray(data.last_draw) ? data.last_draw.join(", ") : "—"}
            </p>

            {/* Likely Followers */}
            <h3 style={{ marginTop: 20 }}>Likely Followers (Top 10)</h3>
            <div>
                {Array.isArray(data.likely_followers) && data.likely_followers.length > 0 ? (
                    data.likely_followers.map((x: any, i: number) => (
                        <div
                            key={i}
                            style={{
                                color: "white",
                                padding: "4px 0",
                                borderBottom: "1px solid #333",
                            }}
                        >
                            {x.from} → {x.to} (count: {x.count})
                        </div>
                    ))
                ) : (
                    <p style={{ color: "#777" }}>No adjacency data.</p>
                )}
            </div>

            {/* Scoreboard */}
            <h3 style={{ marginTop: 40 }}>Adjacency Scoreboard</h3>
            <AdjacencyScoreboard data={data} />
        </div>
    );
}
