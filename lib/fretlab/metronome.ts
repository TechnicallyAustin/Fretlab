/**
 * The metronome's clock.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and may be
 * imported by any layer.
 *
 * The metronome used to be four `<i>` elements with a CSS `animation-delay`.
 * That is not a metronome: it is silent, the CSS animation clock drifts against
 * the audio clock, and changing the tempo restarted the phase instead of
 * continuing it. Every drill in the library states its goal in note values —
 * "four even eighth-note passes", "stay aligned for eight bars" — so the
 * content was written for a metronome the app did not have.
 *
 * This file is the half of that fix with no Web Audio in it. It decides *when*
 * a click happens; `audio.ts` makes the sound and `useMetronome.ts` drives the
 * loop. Keeping the timing pure is what lets it be tested against a fake clock
 * instead of against a real soundcard.
 *
 * The pattern is the standard Web Audio lookahead: a coarse timer wakes up
 * every ~25ms and asks for every click falling inside the next ~100ms, and
 * those get scheduled against `AudioContext.currentTime`. Nothing is ever
 * played from a `setTimeout` callback directly — timer callbacks are late by
 * whatever the main thread was doing, and "late by whatever" is audible.
 */

/** Which of the three click sounds a beat gets. */
export type Accent = "downbeat" | "beat" | "offbeat";

export type Click = {
  /** When to play it, on the audio clock, in seconds. */
  time: number;
  accent: Accent;
  /** Bars since the run began. Negative during the count-in. */
  bar: number;
  /** Beat within the bar, 0-based. */
  beat: number;
  /** Subdivision within the beat, 0-based; 0 is the beat itself. */
  tick: number;
  countIn: boolean;
};

/** Clicks per beat: quarters, eighths, triplets, sixteenths. */
export type Subdivision = 1 | 2 | 3 | 4;

export const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  1: "Quarter notes",
  2: "Eighth notes",
  3: "Triplets",
  4: "Sixteenth notes",
};

export const MIN_BPM = 40;
export const MAX_BPM = 240;

/** How far ahead of the clock to schedule, in seconds. */
const LOOKAHEAD = 0.1;

/**
 * A beat this far in the past means the page was suspended — a backgrounded
 * tab, a locked phone — not that we drifted. Replaying the backlog would fire
 * every missed click at once, so the run resyncs to the current moment instead.
 */
const STALL = 1;

/**
 * Don't schedule the first click at exactly `currentTime`: by the time the
 * graph is built that moment has passed, and a click scheduled in the past
 * plays immediately and out of phase.
 */
const START_LEAD = 0.06;

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return MIN_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

export type MetronomeOptions = {
  bpm?: number;
  /** Beats per bar. */
  meter?: number;
  subdivision?: Subdivision;
  /** Bars of quarter-note clicks before bar 0. */
  countInBars?: number;
};

export class MetronomeScheduler {
  private currentBpm: number;
  private currentMeter: number;
  private currentSubdivision: Subdivision;
  private countInBars: number;

  private running = false;
  private bar = 0;
  private beat = 0;
  private tick = 0;

  /** The audio time of the next click to hand out. */
  private nextTime = 0;
  /** The audio time of the last one handed out, or null before the first. */
  private lastTime: number | null = null;
  /**
   * Whether the gap from `lastTime` to `nextTime` is a whole beat rather than
   * a subdivision. Recorded so a tempo change can re-space that gap without
   * having to reconstruct the position that produced it.
   */
  private gapIsBeat = true;

  constructor(options: MetronomeOptions = {}) {
    this.currentBpm = clampBpm(options.bpm ?? 84);
    this.currentMeter = Math.max(1, Math.round(options.meter ?? 4));
    this.currentSubdivision = options.subdivision ?? 1;
    this.countInBars = Math.max(0, Math.round(options.countInBars ?? 0));
  }

  get bpm(): number {
    return this.currentBpm;
  }

  get meter(): number {
    return this.currentMeter;
  }

  get subdivision(): Subdivision {
    return this.currentSubdivision;
  }

  get isRunning(): boolean {
    return this.running;
  }

  /** Seconds per beat at the current tempo. */
  beatSeconds(): number {
    return 60 / this.currentBpm;
  }

