"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
import { StatusBar } from "@/components/fretlab/StatusBar";

export function AppHeader({
  title,
  meta,
  onBack,
  action,
}: {
  title: string;
  meta?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <>
      <StatusBar end={meta ?? title} />
      <div className="screen-heading">
        {onBack && (
          <button className="back" onClick={onBack} aria-label="Go back">
            ←
          </button>
        )}
        <h1>{title}</h1>
        {action}
      </div>
    </>
  );
}
