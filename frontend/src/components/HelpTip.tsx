import { useState } from "react";

export default function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: "relative", marginLeft: 6 }}
      onClick={(e) => e.stopPropagation()} // 🔑 ВАЖНО
    >
      <span
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer",
          color: "#4F7FFF",
          fontWeight: "bold",
          userSelect: "none",
        }}
        title="Help"
      >
        ℹ️
      </span>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "120%",
            left: 0,
            zIndex: 100,
            background: "#1F232B",
            border: "1px solid #2B2F38",
            borderRadius: 8,
            padding: 10,
            width: 260,
            fontSize: 13,
            color: "#E5E7EB",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
