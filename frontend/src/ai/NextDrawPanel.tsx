import { useEffect, useState } from "react";

export default function NextDrawPanel({ isPro }: { isPro: boolean }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/ai_next?is_pro=${isPro}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
            setData(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [isPro]);

    if (loading) return <p style={{ color: "#aaa" }}>Loading predictions…</p>;
    if (!data) return <p>No predictor data.</p>;
    if (data.error) return <p style={{ color: "red" }}>{data.error}</p>;

    const candidates = data.candidates || [];

    return (
        <div>
            <h4 style={{ color: "#eee", marginBottom: 10 }}>Top Candidate Numbers</h4>

            {candidates.map((c: any, i: number) => (
                <div
                    key={i}
                    style={{
                        marginBottom: 8,
                        padding: 10,
                        background: "#222",
                        borderRadius: 6,
                        border: "1px solid #333",
                        color: "white",
                    }}
                >
                    <div style={{ fontSize: 16, fontWeight: "bold" }}>
                        {c.number} — score {c.fusion_score}
                    </div>

                    {isPro && (
                        <div style={{ marginTop: 6, fontSize: 13, color: "#ccc" }}>
                            <b>Components:</b><br />
                            Hot: {c.components.hot} |
                            Recency: {c.components.recency} |
                            Rarity: {c.components.rarity} |
                            Adjacency: {c.components.adjacency} |
                            Region: {c.components.region}
                        </div>
                    )}
                </div>
            ))}

            {/* --------------------- BUTTON GOES HERE --------------------- */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
                <button
                    style={{
                        padding: "12px 28px",
                        background: isPro ? "#9b59b6" : "#555",
                        borderRadius: 8,
                        border: "none",
                        cursor: isPro ? "pointer" : "not-allowed",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 16,
                        boxShadow: isPro ? "0 0 12px #8e44ad" : "none",
                        transition: "0.25s ease",
                    }}
                    onClick={() => {
                        if (!isPro) return;
                        alert("AI Ticket Generator (Phase 7B) is coming soon!");
                    }}
                >
                    🔮 Generate AI Tickets
                </button>

                {!isPro && (
                    <p style={{ marginTop: 10, color: "#999" }}>
                        Unlock PRO to generate AI-powered ticket sets.
                    </p>
                )}
            </div>
            {/* ------------------------------------------------------------- */}

            {data.mode === "free_preview" && (
                <p style={{ marginTop: 10, color: "#999" }}>
                    Unlock PRO to view full ranked prediction list.
                </p>
            )}
        </div>
    );
}
