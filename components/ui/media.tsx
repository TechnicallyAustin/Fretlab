import type { CSSProperties, ReactNode } from "react";
import { cx } from "./primitives";

export function PracticeHero({
  eyebrow,
  title,
  body,
  image,
  primary,
  secondary,
  meta = [],
  recommendation,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  body: ReactNode;
  image: string;
  primary: ReactNode;
  secondary?: ReactNode;
  meta?: ReactNode[];
  recommendation?: ReactNode;
}) {
  return (
    <section className="fl-system-intro fl-practicehero">
      <div className="fl-stream-hero__copy">
        <span className="fl-system-intro__label">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="fl-stream-hero__actions">{primary}{secondary}</div>
        <div className="fl-stream-hero__meta">{meta.map((item, index) => <span key={index}>{item}</span>)}</div>
      </div>
      <div className="fl-stream-hero__art" role="img" aria-label="Practice artwork" style={{ backgroundImage: `linear-gradient(90deg, rgba(255,255,255,.2), transparent 28%), url(${image})` }}>
        {recommendation && <span className="fl-stream-hero__now"><i />{recommendation}</span>}
      </div>
    </section>
  );
}

export type MediaCardTone = "photo" | "chords" | "time" | "ear";

export function MediaCard({
  eyebrow,
  title,
  description,
  progress = 0,
  tone = "chords",
  image,
  onOpen,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  progress?: number;
  tone?: MediaCardTone;
  image?: string;
  onOpen?: () => void;
}) {
  const artStyle = image ? ({ backgroundImage: `url(${image})` } as CSSProperties) : undefined;
  return (
    <button type="button" className="fl-media-card" onClick={onOpen}>
      <span className={cx("fl-media-card__art", `fl-media-card__art--${tone}`)} style={artStyle}><span className="fl-media-card__play">▶</span></span>
      <span className="fl-media-card__body">
        <span className="fl-media-card__kicker">{eyebrow}</span>
        <strong>{title}</strong><span>{description}</span>
        <i aria-label={`${progress}% complete`}><b style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></i>
      </span>
    </button>
  );
}

export function MediaShelf({
  eyebrow,
  title,
  children,
  onSeeAll,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  onSeeAll?: () => void;
}) {
  return (
    <section className="fl-media-shelf">
      <div className="fl-media-shelf__head"><div>{eyebrow && <span className="fl-media-shelf__eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{onSeeAll && <button type="button" className="fl-media-shelf__all" onClick={onSeeAll}>See all <span aria-hidden="true">→</span></button>}</div>
      <div className="fl-media-rail">{children}</div>
    </section>
  );
}

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function PracticePlayer({
  title,
  subtitle,
  cover,
  playing,
  liked,
  loop = true,
  metronome = true,
  progress = 0,
  duration = 160,
  bpm = 84,
  volume = 72,
  onToggle,
  onPrevious,
  onNext,
  onLike,
  onLoop,
  onMetronome,
  onProgress,
  onBpm,
  onVolume,
}: {
  title: ReactNode; subtitle?: ReactNode; cover?: string; playing?: boolean; liked?: boolean; loop?: boolean; metronome?: boolean;
  progress?: number; duration?: number; bpm?: number; volume?: number;
  onToggle?: () => void; onPrevious?: () => void; onNext?: () => void; onLike?: () => void; onLoop?: () => void; onMetronome?: () => void;
  onProgress?: (seconds: number) => void; onBpm?: (bpm: number) => void; onVolume?: (volume: number) => void;
}) {
  return (
    <aside className="fl-player" data-playing={Boolean(playing)} aria-label="Practice player">
      <div className="fl-player__track">{cover && <span className="fl-player__cover" style={{ backgroundImage: `url(${cover})` }} />}<span className="fl-player__copy"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span><button type="button" className="fl-player__heart" aria-label="Save exercise" aria-pressed={Boolean(liked)} onClick={onLike}>{liked ? "♥" : "♡"}</button></div>
      <div className="fl-player__transport"><div className="fl-player__buttons"><button type="button" aria-label="Previous exercise" onClick={onPrevious}>‹</button><button type="button" className="fl-player__play" aria-label={playing ? "Pause exercise" : "Play exercise"} aria-pressed={Boolean(playing)} onClick={onToggle}>{playing ? "Ⅱ" : "▶"}</button><button type="button" aria-label="Next exercise" onClick={onNext}>›</button><button type="button" className="fl-player__loop" aria-label="Loop exercise" aria-pressed={loop} onClick={onLoop}>↻</button></div><div className="fl-player__timeline"><span>{formatTime(progress)}</span><input type="range" min={0} max={duration} value={progress} aria-label="Exercise progress" onChange={(event) => onProgress?.(Number(event.target.value))} /><span>{formatTime(duration)}</span></div></div>
      <div className="fl-player__tools"><button type="button" className="fl-player__tool" aria-label="Metronome" aria-pressed={metronome} onClick={onMetronome}>●</button><div className="fl-player__tempo" role="group" aria-label="Practice tempo"><button type="button" aria-label="Decrease tempo" onClick={() => onBpm?.(Math.max(40, bpm - 2))}>−</button><output>{bpm}<small>BPM</small></output><button type="button" aria-label="Increase tempo" onClick={() => onBpm?.(Math.min(208, bpm + 2))}>+</button></div><span className="fl-player__volume">⌁<input type="range" min={0} max={100} value={volume} aria-label="Volume" onChange={(event) => onVolume?.(Number(event.target.value))} /></span></div>
    </aside>
  );
}
