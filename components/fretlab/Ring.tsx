"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
export function Ring({
  value,
  size = 42,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  return (
    <div
      className="ring"
      style={
        {
          "--ring-value": `${value * 3.6}deg`,
          width: size,
          height: size,
        } as React.CSSProperties
      }
      aria-label={label ?? `${value}% complete`}
    >
      <span>{value}%</span>
    </div>
  );
}
