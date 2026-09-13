import { Fragment, type CSSProperties, type ReactNode } from "react";
import { Button, Eyebrow, cx } from "../primitives";

/* ── Tabs ───────────────────────────────────────────────────
   Lesson / Theory link / History on the drill detail screen. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label = "Drill sections",
}: {
  tabs: Array<{ value: T; label: ReactNode }> | T[];
  value: T;
  onChange?: (value: T) => void;
  label?: string;
}) {
  const items = tabs.map((t) => (typeof t === "string" ? { value: t as T, label: t } : t));
  return (
    <div className="fl-tabs" role="tablist" aria-label={label}>
      {items.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={t.value === value}
          className="fl-tabs__tab"
          onClick={() => onChange?.(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── StepStrip ──────────────────────────────────────────────
   Understand → Play slow → Build time. A real sequence, so the
   numbers carry information rather than decorate. */
export interface Step {
  title: ReactNode;
  body?: ReactNode;
}

export function StepStrip({
  steps,
  activeIndex,
  onSelect,
}: {
  steps: Step[];
  activeIndex?: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <ol className="fl-steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {steps.map((s, i) => (
        <li
          key={i}
          className={cx("fl-step", i === activeIndex && "fl-step--on")}
          onClick={onSelect ? () => onSelect(i) : undefined}
          style={onSelect ? { cursor: "pointer" } : undefined}
        >
          <span className="fl-step__n">{i + 1}</span>
          <span>
            <span className="fl-step__title" style={{ display: "block" }}>
              {s.title}
            </span>
            {s.body && <span className="fl-step__body">{s.body}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ── WhyThisDrill ───────────────────────────────────────────
   See → Hear → Use. Answers "what is this for" before the
   player commits four minutes to it. */
export function WhyThisDrill({
  cells,
  aside,
}: {
  cells: Array<{ label: string; value: ReactNode; note?: ReactNode }>;
  aside?: ReactNode;
}) {
  return (
    <div>
      <div className="fl-sectionhead">
        <Eyebrow>Why this drill</Eyebrow>
        {aside}
      </div>
      <div className="fl-why">
        {cells.map((c, i) => (
          <Fragment key={c.label}>
            <div className="fl-why__cell">
              <div className="fl-why__label">{c.label}</div>
              <div className="fl-why__value">{c.value}</div>
              {c.note && <div className="fl-why__note">{c.note}</div>}
            </div>
            {i < cells.length - 1 && (
              <span className="fl-why__arrow" aria-hidden="true">
                →
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** The single sentence that defines done. */
export function GoalBar({ label = "Goal", children }: { label?: string; children: ReactNode }) {
  return (
    <div className="fl-goalbar">
      <span className="fl-goalbar__label">{label}</span>
      <span>{children}</span>
    </div>
  );
}

export function FinishLineCard({
  title,
  note,
  eyebrow = "Finish line",
}: {
  title: ReactNode;
  note?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="fl-finish">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="fl-finish__title">{title}</div>
      {note && <p className="fl-finish__note">{note}</p>}
    </div>
  );
}

/* ── TempoLadder ────────────────────────────────────────────
   Fixed rungs, not a free slider: the progression rule raises
   the target in +5 steps once three clean passes land. */
export function TempoLadder({
  steps,
  value,
  onChange,
  label = "Tempo ladder",
}: {
  steps: number[];
  value: number;
  onChange?: (bpm: number) => void;
  label?: string;
}) {
  return (
    <div>
      <div className="fl-sectionhead">
        <Eyebrow>{label}</Eyebrow>
        <span style={{ fontSize: "var(--fl-t-small)", color: "var(--fl-ink-3)" }}>{value} bpm</span>
      </div>
      <div className="fl-tempo" role="group" aria-label={label}>
        {steps.map((s) => (
          <button
            key={s}
            type="button"
            className="fl-tempo__step"
            aria-pressed={s === value}
            onClick={() => onChange?.(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── MetronomeDial ──────────────────────────────────────────
   BPM readout with a beat ring. `beat` drives the lit tick, so
   the same click engine that fires audio drives the visual. */
export function MetronomeDial({
  bpm,
  beatsPerBar = 4,
  beat = -1,
  running,
  min = 40,
  max = 208,
  note,
  onChange,
  onToggle,
  onTap,
}: {
  bpm: number;
  beatsPerBar?: number;
  beat?: number;
  running?: boolean;
  min?: number;
  max?: number;
  note?: ReactNode;
  onChange?: (bpm: number) => void;
  onToggle?: () => void;
  onTap?: () => void;
}) {
  const size = 168;
  const r = size / 2 - 9;
  const ticks = 40;
  return (
    <div
      className="fl-metro"
      data-running={Boolean(running)}
      style={{ "--fl-beat-duration": `${60000 / bpm}ms` } as CSSProperties}
    >
      <div className="fl-metro__dial">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--fl-line)"
            strokeWidth={1}
            strokeDasharray="2 6"
          />
          {Array.from({ length: beatsPerBar }, (_, i) => {
            const a = (i / beatsPerBar) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={size / 2 + Math.cos(a) * r}
                cy={size / 2 + Math.sin(a) * r}
                r={i === beat ? 5.5 : 3.5}
                fill={i === beat ? "var(--fl-accent)" : "var(--fl-accent-line)"}
              />
            );
          })}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r - 14}
            fill="var(--fl-accent-softer)"
            opacity={0.6}
          />
          {Array.from({ length: ticks }, (_, i) => {
            const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
            const on = i / ticks <= (bpm - min) / (max - min);
            return (
              <line
                key={`t-${i}`}
                x1={size / 2 + Math.cos(a) * (r - 4)}
                y1={size / 2 + Math.sin(a) * (r - 4)}
                x2={size / 2 + Math.cos(a) * (r - 9)}
                y2={size / 2 + Math.sin(a) * (r - 9)}
                stroke={on ? "var(--fl-accent-line)" : "transparent"}
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
        <div className="fl-metro__readout">
          <div className="fl-metro__bpm">{bpm}</div>
          <div className="fl-metro__unit">BPM</div>
        </div>
      </div>

      {note && <p className="fl-metro__note">{note}</p>}

      <input
        className="fl-metro__range"
        type="range"
        min={min}
        max={max}
        value={bpm}
        aria-label="Tempo"
        onChange={(e) => onChange?.(Number(e.target.value))}
      />

      <div className="fl-metro__row">
        <Button size="sm" onClick={() => onChange?.(Math.max(min, bpm - 4))}>
          −4
        </Button>
        <Button size="sm" variant="primary" onClick={onToggle}>
          {running ? "Stop click" : "Start click"}
        </Button>
        <Button size="sm" onClick={() => onChange?.(Math.min(max, bpm + 4))}>
          +4
        </Button>
      </div>
      {onTap && (
        <Button size="sm" variant="quiet" onClick={onTap}>
          Tap
        </Button>
      )}
    </div>
  );
}
