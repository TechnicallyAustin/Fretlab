type ProgressBarProps = {
  value: number;
  label?: string;
  className?: string;
};

export type ProgressTone = "starting" | "building" | "advancing" | "strong" | "mastered";

export function getProgressTone(value: number): ProgressTone {
  if (value >= 100) return "mastered";
  if (value >= 75) return "strong";
  if (value >= 50) return "advancing";
  if (value >= 25) return "building";
  return "starting";
}

export function ProgressBar({ value, label, className = "" }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  const tone = getProgressTone(safeValue);
  return (
    <div className={`ds-progress tone-${tone} ${className}`.trim()} aria-label={label ?? `${safeValue}% complete`}>
      <div className="ds-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
        <span style={{ width: `${safeValue}%` }} />
      </div>
      {label ? <div className="ds-progress-label"><span>{label}</span><strong>{safeValue}%</strong></div> : null}
    </div>
  );
}

export function ProgressValue({ value, className = "" }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return <strong className={`ds-progress-value tone-${getProgressTone(safeValue)} ${className}`.trim()}>{safeValue}%</strong>;
}
