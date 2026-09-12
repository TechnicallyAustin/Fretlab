/**
 * Hearing a string.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and any
 * layer may import it. Nothing in this file touches the microphone or the DOM
 * — it takes a block of samples and returns a frequency, which is what lets
 * `tests/pitch.test.mjs` feed it synthesised reference tones and check the
 * answer to a fraction of a cent instead of holding a guitar up to a laptop.
 *
 * The method is the normalised square difference function (McLeod), which is
 * plain autocorrelation with the loudness divided out. Raw autocorrelation
 * peaks hardest at lag zero and decays, so on a guitar — where the second
 * harmonic is often stronger than the fundamental — it reports the octave
 * above. NSDF normalises each lag against the energy in that lag's own window,
 * so the true period wins.
 */
import type { Tuning } from "./types";
import { STANDARD_TUNING as STANDARD_SETUP } from "./theory";

/** Concert A. Every note name and cent reading is relative to this. */
export const A4 = 440;

/** A guitar's lowest string is 82 Hz; nothing useful is below this. */
const MIN_HZ = 60;
/** Well above the 12th fret of the high E, and below most string squeak. */
const MAX_HZ = 1400;

/**
 * Below this the room is quiet and any "pitch" is noise shaped like a note.
 * Reporting one would be worse than reporting nothing.
 */
const MIN_RMS = 0.01;

/**
 * A peak must reach this share of the best one to be taken as the period.
 *
 * Picking the *first* peak that clears the bar rather than the tallest is what
 * keeps the fundamental from losing to its own second harmonic, which on a
 * freshly plucked bass string is frequently louder.
 */
const PEAK_THRESHOLD = 0.9;

export type PitchOptions = {
  minHz?: number;
  maxHz?: number;
  minRms?: number;
};

/**
 * The fundamental frequency of a block of samples, or null.
 *
 * Null means "no note here" — too quiet, too short, or nothing periodic — and
 * is a normal answer, not a failure. The screen shows it as "play a string".
 */
export function detectPitch(
  samples: Float32Array | readonly number[],
  sampleRate: number,
  options: PitchOptions = {},
): number | null {
  const { minHz = MIN_HZ, maxHz = MAX_HZ, minRms = MIN_RMS } = options;
  const size = samples.length;
  if (size < 64 || !Number.isFinite(sampleRate) || sampleRate <= 0) return null;

  // A DC offset biases every correlation upward. Cheap to remove, and some
  // capture paths carry a large one.
  let mean = 0;
  for (let i = 0; i < size; i += 1) mean += samples[i];
  mean /= size;

  let power = 0;
  for (let i = 0; i < size; i += 1) {
    const value = samples[i] - mean;
    power += value * value;
  }
  if (Math.sqrt(power / size) < minRms) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  // Correlating over fewer than two periods measures noise, so the longest lag
  // considered is half the block however low `minHz` goes.
  const maxLag = Math.min(Math.ceil(sampleRate / minHz), Math.floor(size / 2));
  if (maxLag <= minLag + 1) return null;

  const nsdf = new Float64Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let energy = 0;
    for (let i = 0; i + lag < size; i += 1) {
      const a = samples[i] - mean;
      const b = samples[i + lag] - mean;
      correlation += a * b;
      energy += a * a + b * b;
    }
    nsdf[lag] = energy > 0 ? (2 * correlation) / energy : 0;
  }

  const lag = pickPeriod(nsdf, minLag, maxLag);
  if (lag === null) return null;

  const frequency = sampleRate / lag;
  return frequency >= minHz && frequency <= maxHz ? frequency : null;
}

/**
 * The lag of the true period, interpolated between samples.
 *
 * The correlation is only known at whole samples, but the peak between them is
 * what carries the accuracy: at the low E, one sample of lag is about three
 * cents, so rounding to the nearest sample could never resolve two. Fitting a
 * parabola through the peak and its neighbours recovers the rest.
 */
