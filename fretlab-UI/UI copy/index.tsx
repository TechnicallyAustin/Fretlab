import type { CSSProperties, ReactNode } from "react";
import { cx } from "../primitives";

/* ── Fretboard ──────────────────────────────────────────────
   One renderer behind every neck in the app: the full-neck map,
   the card thumbnails, the numbered drill path and the chord
   diagrams. Everything is a marker on a (string, fret) grid, so
   transposing is still "change one integer" the way the API
   already models it.

   stringIndex is 0 at the top row as drawn (high E in standard
   tuning), matching the E B G D A E labels on screen. */

export type MarkerTone = "root" | "third" | "fifth" | "scale" | "ghost";
export type MarkerShape = "circle" | "square";

export interface Marker {
  id?: string;
  stringIndex: number;
  fret: number;
  label?: ReactNode;
  tone?: MarkerTone;
  shape?: MarkerShape;
  /** Sounded but not picked (hammer, pull, slide) — drawn with a dashed ring. */
  dashed?: boolean;
  /** Pulls the marker forward: the lavender chip treatment. */
  emphasis?: boolean;
  onClick?: () => void;
}

export interface FretboardProps {
  strings?: string[];
  fromFret?: number;
  toFret?: number;
  markers?: Marker[];
  /** Marker ids drawn in order with a dashed trail: the drill path. */
  path?: string[];
  /** Shade a fret window, e.g. the four frets a position occupies. */
  window?: [number, number];
  inlays?: number[];
  showStringLabels?: boolean;
  showFretNumbers?: boolean;
  /** Preview size: thinner rows, no labels, tighter frets. */
  density?: "comfortable" | "compact";
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  /** Controlled marker id for guided playback and inspection. */
  activeMarkerId?: string;
  onMarkerFocus?: (marker: Marker) => void;
}

const DEFAULT_STRINGS = ["E", "B", "G", "D", "A", "E"];
const DEFAULT_INLAYS = [3, 5, 7, 9, 12];

const TONE_FILL: Record<MarkerTone, string> = {
  root: "var(--fl-root)",
  third: "var(--fl-third)",
  fifth: "var(--fl-neck)",
  scale: "var(--fl-scale)",
  ghost: "transparent",
};

const TONE_TEXT: Record<MarkerTone, string> = {
  root: "#1b1a1f",
  third: "#ffffff",
  fifth: "#ffffff",
  scale: "#ffffff",
  ghost: "var(--fl-ghost)",
};

