import type { ReactNode } from "react";

export function FocusNotice({ label = "Focus now", children }: { label?: string; children: ReactNode }) {
  return <aside className="ds-focus-notice"><strong>{label}</strong><div>{children}</div></aside>;
}
