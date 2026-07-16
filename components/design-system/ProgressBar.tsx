type ProgressBarProps = {
  value: number;
  label?: string;
  className?: string;
};

export function ProgressBar({ value, label, className = "" }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={`ds-progress ${className}`.trim()} aria-label={label ?? `${safeValue}% complete`}>
      <div className="ds-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
        <span style={{ width: `${safeValue}%` }} />
      </div>
      {label ? <div className="ds-progress-label"><span>{label}</span><strong>{safeValue}%</strong></div> : null}
    </div>
  );
}
