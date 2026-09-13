import type { CSSProperties } from "react";

/* ── CircleOfFifths ─────────────────────────────────────────
   Two rings and a centre. The outer ring is the majors, the
   inner the relative minors, and each wedge is tinted by that
   key's own hue (289 + fifths * 30) so the colour a player
   learns on this screen follows them everywhere else. */

export const MAJORS = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
export const RELATIVE_MINORS = [
  "Am", "Em", "Bm", "F#m", "C#m", "G#m", "D#m", "Bbm", "Fm", "Cm", "Gm", "Dm",
];

export const keyHue = (fifthsIndex: number) => (289 + fifthsIndex * 30) % 360;

export function CircleOfFifths({
  activeIndex = 0,
  mode = "major",
  onSelect,
  size = 320,
}: {
  /** Position around the circle of fifths: 0 = C. */
  activeIndex?: number;
  mode?: "major" | "minor";
  onSelect?: (index: number, name: string) => void;
  size?: number;
}) {
  const c = size / 2;
  const rOuter = c - 4;
  const rMid = c * 0.72;
  const rInner = c * 0.5;
  const step = (Math.PI * 2) / 12;

  const wedge = (i: number, r1: number, r2: number) => {
    const a0 = i * step - step / 2 - Math.PI / 2;
    const a1 = a0 + step;
    const p = (r: number, a: number) => `${c + Math.cos(a) * r} ${c + Math.sin(a) * r}`;
    return [
      `M ${p(r1, a0)}`,
      `A ${r1} ${r1} 0 0 1 ${p(r1, a1)}`,
      `L ${p(r2, a1)}`,
      `A ${r2} ${r2} 0 0 0 ${p(r2, a0)}`,
      "Z",
    ].join(" ");
  };

  const at = (i: number, r: number) => {
    const a = i * step - Math.PI / 2;
    return { x: c + Math.cos(a) * r, y: c + Math.sin(a) * r };
  };

  return (
    <svg
      className="fl-wheel"
      viewBox={`0 0 ${size} ${size}`}
      role="group"
      aria-label="Circle of fifths"
      style={{ "--fl-key-h": keyHue(activeIndex) } as CSSProperties}
    >
      {MAJORS.map((name, i) => {
        const hue = keyHue(i);
        const on = i === activeIndex && mode === "major";
        const pos = at(i, (rOuter + rMid) / 2);
        return (
          <g
            key={name}
            className="fl-wheel__seg"
            onClick={() => onSelect?.(i, name)}
            role="button"
            aria-pressed={on}
            aria-label={`${name} major`}
          >
            <path
              className="fl-wheel__segfill"
              d={wedge(i, rOuter, rMid)}
              fill={`oklch(${on ? 0.72 : 0.95} ${on ? 0.11 : 0.035} ${hue})`}
              stroke="var(--fl-surface)"
              strokeWidth={1.5}
            />
            <text className="fl-wheel__label" x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central">
              {name}
            </text>
          </g>
        );
      })}

      {RELATIVE_MINORS.map((name, i) => {
        const hue = keyHue(i);
        const on = i === activeIndex && mode === "minor";
        const pos = at(i, (rMid + rInner) / 2);
        return (
          <g
            key={name}
            className="fl-wheel__seg"
            onClick={() => onSelect?.(i, name)}
            role="button"
            aria-pressed={on}
            aria-label={`${name} minor`}
          >
            <path
              className="fl-wheel__segfill"
              d={wedge(i, rMid, rInner)}
              fill={`oklch(${on ? 0.78 : 0.975} ${on ? 0.09 : 0.02} ${hue})`}
              stroke="var(--fl-surface)"
              strokeWidth={1.5}
            />
            <text
              className="fl-wheel__label fl-wheel__label--minor"
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {name}
            </text>
          </g>
        );
      })}

      <circle cx={c} cy={c} r={rInner} fill="var(--fl-key-soft)" />
      <text className="fl-wheel__centre-key" x={c} y={c - 6} textAnchor="middle" dominantBaseline="central">
        {mode === "major" ? MAJORS[activeIndex] : RELATIVE_MINORS[activeIndex]}
      </text>
      <text className="fl-wheel__centre-mode" x={c} y={c + 22} textAnchor="middle">
        {mode.toUpperCase()}
      </text>
    </svg>
  );
}

/* ── DegreeChips ────────────────────────────────────────────
   The seven diatonic chords of the current key, numeral first. */
export function DegreeChips({
  degrees,
  hue,
  onSelect,
}: {
  degrees: Array<{ numeral: string; chord: string }>;
  hue?: number;
  onSelect?: (chord: string) => void;
}) {
  return (
    <div
      className="fl-degrees"
      style={hue !== undefined ? ({ "--fl-key-h": hue } as CSSProperties) : undefined}
    >
      {degrees.map((d) => (
        <button
          key={d.numeral}
          type="button"
          className="fl-degree"
          onClick={() => onSelect?.(d.chord)}
        >
          <span className="fl-degree__dot" aria-hidden="true" />
          <span className="fl-degree__numeral">{d.numeral}</span>
          <span className="fl-degree__name">{d.chord}</span>
        </button>
      ))}
    </div>
  );
}
