"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
export function StatusBar({ end }: { end: string }) {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <span>{end}</span>
    </div>
  );
}
