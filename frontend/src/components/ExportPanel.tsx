// components/ExportPanel.tsx

type ExportPanelProps = {
  rows: number[][];
  filename?: string;
};

export default function ExportPanel({
  rows,
  filename = "lottery_system",
}: ExportPanelProps) {
  if (!rows || rows.length === 0) return null;

  const text = rows.map((r) => r.join(" ")).join("\n");
  const csv = rows.map((r) => r.join(",")).join("\n");

  const download = (content: string, ext: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printView = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body {
              font-family: monospace;
              padding: 24px;
              background: #fff;
              color: #000;
            }
            pre {
              white-space: pre-wrap;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <pre>${text}</pre>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button
        className="btn btn-secondary"
        onClick={() => navigator.clipboard.writeText(text)}
      >
        Copy
      </button>

      <button
        className="btn btn-secondary"
        onClick={() => download(text, "txt", "text/plain")}
      >
        Export TXT
      </button>

      <button
        className="btn btn-secondary"
        onClick={() => download(csv, "csv", "text/csv")}
      >
        Export CSV
      </button>

      <button
        className="btn btn-secondary"
        onClick={printView}
      >
        Print
      </button>
    </div>
  );
}
