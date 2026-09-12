"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
/**
 * `start` was the literal string "9:41" — Apple's marketing screenshot time,
 * frozen into the app chrome. A clock that is always wrong is worse than no
 * clock, and the device already shows the real one, so this half is the app's
 * own name instead.
 */
export function StatusBar({ end }: { end: string }) {
  return (
    <div className="status-bar">
      <span>FretLab</span>
      <span>{end}</span>
    </div>
  );
}
