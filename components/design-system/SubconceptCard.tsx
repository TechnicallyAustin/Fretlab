type SubconceptCardProps = {
  index: number;
  title: string;
  status?: string;
  tone?: "indigo" | "aqua" | "butter" | "coral";
  onClick: () => void;
};

export function SubconceptCard({ index, title, status = "Open concept", tone = "indigo", onClick }: SubconceptCardProps) {
  return (
    <button className={`ds-subconcept-card tone-${tone}`} onClick={onClick}>
      <span className="ds-subconcept-number">{String(index + 1).padStart(2, "0")}</span>
      <span><strong>{title}</strong><small>{status}</small></span>
      <b aria-hidden="true">→</b>
    </button>
  );
}
