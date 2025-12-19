// HistoricalData.tsx

import { useEffect, useState } from "react";
import CollapseSection from "./components/CollapseSection";
import DataInputPanel from "./components/DataInputPanel";
import { useHistoryStore } from "./stores/historyStore";
import type { HistoryPayload } from "./stores/historyStore";
import HelpTip from "./components/HelpTip";


const API_BASE = import.meta.env.VITE_API_URL;


function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function HistoricalData() {
  const {
    history,
    setHistoryPayload,
    setHistoryLoading,
    setHistoryError,
  } = useHistoryStore();

  // -----------------------------
  // UI STATE
  // -----------------------------
  const [mainBalls, setMainBalls] = useState(5);
  const [hasExtra, setHasExtra] = useState<boolean | null>(null); // 👈 ОБЯЗАТЕЛЬНО
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [summary, setSummary] = useState<{
    rows: number;
    format: string;
    from?: string;
    to?: string;
    years?: number;
    warningExtraBall?: boolean;
    warningDuplicate?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------
  // RESTORE FROM STORE
  // -----------------------------
  useEffect(() => {
    if (history.payload) {
      setMainBalls(history.payload.ballCount);

      const preview = history.payload.draws
        .slice(0, 10)
        .map((row) => {
          const date = row.date ?? "—";
          const main = row.main.join(" ");
          const extra = row.extra && row.extra.length > 0
            ? `  |  extra: ${row.extra.join(" ")}`
            : "";
          return `${date}  |  ${main}${extra}`;
        })
        .join("\n");

      setPreviewText(preview);

      setSummary({
        rows: history.payload.meta.totalDraws,
        format: history.payload.meta.source,
        from: history.payload.meta.from,
        to: history.payload.meta.to,
        years: history.payload.meta.years,
        warningExtraBall: history.payload.meta.warningExtraBall,
        warningDuplicate: history.payload.meta.warningDuplicate,
      });
    }
  }, [history.payload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  // -----------------------------
  // APPLY HISTORY
  // -----------------------------
  const applyHistory = async () => {
    if (hasExtra === null) {
      setError("Please specify whether the lottery has an extra/bonus ball.");
      return;
    }

    setError(null);
    setPreviewText("");
    setSummary(null);

    let format = "";
    let textContent = "";
    let fileB64: string | undefined;

    try {
     if (file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) format = "csv";
  else if (name.endsWith(".xlsx")) format = "xlsx";
  else format = "txt";

  if (format === "xlsx") {
    const buf = await file.arrayBuffer();
    fileB64 = arrayBufferToBase64(buf);
  } else {
    textContent = await file.text();
  }
} else if (pasteText.trim()) {
  format = "txt";          // ✅ FIX
  textContent = pasteText;
} else {
  setError("Please upload a file or paste history text.");
  return;
}


      setHistoryLoading();

      const res = await fetch(`${API_BASE}/history/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textContent || "", //fix
          file_b64: fileB64 ?? "", //fix
          filetype: format.toLowerCase(),
          main_count: mainBalls,
          extra_count: hasExtra ? 1 : 0,
          has_extra: hasExtra, // 👈 ВАЖНО
        }),
      });

      if (!res.ok) {
  const errText = await res.text();
  console.error("History apply backend response:", errText);
  throw new Error(errText || `HTTP ${res.status}`);
}


      const data = await res.json();
      const rows = data.rows || [];

      const draws = rows.map((r: any) => ({
        date: r.draw_date ?? r.date ?? null,
        main: [...(r.main || [])],
        extra: [...(r.extra || [])],
      }));

      const allDates = draws
        .map((d: any) => d.date)
        .filter(Boolean)
        .sort();

      const flatNums = draws.flatMap((d: any) => d.main);

      const years =
        allDates.length > 0
          ? new Set(allDates.map((d: string) => d.slice(0, 4))).size
          : undefined;

      const payload: HistoryPayload = {
        draws,
        ballCount: mainBalls,
        ranges: {
          min: flatNums.length ? Math.min(...flatNums) : 0,
          max: flatNums.length ? Math.max(...flatNums) : 0,
        },
        filters: {},
        meta: {
          totalDraws: draws.length,
          source: file ? "file" : "api",
          validated: true,
          from: allDates[0],
          to: allDates[allDates.length - 1],
          years,
          warningExtraBall: data.stats?.warnings?.possible_extra_ball ?? false,
          warningDuplicate: data.stats?.warnings?.duplicate_numbers ?? false,
        },
      };

      setHistoryPayload(payload);
    } catch (e: any) {
      const msg = e?.message || "History loading failed.";
      setError(msg);
      setHistoryError(msg);
    }
  };

  return (
    <>
      <h1>Historical Data</h1>
      <p style={{ color: "#C8CCD4", marginBottom: 12 }}>
  Historical data is optional, but defines the foundation for Analytics and AI. <br />
  Only main balls are used in analysis and optimization.
</p>


      <CollapseSection
  title={
    <>
      Lottery Structure
      <HelpTip
        text="Number of main balls per draw.
Only main balls are used in analytics, Greedy and AI."
      />
    </>
  }
  defaultOpen
>

        <label>Main balls</label>
        

        <input
          type="number"
          min={1}
          value={mainBalls}
          onChange={(e) =>
            setMainBalls(Math.max(1, Number(e.target.value) || 1))
          }
        />

        <div style={{ marginTop: 12 }}>
          <strong>Extra / Bonus ball present?</strong>
          <HelpTip
  text="Extra balls are ignored in analytics and optimization.
Use YES if your lottery has a bonus or extra ball.
Use NO if all numbers are main balls."
/>
          <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
            <label>
              <input
                type="radio"
                checked={hasExtra === false}
                onChange={() => setHasExtra(false)}
              />{" "}
              NO
            </label>
            <label>
              <input
                type="radio"
                checked={hasExtra === true}
                onChange={() => setHasExtra(true)}
              />{" "}
              YES
            </label>
          </div>
        </div>
      </CollapseSection>

      <CollapseSection title="Upload History File">
      <HelpTip
  text="You can upload a file or paste draw history manually.
Each line should represent one draw."
/>

        <input
          type="file"
          accept=".txt,.csv,.xlsx"
          onChange={handleFileChange}
        />
      </CollapseSection>

      <DataInputPanel
        title="Paste History"
        subtitle="Paste draw history (TXT / CSV style)"
                value={pasteText}
        onChange={(v) => setPasteText(v)}
        rows={6}
      />

      <CollapseSection title="Apply History" defaultOpen>
        <button
          onClick={applyHistory}
          className="btn btn-primary"
          disabled={hasExtra === null}
        >
          Apply History
        </button>

        {error && (
          <div style={{ color: "#e74c3c", marginTop: 8 }}>{error}</div>
        )}
      </CollapseSection>

      {previewText && (
  <DataInputPanel
    title={
      <>
        History Preview
        <HelpTip
          text="Preview shows how your data was parsed.
Verify dates and numbers before applying history."
        />
      </>
    }
    subtitle={`Parsed rows: ${summary?.rows}`}
    value={previewText}
    onChange={() => {}}
    readOnly
    rows={6}
  />
)}


      {summary && (
        <CollapseSection title="Summary" defaultOpen>
          <p>Total rows detected: {summary.rows}</p>

          {summary.from && summary.to && (
            <p>
              History period: {summary.from} → {summary.to}
            </p>
          )}

          {summary.years && (
            <p>Date coverage: {summary.years} years</p>
          )}

          {summary.warningExtraBall && (
            <div className="warning">
              ⚠️ Data does not match selected lottery structure.
              Consider reviewing Extra ball setting.
            </div>
          )}

          {summary.warningDuplicate && (
            <div className="warning">
              ⚠️ Duplicate numbers detected while Extra ball = NO.
              This may indicate incorrect lottery parameters.
            </div>
          )}

          <p>Format: {summary.format}</p>
          <p>Structure: {mainBalls} main balls</p>
        </CollapseSection>
      )}
    </>
  );
}
