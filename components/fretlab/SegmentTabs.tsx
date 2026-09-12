"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
export function SegmentTabs({
  labels,
  active,
  onChange,
}: {
  labels: string[];
  active: string;
  onChange: (label: string) => void;
}) {
  return (
    <div className="segment-tabs" role="tablist">
      {labels.map((label) => (
        <button
          role="tab"
          aria-selected={label === active}
          className={label === active ? "active" : ""}
          onClick={() => onChange(label)}
          key={label}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
