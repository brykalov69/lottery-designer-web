import { useState, useRef, useEffect } from "react";

/**
 * Global manager: only ONE HelpTip can be open at a time
 */
let closeActiveHelp: (() => void) | null = null;

export default function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
  }>({
    top: 0,
    left: 0,
    placement: "bottom",
  });

  // --- calculate position
  const calculatePosition = () => {
    if (!iconRef.current) return;

    const rect = iconRef.current.getBoundingClientRect();
    const tooltipHeight = 160;
    const margin = 8;

    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const placeOnTop = spaceBelow < tooltipHeight;

    setPos({
      top: placeOnTop
        ? rect.top - tooltipHeight - margin
        : rect.bottom + margin,
      left: Math.min(rect.left, window.innerWidth - 280),
      placement: placeOnTop ? "top" : "bottom",
    });
  };

  // --- open / close logic
  const toggle = () => {
    if (!open) {
      // close previously opened HelpTip
      closeActiveHelp?.();
      closeActiveHelp = () => setOpen(false);

      setOpen(true);
    } else {
      setOpen(false);
      closeActiveHelp = null;
    }
  };

  // --- positioning + global close handlers
  useEffect(() => {
    if (!open) return;

    calculatePosition();

    const onClickOutside = (e: MouseEvent) => {
      if (
        tipRef.current &&
        !tipRef.current.contains(e.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        closeActiveHelp = null;
      }
    };

    const onInvalidate = () => {
      setOpen(false);
      closeActiveHelp = null;
    };

    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onInvalidate, true);
    window.addEventListener("resize", onInvalidate);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onInvalidate, true);
      window.removeEventListener("resize", onInvalidate);
    };
  }, [open]);

  return (
    <span ref={iconRef} style={{ marginLeft: 6 }}>
      <span
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
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
          ref={tipRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 10000,
            background: "#1F232B",
            border: "1px solid #2B2F38",
            borderRadius: 10,
            padding: "10px 12px",
            width: 260,
            fontSize: 13,
            color: "#E5E7EB",
            boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
            whiteSpace: "pre-line",
          }}
        >
          {/* visual anchor */}
          <div
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              background: "#1F232B",
              transform: "rotate(45deg)",
              left: 16,
              top: pos.placement === "top" ? "100%" : -5,
              borderLeft:
                pos.placement === "top"
                  ? "1px solid #2B2F38"
                  : undefined,
              borderTop:
                pos.placement === "bottom"
                  ? "1px solid #2B2F38"
                  : undefined,
            }}
          />
          {text}
        </div>
      )}
    </span>
  );
}
