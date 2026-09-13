import type { CSSProperties, ReactNode } from "react";
import {
  ArrowLink,
  Button,
  Card,
  Eyebrow,
  HearButton,
  LevelBadge,
  ProgressDots,
  Tag,
  cx,
  type Level,
} from "../primitives";
import { FretboardMini, type Marker } from "../fretboard";

export * from "./Hero";

/* ── SongCard ───────────────────────────────────────────────
   Photo card in the song library. The chord chips are the point:
   they say what you need to know before opening it. */
export function SongCard({
  title,
  artist,
  songKey,
  level,
  bpm,
  chords,
  image,
  hue,
  onOpen,
}: {
  title: string;
  artist: string;
  songKey: string;
  level: Level;
  bpm: number;
  chords: string[];
  image?: string;
  hue?: number;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      className="fl-songcard"
      onClick={onOpen}
      style={hue !== undefined ? ({ "--fl-key-h": hue } as CSSProperties) : undefined}
    >
      {image && <img className="fl-songcard__img" src={image} alt="" />}
      <span className="fl-songcard__scrim" aria-hidden="true" />
      <span className="fl-songcard__key">
        <Tag tone="onDark">Key {songKey}</Tag>
      </span>
      <span className="fl-songcard__body">
        <span className="fl-songcard__meta">
          {level} · {bpm} BPM
        </span>
        <span className="fl-songcard__title">{title}</span>
        <span className="fl-songcard__artist">{artist}</span>
        <span className="fl-songcard__chords">
          {chords.map((c) => (
            <span className="fl-chordchip" key={c}>
              {c}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

/* ── LibraryTile ────────────────────────────────────────────
   The four dark doors into the library: keys, chords, scales,
   songs. Count badge is the honest bit of information. */
export function LibraryTile({
  count,
  title,
  description,
  image,
  actionLabel = "Open",
  onOpen,
}: {
  count: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  image?: string;
  actionLabel?: string;
  onOpen?: () => void;
}) {
  return (
    <button type="button" className="fl-tile" onClick={onOpen}>
      {image && <img className="fl-tile__img" src={image} alt="" />}
      <span className="fl-tile__scrim" aria-hidden="true" />
      <span className="fl-tile__count">{count}</span>
      <span className="fl-tile__body">
        <span className="fl-tile__title">{title}</span>
        {description && <span className="fl-tile__desc">{description}</span>}
        <span className="fl-arrowlink fl-arrowlink--onDark">
          {actionLabel} <span aria-hidden="true">→</span>
        </span>
      </span>
    </button>
  );
}

/* ── ScaleCard ──────────────────────────────────────────────
   Index, name, two-word character, the shape, then formula and
   audition. The index is a real sequence (the library is
   ordered by distance from the tonic), so it earns the number. */
export function ScaleCard({
  index,
  name,
  mood,
  level,
  formula,
  markers,
  onHear,
  onOpen,
}: {
  index?: string;
  name: string;
  mood?: string;
  level: Level;
  formula: string;
  markers: Marker[];
  onHear?: () => void;
  onOpen?: () => void;
}) {
  return (
    <Card className="fl-libcard" interactive={Boolean(onOpen)} onClick={onOpen}>
      <div>
        <div>
          {index && <span className="fl-libcard__index">{index}</span>}
          <span className="fl-libcard__name">{name}</span>
        </div>
        {mood && <div className="fl-libcard__mood">{mood}</div>}
      </div>
      <FretboardMini
        markers={markers}
        fromFret={1}
        toFret={6}
        ariaLabel={`${name} shape`}
      />
      <div className="fl-libcard__foot">
        <LevelBadge level={level} />
        <span className="fl-libcard__formula">{formula}</span>
        <HearButton
          onClick={(e) => {
            e.stopPropagation();
            onHear?.();
          }}
        />
      </div>
    </Card>
  );
}

/* ── ChordCard ──────────────────────────────────────────────
   Letter mark, spelled notes, the open shape, intervals. */
export function ChordCard({
  name,
  root,
  notes,
  intervals,
  level,
  markers,
  hue,
  onHear,
  onOpen,
}: {
  name: string;
  root: string;
  notes: string[];
  intervals: string;
  level: Level;
  markers: Marker[];
  hue?: number;
  onHear?: () => void;
  onOpen?: () => void;
}) {
  return (
    <Card
      className="fl-libcard"
      interactive={Boolean(onOpen)}
      onClick={onOpen}
      style={hue !== undefined ? ({ "--fl-key-h": hue } as CSSProperties) : undefined}
    >
      <div className="fl-libcard__head">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="fl-libcard__avatar">{root}</span>
          <div>
            <div className="fl-libcard__name">{name}</div>
            <div className="fl-libcard__notes">{notes.join(" · ")}</div>
          </div>
        </div>
        <span className="fl-libcard__go" aria-hidden="true">
          →
        </span>
      </div>
      <FretboardMini markers={markers} fromFret={0} toFret={4} ariaLabel={`${name} shape`} />
      <div className="fl-libcard__foot">
        <LevelBadge level={level} />
        <span className="fl-libcard__formula">{intervals}</span>
        <HearButton
          onClick={(e) => {
            e.stopPropagation();
            onHear?.();
          }}
        />
      </div>
    </Card>
  );
}

/* ── DrillCard ──────────────────────────────────────────────
   Library row for one drill: what it trains, how long, at what
   tempo, and how far through the three clean passes you are. */
export function DrillCard({
  title,
  description,
  skill,
  level,
  drillKey,
  minutes,
  bpm,
  markers,
  path,
  fromFret,
  toFret,
  passes = 0,
  state,
  onOpen,
}: {
  title: string;
  description: string;
  skill: string;
  level: Level;
  drillKey: string;
  minutes: number;
  bpm?: number | "untimed";
  markers: Marker[];
  path?: string[];
  fromFret?: number;
  toFret?: number;
  passes?: number;
  state?: string;
  onOpen?: () => void;
}) {
  return (
    <Card className="fl-drillcard" interactive onClick={onOpen}>
      <div className="fl-drillcard__top">
        <div style={{ display: "flex", gap: 6 }}>
          <Tag tone="neutral">{skill}</Tag>
          <LevelBadge level={level} />
        </div>
        <div className="fl-drillcard__state">
          {state && <div>{state}</div>}
          <ArrowLink>Open</ArrowLink>
        </div>
      </div>
      <h3 className="fl-drillcard__title">{title}</h3>
      <p className="fl-drillcard__desc">{description}</p>
      <div className="fl-drillcard__meta">
        <Tag tone="neutral">Key {drillKey}</Tag>
        <span>{minutes} min</span>
        <span>{bpm === "untimed" ? "untimed" : `${bpm} bpm`}</span>
        <span style={{ marginLeft: "auto" }}>
          <ProgressDots filled={passes} />
        </span>
      </div>
      <div className="fl-drillcard__board">
        <FretboardMini
          markers={markers}
          path={path}
          fromFret={fromFret}
          toFret={toFret}
          showStringLabels={false}
          ariaLabel={`${title} shape`}
        />
      </div>
    </Card>
  );
}

/* ── Tuner ──────────────────────────────────────────────────
   Permission card first, then one row per string. Keep the
   microphone copy here so the promise travels with the button. */
export function TunerPrompt({
  title = "Tune up",
  body,
  action,
}: {
  title?: ReactNode;
  body: ReactNode;
  action: ReactNode;
}) {
  return (
    <Card>
      <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem" }}>{title}</h3>
      <p style={{ margin: "0 0 18px", color: "var(--fl-ink-2)", lineHeight: 1.55, maxWidth: "46ch" }}>
        {body}
      </p>
      {action}
    </Card>
  );
}

export interface TunerMeterProps {
  note: string;
  octave?: number;
  cents: number;
  listening?: boolean;
  detectedHz?: number;
  confidence?: number;
  signalLevel?: number;
  inputName?: string;
  mode?: "demo" | "live";
  onModeChange?: (mode: "demo" | "live") => void;
  tuningName?: string;
  referenceHz?: number;
  strings?: Array<{ stringNumber: number; note: string; octave: number; tuned?: boolean }>;
  activeString?: number;
  onStringChange?: (stringNumber: number) => void;
  onReferenceChange?: (hz: number) => void;
  onToggle?: () => void;
}

/**
 * Live tuner feedback. Pitch detection remains outside this view: pass the
 * detected note and cents so the same surface works with any audio engine.
 */
export function TunerMeter({
  note,
  octave = 2,
  cents,
  listening,
  detectedHz,
  confidence = 0,
  signalLevel = 0,
  inputName,
  mode = "live",
  onModeChange,
  tuningName = "Standard tuning",
  referenceHz = 440,
  strings = [
    { stringNumber: 6, note: "E", octave: 2 },
    { stringNumber: 5, note: "A", octave: 2 },
    { stringNumber: 4, note: "D", octave: 3 },
    { stringNumber: 3, note: "G", octave: 3 },
    { stringNumber: 2, note: "B", octave: 3 },
    { stringNumber: 1, note: "E", octave: 4 },
  ],
  activeString = 6,
  onStringChange,
  onReferenceChange,
  onToggle,
}: TunerMeterProps) {
  const safeCents = Math.max(-50, Math.min(50, cents));
  const inTune = Boolean(listening) && Math.abs(safeCents) <= 5 && confidence >= .55;
  const centsLabel = inTune ? "In tune" : `${safeCents > 0 ? "+" : ""}${Math.round(safeCents)} cents`;

  return (
    <section
      className="fl-tuner"
      data-listening={Boolean(listening)}
      data-intune={inTune}
      style={{ "--fl-cents": safeCents, "--fl-signal": signalLevel } as CSSProperties}
      aria-label="Live guitar tuner"
    >
      <div className="fl-tuner__chrome">
        <div className="fl-tuner__modes" role="group" aria-label="Input source">
          <button type="button" className="fl-tuner__mode" aria-pressed={mode === "demo"} onClick={() => onModeChange?.("demo")}>Demo signal</button>
          <button type="button" className="fl-tuner__mode" aria-pressed={mode === "live"} onClick={() => onModeChange?.("live")}>Microphone</button>
        </div>
        <span className="fl-tuner__eyebrow">On-device analysis</span>
      </div>
      <div className="fl-tuner__body">
        <div className="fl-tuner__head">
          <div><div className="fl-tuner__eyebrow">Targeted chromatic tuner</div><h3 className="fl-tuner__title">{tuningName}</h3></div>
          <span className="fl-tuner__status" role="status"><span className="fl-tuner__status-dot" aria-hidden="true" />{listening ? "Listening" : "Ready"}</span>
        </div>
        <div className="fl-tuner__stage">
          <span className="fl-tuner__direction fl-tuner__direction--flat">Flat</span><span className="fl-tuner__direction fl-tuner__direction--sharp">Sharp</span>
          <div className="fl-tuner__meter"><div className="fl-tuner__arc" aria-hidden="true"><span className="fl-tuner__sweet" /></div><span className="fl-tuner__needle" aria-hidden="true" /></div>
          <div className="fl-tuner__readout" aria-live="polite">
            <div><span className="fl-tuner__note">{note}</span><span className="fl-tuner__octave">{octave}</span></div>
            <div className="fl-tuner__cents">{centsLabel}</div>
            {detectedHz !== undefined && <div className="fl-tuner__frequency">{detectedHz.toFixed(2)} Hz</div>}
          </div>
        </div>
        <div className="fl-tuner__signal"><span>Input</span><span className="fl-tuner__signal-bars">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ opacity: index / 18 < signalLevel ? .4 + index / 30 : .12 }} />)}</span><span>{signalLevel < .08 ? "Low" : signalLevel > .72 ? "Hot" : "Good"}</span></div>
        <div className="fl-tuner__strings" role="group" aria-label="Target string">
          {strings.map((string) => (
            <button key={string.stringNumber} type="button" className="fl-tuner__string" data-tuned={Boolean(string.tuned)} aria-pressed={string.stringNumber === activeString} onClick={() => onStringChange?.(string.stringNumber)}>
              <span className="fl-tuner__string-status">✓</span>{string.note}<small>{string.stringNumber}</small>
            </button>
          ))}
        </div>
        <div className="fl-tuner__telemetry" aria-label="Input diagnostics">
          <div className="fl-tuner__metric"><span className="fl-tuner__metric-label">Input</span><span className="fl-tuner__metric-value">{inputName ?? (mode === "live" ? "Microphone" : "Demo signal")}</span></div>
          <div className="fl-tuner__metric"><span className="fl-tuner__metric-label">Confidence</span><span className="fl-tuner__metric-value">{confidence ? `${Math.round(confidence * 100)}%` : "—"}</span></div>
          <div className="fl-tuner__metric"><span className="fl-tuner__metric-label">Stability</span><span className="fl-tuner__metric-value">{inTune && confidence >= .72 ? "Locked" : listening ? "Tracking" : "Waiting"}</span></div>
        </div>
        <div className="fl-tuner__foot">
          <div className="fl-tuner__reference" role="group" aria-label="Reference pitch">
            <button className="fl-tuner__ref-btn" type="button" aria-label="Lower reference pitch" onClick={() => onReferenceChange?.(Math.max(430, referenceHz - 1))}>−</button><span>A4 = {referenceHz} Hz</span><button className="fl-tuner__ref-btn" type="button" aria-label="Raise reference pitch" onClick={() => onReferenceChange?.(Math.min(450, referenceHz + 1))}>+</button>
          </div>
          <Button className="fl-tuner__start" variant="primary" onClick={onToggle}>{listening ? "Stop tuning" : mode === "live" ? "Start microphone" : "Start demo"}</Button>
        </div>
        <p className="fl-tuner__hint">Microphone audio is analysed locally, never uploaded or stored.</p>
      </div>
    </section>
  );
}

export function StringRow({
  stringNumber,
  note,
  octave,
  hz,
  active,
  onPlay,
}: {
  stringNumber: number;
  note: string;
  octave: number;
  hz: number;
  active?: boolean;
  onPlay?: () => void;
}) {
  return (
    <div
      className={cx("fl-stringrow", active && "fl-stringrow--active")}
      onClick={onPlay}
      role={onPlay ? "button" : undefined}
      tabIndex={onPlay ? 0 : undefined}
      aria-pressed={onPlay ? Boolean(active) : undefined}
      onKeyDown={onPlay ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPlay();
        }
      } : undefined}
    >
      <span className="fl-stringrow__num">{stringNumber}</span>
      <span className="fl-stringrow__note">
        {note}
        <sub>{octave}</sub>
      </span>
      <span className="fl-stringrow__hz">{hz.toFixed(2)} Hz</span>
    </div>
  );
}