export function Fretboard({
  strings = DEFAULT_STRINGS,
  fromFret = 0,
  toFret = 12,
  markers = [],
  path,
  window: fretWindow,
  inlays = DEFAULT_INLAYS,
  showStringLabels = true,
  showFretNumbers = true,
  density = "comfortable",
  ariaLabel = "Fretboard",
  className,
  style,
  activeMarkerId,
  onMarkerFocus,
}: FretboardProps) {
  const compact = density === "compact";
  const rowH = compact ? 22 : 36;
  const fretW = compact ? 34 : 58;
  const openW = fromFret === 0 ? (compact ? 26 : 42) : 0;
  const labelW = showStringLabels ? (compact ? 14 : 22) : 0;
  const numberH = showFretNumbers ? (compact ? 16 : 24) : 0;
  const radius = compact ? 8.5 : 14;
  const pad = 6;

  const firstWiredFret = Math.max(fromFret, 1);
  const fretCount = toFret - firstWiredFret + 1;

  const boardX = labelW + pad;
  const boardY = pad;
  const boardW = openW + fretCount * fretW;
  const boardH = strings.length * rowH;
  const width = boardX + boardW + pad;
  const height = boardY + boardH + numberH + pad;

  const rowY = (i: number) => boardY + rowH * i + rowH / 2;
  const fretX = (fret: number) =>
    fret === 0 && fromFret === 0
      ? boardX + openW / 2
      : boardX + openW + (fret - firstWiredFret) * fretW + fretW / 2;
  const wireX = (fret: number) => boardX + openW + (fret - firstWiredFret + 1) * fretW;

  const byId = new Map(markers.filter((m) => m.id).map((m) => [m.id as string, m]));
  const trail = (path ?? [])
    .map((id) => byId.get(id))
    .filter((m): m is Marker => Boolean(m));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cx("fl-neck__svg", className)}
      style={style}
      role="img"
      aria-label={ariaLabel}
    >
      <rect
        x={boardX}
        y={boardY}
        width={boardW}
        height={boardH}
        rx={compact ? 6 : 10}
        fill="var(--fl-neck)"
      />

      {fretWindow && (
        <rect
          x={fretX(fretWindow[0]) - fretW / 2}
          y={boardY}
          width={(fretWindow[1] - fretWindow[0] + 1) * fretW}
          height={boardH}
          fill="var(--fl-third)"
          opacity={0.16}
        />
      )}

      {/* inlay dots */}
      {inlays
        .filter((f) => f >= firstWiredFret && f <= toFret)
        .map((f) => (
          <circle
            key={`inlay-${f}`}
            cx={fretX(f)}
            cy={boardY + boardH / 2}
            r={compact ? 2 : 3.5}
            fill="var(--fl-inlay)"
          />
        ))}

      {/* fret wires */}
      {Array.from({ length: fretCount }, (_, i) => firstWiredFret + i).map((f) => (
        <line
          key={`wire-${f}`}
          x1={wireX(f)}
          x2={wireX(f)}
          y1={boardY}
          y2={boardY + boardH}
          stroke="var(--fl-fretwire)"
          strokeWidth={1}
        />
      ))}
      {fromFret === 0 && (
        <line
          x1={boardX + openW}
          x2={boardX + openW}
          y1={boardY}
          y2={boardY + boardH}
          stroke="rgba(255,255,255,.4)"
          strokeWidth={2}
        />
      )}

      {/* strings */}
      {strings.map((_, i) => (
        <line
          key={`string-${i}`}
          x1={boardX}
          x2={boardX + boardW}
          y1={rowY(i)}
          y2={rowY(i)}
          stroke="var(--fl-string)"
          strokeWidth={0.6 + i * 0.16}
        />
      ))}

      {/* the drill path */}
      {trail.slice(0, -1).map((m, i) => {
        const n = trail[i + 1];
        const x1 = fretX(m.fret);
        const y1 = rowY(m.stringIndex);
        const x2 = fretX(n.fret);
        const y2 = rowY(n.stringIndex);
        return (
          <path
            key={`trail-${i}`}
            className="fl-neck__trail"
            d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - rowH * 0.35} ${x2} ${y2}`}
            fill="none"
            stroke="rgba(255,255,255,.34)"
            strokeWidth={1.2}
            strokeDasharray="4 4"
          />
        );
      })}

      {/* markers */}
      {markers.map((m, i) => {
        const tone = m.tone ?? "scale";
        const x = fretX(m.fret);
        const y = rowY(m.stringIndex);
        const isSquare = m.shape === "square" || m.emphasis;
        const fill = m.emphasis ? "var(--fl-root)" : TONE_FILL[tone];
        const text = m.emphasis ? "#1b1a1f" : TONE_TEXT[tone];
        return (
          <g
            key={m.id ?? `m-${i}`}
            className={cx("fl-neck__marker", m.id === activeMarkerId && "fl-neck__marker--active")}
            data-marker-id={m.id}
            onClick={() => { m.onClick?.(); onMarkerFocus?.(m); }}
            onKeyDown={(m.onClick || onMarkerFocus) ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                m.onClick?.();
                onMarkerFocus?.(m);
              }
            } : undefined}
            role={m.onClick || onMarkerFocus ? "button" : undefined}
            tabIndex={m.onClick || onMarkerFocus ? 0 : undefined}
            aria-label={m.onClick || onMarkerFocus ? `${m.label ?? "Note"}, string ${m.stringIndex + 1}, fret ${m.fret}` : undefined}
            style={m.onClick || onMarkerFocus ? { cursor: "pointer" } : undefined}
          >
            {isSquare ? (
              <rect
                x={x - radius}
                y={y - radius}
                width={radius * 2}
                height={radius * 2}
                rx={4}
                fill={fill}
                stroke={tone === "ghost" ? "var(--fl-ghost)" : "rgba(255,255,255,.5)"}
                strokeWidth={1}
                strokeDasharray={m.dashed ? "3 3" : undefined}
              />
            ) : (
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={fill}
                stroke={tone === "ghost" ? "var(--fl-ghost)" : "rgba(255,255,255,.62)"}
                strokeWidth={tone === "fifth" ? 2 : 1}
                strokeDasharray={m.dashed ? "3 3" : undefined}
              />
            )}
            {tone === "fifth" && !m.emphasis && (
              <circle cx={x} cy={y} r={radius - 4.5} fill="none" stroke="#fff" strokeWidth={1.4} />
            )}
            {m.label !== undefined && (
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={compact ? 8.5 : 13}
                fontWeight={600}
                fill={text}
                style={{ pointerEvents: "none" }}
              >
                {m.label}
              </text>
            )}
          </g>
        );
      })}

      {/* string labels */}
      {showStringLabels &&
        strings.map((s, i) => (
          <text
            key={`label-${i}`}
            x={labelW - 4}
            y={rowY(i)}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={compact ? 8 : 11}
            fill="var(--fl-ink-3)"
          >
            {s}
          </text>
        ))}

      {/* fret numbers */}
      {showFretNumbers && (
        <>
          {fromFret === 0 && (
            <text
              x={fretX(0)}
              y={boardY + boardH + numberH / 2 + 2}
              textAnchor="middle"
              fontSize={compact ? 8 : 11}
              fill="var(--fl-ink-3)"
            >
              0
            </text>
          )}
          {Array.from({ length: fretCount }, (_, i) => firstWiredFret + i).map((f) => (
            <text
              key={`num-${f}`}
              x={fretX(f)}
              y={boardY + boardH + numberH / 2 + 2}
              textAnchor="middle"
              fontSize={compact ? 8 : 11}
              fontWeight={inlays.includes(f) ? 600 : 400}
              fill={inlays.includes(f) ? "var(--fl-ink-2)" : "var(--fl-ink-3)"}
            >
              {f}
            </text>
          ))}
        </>
      )}
    </svg>
  );
}

/** Card-sized preview. Same renderer, tighter geometry. */
export function FretboardMini(props: FretboardProps) {
  return <Fretboard density="compact" {...props} />;
}

/** Open-position chord shape: frets 0 to 4, note names in the markers. */
export function ChordDiagram({
  markers,
  toFret = 4,
  ...rest
}: Omit<FretboardProps, "fromFret" | "toFret"> & { toFret?: number }) {
  return <Fretboard fromFret={0} toFret={toFret} density="compact" markers={markers} {...rest} />;
}

/* ── Legend ─────────────────────────────────────────────────
   Reads the marker vocabulary back to the player. Pass only the
   keys the board actually uses. */
export type LegendKey = "root" | "third" | "fifth" | "scale" | "shape" | "elsewhere";

const LEGEND_LABELS: Record<LegendKey, string> = {
  root: "Root",
  third: "3rd",
  fifth: "5th",
  scale: "Scale tone",
  shape: "The shape",
  elsewhere: "Same notes elsewhere",
};

export function Legend({
  items = ["root", "third", "fifth", "scale"],
  note,
}: {
  items?: Array<LegendKey | { key: LegendKey; label: string }>;
  note?: ReactNode;
}) {
  return (
    <div className="fl-legend">
      {items.map((raw) => {
        const key = typeof raw === "string" ? raw : raw.key;
        const label = typeof raw === "string" ? LEGEND_LABELS[key] : raw.label;
        const swatch =
          key === "shape" ? "square" : key === "elsewhere" ? "ghost" : key;
        return (
          <span className="fl-legend__item" key={key}>
            <span className={`fl-legend__swatch fl-legend__swatch--${swatch}`} aria-hidden="true" />
            {label}
          </span>
        );
      })}
      {note}
    </div>
  );
}
