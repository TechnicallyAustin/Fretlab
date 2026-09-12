"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 *
 * The loading, empty and error states §1 requires on every screen, in one place
 * so the copy stays consistent.
 *
 * §7: an empty state names the action that fills it; an error state names what
 * failed and what to do next. Neither apologises.
 */
export function StateNotice({
  tone,
  title,
  detail,
  actionLabel,
  onAction,
}: {
  tone: "loading" | "empty" | "error";
  title: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className={`state-notice state-notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
      aria-busy={tone === "loading"}
    >
      {tone === "loading" && <i className="state-notice-spinner" aria-hidden="true" />}
      <strong>{title}</strong>
      {detail && <p>{detail}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