export function TuningList({
  strings,
  caption,
  heading = "Standard tuning",
  order = "low to high",
}: {
  strings: Array<{ stringNumber: number; note: string; octave: number; hz: number }>;
  caption?: ReactNode;
  heading?: ReactNode;
  order?: ReactNode;
}) {
  return (
    <div className="fl-stack">
      <div className="fl-sectionhead" style={{ marginBottom: 0 }}>
        <Eyebrow>{heading}</Eyebrow>
        <span style={{ fontSize: "var(--fl-t-small)", color: "var(--fl-ink-3)" }}>{order}</span>
      </div>
      {strings.map((s) => (
        <StringRow key={s.stringNumber} {...s} />
      ))}
      {caption && (
        <p style={{ fontSize: "var(--fl-t-small)", color: "var(--fl-ink-3)", margin: "4px 0 0" }}>
          {caption}
        </p>
      )}
    </div>
  );
}

/* ── NeighbourRow ───────────────────────────────────────────
   A neighbouring key on the circle, with its spelling. */
export function NeighbourRow({
  keyName,
  label,
  notes,
  hue,
  onOpen,
}: {
  keyName: string;
  label: string;
  notes: string[];
  hue?: number;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      className="fl-neighbour"
      onClick={onOpen}
      style={hue !== undefined ? ({ "--fl-key-h": hue } as CSSProperties) : undefined}
    >
      <span className="fl-keybadge">{keyName}</span>
      <span>
        <span className="fl-neighbour__name" style={{ display: "block" }}>
          {label}
        </span>
        <span className="fl-neighbour__notes">{notes.join(" · ")}</span>
      </span>
      <span aria-hidden="true" style={{ color: "var(--fl-ink-3)" }}>
        →
      </span>
    </button>
  );
}

/* ── TheoryCallout ──────────────────────────────────────────
   The one route out of the library and into the why. */
export function TheoryCallout({
  eyebrow = "Need the why?",
  title,
  body,
  actionLabel = "Open theory",
  onOpen,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  actionLabel?: string;
  onOpen?: () => void;
}) {
  return (
    <Card tone="accent">
      <Eyebrow accent>{eyebrow}</Eyebrow>
      <h3 style={{ margin: "8px 0 6px", fontSize: "1.15rem" }}>{title}</h3>
      {body && <p style={{ margin: "0 0 16px", color: "var(--fl-ink-2)" }}>{body}</p>}
      <Button block variant="outline" trailing="→" onClick={onOpen}>
        {actionLabel}
      </Button>
    </Card>
  );
}
