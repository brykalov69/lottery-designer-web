import React, { useEffect, useState } from "react";

interface Segment {
    id: number;
    label: string;
    range: [number, number];
    count: number;
    score: number; // 0..1 normalized intensity
}

export default function HeatmapPanel({ isPro }: { isPro: boolean }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/ai_heatmap?is_pro=${isPro}`);
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

    if (loading) return <p style={{ color: "#aaa" }}>Loading heatmap…</p>;
    if (!data) return <p>No heatmap data.</p>;
    if (data.error) return <p style={{ color: "red" }}>{data.error}</p>;

    // FREE PREVIEW
    if (data.mode === "free_preview") {
        const seg = data.segments[0];

        return (
            <div style={{ padding: 10 }}>
                <h4 style={{ color: "#ccc" }}>Heatmap Preview (PRO)</h4>
                <p style={{ color: "#bbb" }}>{seg.label}</p>

                <div
                    style={{
                        width: "100%",
                        height: 20,
                        borderRadius: 6,
                        background: "#333",
                        overflow: "hidden",
                        marginTop: 8,
                    }}
                >
                    <div
                        style={{
                            width: `${seg.score * 100}%`,
                            height: "100%",
                            background: heatColor(seg.score),
                            transition: "width 0.3s",
                        }}
                    />
                </div>

                <p style={{ marginTop: 10, color: "#999" }}>
                    Unlock PRO to view full heatmap.
                </p>
            </div>
        );
    }

    // PRO MODE
    const segments: Segment[] = data.segments;

    return (
        <div>
            <h4 style={{ color: "#eee", marginBottom: 10 }}>Heatmap Regions</h4>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {segments.map((seg) => (
                    <div
                        key={seg.id}
                        style={{
                            padding: 6,
                            background: "#222",
                            borderRadius: 6,
                            border: "1px solid #333",
                        }}
                    >
                        <div style={{ color: "white", marginBottom: 4 }}>
                            {seg.label} — count {seg.count}
                        </div>

                        <div
                            style={{
                                width: "100%",
                                height: 20,
                                borderRadius: 6,
                                background: "#333",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: `${seg.score * 100}%`,
                                    height: "100%",
                                    background: heatColor(seg.score),
                                    transition: "width 0.3s",
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------
// HEAT COLOR SCALE (blue → green → yellow → red)
// ---------------------------------------------
function heatColor(score: number): string {
    // score is 0..1
    if (score < 0.2) return "#3498db";      // blue — cold
    if (score < 0.4) return "#2ecc71";      // green — warm-up
    if (score < 0.6) return "#f1c40f";      // yellow — warm
    if (score < 0.8) return "#e67e22";      // orange — hot
    return "#e74c3c";                       // red — very hot
}
