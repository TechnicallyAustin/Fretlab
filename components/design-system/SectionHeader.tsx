import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
};

export function SectionHeader({ eyebrow, title, description, action, compact = false }: SectionHeaderProps) {
  return (
    <div className={`ds-section-header ${compact ? "is-compact" : ""}`.trim()}>
      <div>
        <p className="ds-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="ds-section-description">{description}</p> : null}
      </div>
      {action ? <div className="ds-section-action">{action}</div> : null}
    </div>
  );
}
