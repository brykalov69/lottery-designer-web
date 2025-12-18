import React from "react";

interface Props {
  title: React.ReactNode;
  subtitle?: React.ReactNode;

  value: string;
  onChange: (v: string) => void;

  placeholder?: string;

  error?: string | null;
  hint?: string;

  rows?: number;
  disabled?: boolean;
  readOnly?: boolean;

  footer?: React.ReactNode;
}

export default function DataInputPanel({
  title,
  subtitle,
  value,
  onChange,
  placeholder,
  error,
  hint,
  rows = 4,
  disabled = false,
  readOnly = false,
  footer,
}: Props) {
  return (
    <div className="collapse-card">
      <div className="collapse-content">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 13, color: "#C8CCD4" }}>
              {subtitle}
            </div>
          )}
        </div>

        <textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            resize: "vertical",
            fontFamily: "monospace",
          }}
        />

        {hint && !error && (
          <div style={{ fontSize: 12, color: "#C8CCD4", marginTop: 6 }}>
            {hint}
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: "#e74c3c", marginTop: 6 }}>
            {error}
          </div>
        )}

        {footer && <div style={{ marginTop: 10 }}>{footer}</div>}
      </div>
    </div>
  );
}
