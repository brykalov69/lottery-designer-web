type LockedTeaserProps = {
  locked: boolean;
  children: React.ReactNode;
  cta: string;
};

export default function LockedTeaser({
  locked,
  children,
  cta,
}: LockedTeaserProps) {
  return (
    <div>
      {/* CONTENT — always fully visible */}
      <div>{children}</div>

      {/* CTA — single, clean footer with lock */}
      {locked && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#9AA0AA",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span aria-hidden>🔒</span>
          <span>{cta}</span>
        </div>
      )}
    </div>
  );
}
