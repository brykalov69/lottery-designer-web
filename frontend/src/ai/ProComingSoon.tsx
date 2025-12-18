export default function ProComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: "#1F232B",
        borderRadius: 12,
        padding: 14,
        border: "1px dashed #2B2F38",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 6 }}>
        🔒 {title} (PRO)
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#C8CCD4",
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary">Upgrade to PRO</button>
      </div>
    </div>
  );
}