function pickPeriod(
  nsdf: Float64Array,
  minLag: number,
  maxLag: number,
): number | null {
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    if (nsdf[lag] > best) best = nsdf[lag];
  }
  if (best <= 0) return null;

  const bar = best * PEAK_THRESHOLD;
  for (let lag = minLag + 1; lag < maxLag; lag += 1) {
    const here = nsdf[lag];
    if (here < bar) continue;
    if (here < nsdf[lag - 1] || here < nsdf[lag + 1]) continue;

    const before = nsdf[lag - 1];
    const after = nsdf[lag + 1];
    const curvature = before - 2 * here + after;
    // A flat top has no vertex to find; the sample itself is the best guess.
    if (curvature === 0) return lag;
    const shift = (0.5 * (before - after)) / curvature;
    return lag + (Math.abs(shift) < 1 ? shift : 0);
  }
  return null;
}

const NOTE_NAMES = [
  "C", "C♯", "D", "D♯", "E", "F",
  "F♯", "G", "G♯", "A", "A♯", "B",
];

export type Reading = {
  frequency: number;
  /** Nearest MIDI note number; 69 is A4. */
  midi: number;
  /** "E", "A♯" — sharps, because a tuner has no key to spell against. */
  name: string;
  /** Scientific pitch notation octave, so the low E reads as E2. */
  octave: number;
  /** How far off, in hundredths of a semitone. Negative is flat. */
  cents: number;
};

/** Semitones above A4, as a real number. */
function semitonesFromA4(frequency: number): number {
  return 12 * Math.log2(frequency / A4);
}

export function readingFor(frequency: number): Reading | null {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  const exact = 69 + semitonesFromA4(frequency);
  const midi = Math.round(exact);
  return {
    frequency,
    midi,
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    // MIDI 0 is C-1, so the octave is the note number over twelve, less one.
    octave: Math.floor(midi / 12) - 1,
    cents: (exact - midi) * 100,
  };
}

/** The frequency of a MIDI note in equal temperament. */
export function frequencyOf(midi: number): number {
  return A4 * Math.pow(2, (midi - 69) / 12);
}

export type GuitarString = {
  /** 1 is the high e, 6 the low E, matching the fretboard everywhere else. */
  string: number;
  midi: number;
  name: string;
  octave: number;
  frequency: number;
};

function stringAt(string: number, setup: Tuning): GuitarString {
  const midi = setup.openMidi[string];
  const reading = readingFor(frequencyOf(midi));
  return {
    string,
    midi,
    name: reading?.name ?? "",
    octave: reading?.octave ?? 0,
    frequency: frequencyOf(midi),
  };
}

/** Tuner targets, low string first, derived from the same setup as the board. */
export function tuningStrings(setup: Tuning): GuitarString[] {
  return [6, 5, 4, 3, 2, 1].map((string) => stringAt(string, setup));
}

export const STANDARD_TUNING: GuitarString[] = tuningStrings(STANDARD_SETUP);

/**
 * The string a frequency is closest to, by semitone distance.
 *
 * Distance is measured in semitones rather than hertz: a fixed number of hertz
 * is a wide interval down at the low E and a narrow one up at the high e, so
 * a hertz comparison quietly favours the top strings.
 */
export function nearestString(
  frequency: number,
  tuning: readonly GuitarString[] = STANDARD_TUNING,
): GuitarString | null {
  if (!Number.isFinite(frequency) || frequency <= 0 || tuning.length === 0) {
    return null;
  }
  return tuning.reduce((best, candidate) =>
    Math.abs(semitonesFromA4(frequency) - semitonesFromA4(candidate.frequency)) <
    Math.abs(semitonesFromA4(frequency) - semitonesFromA4(best.frequency))
      ? candidate
      : best,
  );
}

/** How far a frequency is from a target, in cents. Negative is flat. */
export function centsBetween(frequency: number, target: number): number {
  return 1200 * Math.log2(frequency / target);
}

/** Within this many cents counts as in tune, which is about what an ear hears. */
export const IN_TUNE_CENTS = 5;
