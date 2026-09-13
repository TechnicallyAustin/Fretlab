import type { CSSProperties, ReactNode } from "react";
import { cx } from "../primitives";

/* ── WeekStrip ──────────────────────────────────────────────
   Seven boxes, one per day, filled by practice minutes. */
export function WeekStrip({
  days,
  todayIndex,
  max = 30,
  labels = ["S", "M", "T", "W", "T", "F", "S"],
}: {
  /** Minutes practised per day, Sunday first. */
  days: number[];
  todayIndex?: number;
  max?: number;
  labels?: string[];
}) {
  return (
    <div className="fl-week">
      {days.map((minutes, i) => (
        <div className="fl-week__cell" key={i}>
          <div
            className={cx("fl-week__box", i === todayIndex && "fl-week__box--today")}
            style={{ background: fill(minutes, max) }}
            title={`${labels[i]}: ${minutes} min`}
          />
          <span className="fl-week__label">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Heatmap ────────────────────────────────────────────────
   Weekdays down, weeks across. Weekends still count towards the
   streak, they just don't get a row. */
export function Heatmap({
  weeks,
  rowLabels = ["M", "Tu", "W", "Th", "F", "Sa", "Su"],
  max = 30,
  monthLabels = [],
  rangeLabel = "Last 3 months",
  selected,
  onSelect,
}: {
  /** weeks[weekIndex][dayIndex] = minutes practised. */
  weeks: number[][];
  rowLabels?: string[];
  max?: number;
  /** Labels positioned over the week where a month begins. */
  monthLabels?: Array<{ label: ReactNode; startWeek: number }>;
  rangeLabel?: string;
  selected?: { week: number; day: number };
  onSelect?: (value: { week: number; day: number; minutes: number }) => void;
}) {
  return (
    <div className="fl-heat" aria-label={`${rangeLabel} practice activity`} style={{ "--fl-heat-weeks": weeks.length } as CSSProperties}>
      <div className="fl-heat__corner">{rangeLabel}</div>
      <div className="fl-heat__months" aria-hidden="true">
        {monthLabels.map(({ label, startWeek }) => (
          <span key={startWeek} style={{ gridColumnStart: startWeek + 1 }}>{label}</span>
        ))}
      </div>
      <div className="fl-heat__labels" aria-hidden="true">
        {rowLabels.map((label) => <span key={label}>{label}</span>)}
      </div>
      <div className="fl-heat__grid">
        {rowLabels.flatMap((label, day) => weeks.map((week, weekIndex) => {
          const minutes = week[day] ?? 0;
          const isSelected = selected?.week === weekIndex && selected.day === day;
          return (
            <button
              type="button"
              key={`${weekIndex}-${day}`}
              className={cx("fl-heat__cell", isSelected && "fl-heat__cell--selected")}
              style={{ background: fill(minutes, max), gridColumn: weekIndex + 1, gridRow: day + 1 }}
              title={`${label}, week ${weekIndex + 1}: ${minutes} min`}
              aria-label={`${label}, week ${weekIndex + 1}: ${minutes} minutes`}
              aria-pressed={isSelected || undefined}
              onClick={() => onSelect?.({ week: weekIndex, day, minutes })}
            />
          );
        }))}
      </div>
    </div>
  );
}

export function HeatLegend({
  less = "Less",
  more = "More",
  steps = 5,
  max = 30,
}: {
  less?: ReactNode;
  more?: ReactNode;
  steps?: number;
  max?: number;
}) {
  return (
    <div className="fl-heatlegend">
      <span>{less}</span>
      {Array.from({ length: steps }, (_, i) => (
        <span
          key={i}
          className="fl-heatlegend__cell"
          style={{ background: fill((i / (steps - 1)) * max, max) }}
        />
      ))}
      <span>{more}</span>
    </div>
  );
}

/** Shared ramp so the strip, the map and the legend never drift apart. */
function fill(value: number, max: number) {
  if (value <= 0) return "var(--fl-surface-sunk)";
  const t = Math.min(1, value / max);
  const step = Math.ceil(t * 4);
  return `color-mix(in oklab, var(--fl-accent) ${step * 22}%, var(--fl-surface-sunk))`;
}