  /** Begin a run. `now` is `AudioContext.currentTime`. */
  start(now: number): void {
    this.running = true;
    // `-0` when there is no count-in, which reads as a bar number in the UI.
    this.bar = this.countInBars === 0 ? 0 : -this.countInBars;
    this.beat = 0;
    this.tick = 0;
    this.lastTime = null;
    this.gapIsBeat = true;
    this.nextTime = now + START_LEAD;
  }

  stop(): void {
    this.running = false;
  }

  /**
   * Change tempo without resetting the bar.
   *
   * The bar, beat and subdivision counters are left exactly where they are;
   * only the gap to the next click is re-measured, from the last click already
   * handed out. So beats already scheduled keep their times and the new tempo
   * takes hold on the next one — which is what a musician turning the dial
   * mid-run expects, and the opposite of what restarting a CSS animation does.
   */
  setBpm(bpm: number): void {
    const next = clampBpm(bpm);
    if (next === this.currentBpm) return;
    this.currentBpm = next;
    this.respace();
  }

  setSubdivision(subdivision: Subdivision): void {
    if (subdivision === this.currentSubdivision) return;
    this.currentSubdivision = subdivision;
    // The beat keeps its place; only where we are inside it can go stale.
    if (this.tick >= subdivision) this.tick = 0;
    this.respace();
  }

  setMeter(meter: number): void {
    const next = Math.max(1, Math.round(meter));
    if (next === this.currentMeter) return;
    this.currentMeter = next;
    if (this.beat >= next) this.beat = 0;
  }

  /**
   * Every click that falls inside the next lookahead window. Call it often —
   * roughly every 25ms — and play what it returns at the times it gives.
   */
  poll(now: number): Click[] {
    if (!this.running) return [];
    if (this.nextTime < now - STALL) {
      // Suspended, not drifting. Drop the backlog and start a fresh bar here.
      this.nextTime = now;
      this.bar = 0;
      this.beat = 0;
      this.tick = 0;
      this.lastTime = null;
      this.gapIsBeat = true;
    }
    const horizon = now + LOOKAHEAD;
    const clicks: Click[] = [];
    while (this.nextTime < horizon) clicks.push(this.emit());
    return clicks;
  }

  private respace(): void {
    if (!this.running || this.lastTime === null) return;
    this.nextTime = this.lastTime + this.gapAfter(this.gapIsBeat);
  }

  /** The gap that follows a click: whole beats through the count-in. */
  private gapAfter(isBeat: boolean): number {
    const beat = this.beatSeconds();
    return isBeat ? beat : beat / this.currentSubdivision;
  }

  private emit(): Click {
    // The count-in is counted in whole beats whatever the subdivision is: it
    // exists to tell you where bar one starts, not to be practised to.
    const countIn = this.bar < 0;
    const click: Click = {
      time: this.nextTime,
      accent:
        this.tick !== 0 ? "offbeat" : this.beat === 0 ? "downbeat" : "beat",
      bar: this.bar,
      beat: this.beat,
      tick: this.tick,
      countIn,
    };
    this.lastTime = this.nextTime;
    this.gapIsBeat = countIn;
    this.nextTime += this.gapAfter(countIn);
    this.advance(countIn);
    return click;
  }

  private advance(countIn: boolean): void {
    if (!countIn) {
      this.tick += 1;
      if (this.tick < this.currentSubdivision) return;
      this.tick = 0;
    }
    this.beat += 1;
    if (this.beat >= this.currentMeter) {
      this.beat = 0;
      this.bar += 1;
    }
  }
}

/**
 * The tempo implied by a series of taps, or null if there aren't enough.
 *
 * Taps are wall-clock milliseconds, oldest first. A gap longer than two
 * seconds is someone starting over rather than keeping time, so only the run
 * of taps after the last such gap counts.
 */
export function tappedTempo(taps: number[]): number | null {
  if (taps.length < 2) return null;
  const gaps: number[] = [];
  for (let i = taps.length - 1; i > 0; i -= 1) {
    const gap = taps[i] - taps[i - 1];
    if (gap <= 0 || gap > 2000) break;
    gaps.push(gap);
  }
  if (gaps.length === 0) return null;
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  return clampBpm(60000 / mean);
}
