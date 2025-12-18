import { useState, useRef, useEffect, type ReactNode } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface CollapseSectionProps {
  title: React.ReactNode;
  children: ReactNode;

  // новое
  defaultOpen?: boolean;
  pro?: boolean;
  subtitle?: string;

  // совместимость со старым AI.tsx
  description?: string;      // alias для subtitle
  proOnly?: boolean;         // если секция только для PRO
  isPro?: boolean;           // текущий статус пользователя
  preview?: ReactNode;       // мини-превью в заголовке
}

export default function CollapseSection({
  title,
  children,

  defaultOpen = false,

  // новое
  pro = false,
  subtitle,

  // совместимость
  description,
  proOnly = false,
  isPro = true,
  preview,
}: CollapseSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState("0px");

  // если секция PRO-only и юзер не PRO
  const locked = proOnly && !isPro;

  // subtitle fallback
  const subtitleText = subtitle ?? description;

  useEffect(() => {
    if (contentRef.current) {
      setHeight(open ? `${contentRef.current.scrollHeight}px` : "0px");
    }
  }, [open, locked, children]);

  return (
    <div className="collapse-card">
      {/* HEADER */}
      <div
        className="collapse-header"
        onClick={(e) => {
          // ✅ КРИТИЧЕСКИЙ FIX:
          // предотвращаем перехват кликов у контента
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <div className="header-left">
          <span className="collapse-title">{title}</span>
          {subtitleText && (
            <span className="collapse-subtitle">{subtitleText}</span>
          )}
        </div>

        <div className="header-right">
          {preview && <span className="collapse-preview">{preview}</span>}

          {(pro || proOnly) && <span className="pro-badge">PRO</span>}

          {open ? (
            <FiChevronUp className="collapse-icon" />
          ) : (
            <FiChevronDown className="collapse-icon" />
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div
        ref={contentRef}
        className="collapse-content-wrapper"
        style={{ maxHeight: height }}
      >
        <div className="collapse-content">
          {locked ? (
            <div className="collapse-locked">
              <div className="locked-title">PRO feature</div>
              <div className="locked-text">
                Upgrade to access this module.
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
