import { useState, useRef, useEffect, type ReactNode } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useSessionStore } from "../stores/useSessionStore";

interface CollapseSectionProps {
  /** Глобальный стабильный ключ: module.section */
  id: string;

  title: ReactNode;
  children: ReactNode;

  /** Используется ТОЛЬКО если ui.collapse[id] ещё не задан */
  defaultOpen?: boolean;

  /** UI / PRO */
  pro?: boolean;
  subtitle?: string;

  /** Совместимость со старым кодом */
  description?: string; // alias для subtitle
  proOnly?: boolean;    // если секция только для PRO
  isPro?: boolean;      // текущий статус пользователя
  preview?: ReactNode;  // мини-превью в заголовке
}

export default function CollapseSection({
  id,
  title,
  children,

  defaultOpen = false,

  pro = false,
  subtitle,

  description,
  proOnly = false,
  isPro = true,
  preview,
}: CollapseSectionProps) {
  const { ui, setUICollapse } = useSessionStore();

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState("0px");

  // 🔐 PRO-lock
  const locked = proOnly && !isPro;

  // subtitle fallback
  const subtitleText = subtitle ?? description;

  // 🔑 ЕДИНЫЙ ИСТОЧНИК OPEN
  const open =
    ui.collapse[id] !== undefined
      ? ui.collapse[id]
      : defaultOpen;

  // toggle → store
  const toggle = () => {
    setUICollapse(id, !open);
  };

  // анимация высоты
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
          e.stopPropagation();
          toggle();
        }}
      >
        <div className="header-left">
          <span className="collapse-title">{title}</span>
          {subtitleText && (
            <span className="collapse-subtitle">{subtitleText}</span>
          )}
        </div>

        <div className="header-right">
          {preview && (
            <span className="collapse-preview">{preview}</span>
          )}

          {(pro || proOnly) && (
            <span className="pro-badge">PRO</span>
          )}

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
