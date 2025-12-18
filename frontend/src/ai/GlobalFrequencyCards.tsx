import { useMemo, useState } from "react";
import { useHistoryStore } from "../stores/historyStore";

type SortMode = "freq_desc" | "freq_asc" | "num_asc";

export default function GlobalFrequencyCards() {
  const { history } = useHistoryStore();

  const [sortMode, setSortMode] = useState<SortMode>("freq_desc");
  const [limit, setLimit] = useState<number>(20);

  const data = useMemo(() => {
    if (!history.payload) return [];

    // 🔑 MAIN BALLS ONLY
    const draws = history.payload.draws.map((d) => d.main);
    const total = draws.length;

    const freq = new Map<number, number>();

    for (const row of draws) {
      for (const n of row) {
        freq.set(n, (freq.get(n) || 0) + 1);
      }
    }

    let arr = Array.from(freq.entries()).map(([num, count]) => ({
      num,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }));

    switch (sortMode) {
      case "freq_asc":
        arr.sort((a, b) => a.count - b.count);
        break;
      case "num_asc":
        arr.sort((a, b) => a.num - b.num);
        break;
      default:
        arr.sort((a, b) => b.count - a.count);
    }

    return limit > 0 ? arr.slice(0, limit) : arr;
  }, [history.payload, sortMode, limit]);

  if (!history.payload) {
    return (
      <p style={{ color: "#C8CCD4" }}>
        Load history to see frequency analysis.
      </p>
    );
  }

  return (
    <>
      {/* CONTROLS */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <label>
          Sort:
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            style={{ marginLeft: 6 }}
          >
            <option value="freq_desc">Most frequent</option>
            <option value="freq_asc">Least frequent</option>
            <option value="num_asc">Number</option>
          </select>
        </label>

        <label>
          Top:
          <input
            type="number"
            min={0}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ width: 80, marginLeft: 6 }}
          />
        </label>
      </div>

      {/* CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 12,
        }}
      >
        {data.map(({ num, count, percent }) => (
          <div
            key={num}
            style={{
              background: "#1F232B",
              borderRadius: 10,
              padding: 12,
              border: "1px solid #2B2F38",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: "bold" }}>{num}</div>

            <div style={{ fontSize: 12, color: "#C8CCD4" }}>
              {count} times
            </div>

            <div style={{ fontSize: 12, marginTop: 4 }}>
              {percent.toFixed(1)}%
            </div>

            <div
              style={{
                marginTop: 6,
                height: 6,
                background: "#2B2F38",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, percent * 2)}%`,
                  height: "100%",
                  background: "#4F7FFF",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
