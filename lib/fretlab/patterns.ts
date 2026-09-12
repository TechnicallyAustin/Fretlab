/**
 * What a drill actually asks you to play.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and any
 * layer may import it.
 *
 * A drill stored a flat set of pitch classes, and a set cannot express a
 * *pattern*. Intervallic exercises are sequences, not collections, so six
 * drills taught something other than their name: "Thirds through the shape"
 * held `[0,4,7,11]`, which is a major-seventh arpeggio; "Sixths on the top
 * strings" held `[0,4,9]`, a major-sixth chord; "Diatonic seventh arpeggios"
 * held the whole major scale, in which no arpeggio is distinguishable at all.
 *
 * A pattern here is an ordered list of **cells** — the small groups the drill
 * is actually played in. Thirds are pairs two scale steps apart, sixths are
 * pairs five apart, diatonic sevenths are four-note stacks on each degree.
 * Each cell carries intervals in semitones from the key's root, so a pattern
 * is checkable without a fretboard: `tests/patterns.test.mjs` asserts the
 * first eight notes of each drill against hand-worked expectations in C.
 */
import type { KeyName, Note } from "./types";
import { OPEN_PC, keyPc, spellPitchClass } from "./theory";

export type Pattern =
  /**
   * Cells of `size` notes, each note `step` scale degrees above the last,
   * starting from every degree in turn. Thirds are `step: 2, size: 2`; sixths
   * are `step: 5, size: 2`.
   */
  | { kind: "cells"; step: number; size: number; unit: string }
  /**
   * A chord stacked in thirds on each of the named scale degrees. I-IV-V is
   * degrees `[0, 3, 4]` at size 3; diatonic sevenths are all seven at size 4.
   */
  | { kind: "chords"; degrees: readonly number[]; size: number; unit: string }
  /**
   * Two scales side by side, so the degree that differs is visible. The drill's
   * own intervals are the primary layer; `against` is what it is compared to.
   */
  | { kind: "compare"; against: readonly number[]; label: string };

/** One group of notes, played together or in immediate succession. */
export type Cell = {
  /** "1–3", "IV", "vi7" — what this cell is called. */
  label: string;
  /** Semitones above the key's root. */
  intervals: number[];
};

/** Roman numerals for chords built on each degree of a seven-note scale. */
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

/**
 * The interval `count` scale degrees above `from`, wrapping by octaves.
 *
 * Degrees wrap but pitch does not: the seventh degree plus two steps is the
 * second degree *of the next octave*, so it must come back higher than where
 * it started or an ascending pattern would fold back on itself.
 */
function degreeAbove(
  scale: readonly number[],
  from: number,
  count: number,
): number {
  const index = from + count;
  const octaves = Math.floor(index / scale.length);
  return scale[((index % scale.length) + scale.length) % scale.length] + octaves * 12;
}

/**
 * The cells a pattern produces over a scale, in playing order.
 *
 * Returns an empty list for a drill with no pattern, which is most of them: a
 * scale run needs no more description than the shape already gives.
 */
export function patternCells(
  pattern: Pattern | undefined,
  scale: readonly number[],
): Cell[] {
  if (!pattern) return [];

  if (pattern.kind === "cells") {
    return scale.map((_, degree) => {
      const intervals = Array.from({ length: pattern.size }, (_, n) =>
        degreeAbove(scale, degree, n * pattern.step),
      );
      // "1–3" counts scale degrees inclusively, the way musicians name them:
      // one step apart is a third, five apart is a sixth.
      const first = degree + 1;
      const last = ((degree + pattern.step * (pattern.size - 1)) % scale.length) + 1;
      return { label: `${first}–${last}`, intervals };
    });
  }

  if (pattern.kind === "chords") {
    return pattern.degrees.map((degree) => ({
      label: chordName(scale, degree, pattern.size),
      intervals: Array.from({ length: pattern.size }, (_, n) =>
        degreeAbove(scale, degree, n * 2),
      ),
    }));
  }

  // A comparison has no sequence: it is two layers, drawn at once.
  return [];
}

/**
 * The name of the chord on a scale degree — "I", "vi", "ii7" — from the
 * intervals it actually contains rather than from a table of qualities.
 */
function chordName(
  scale: readonly number[],
  degree: number,
  size: number,
): string {
  const root = degreeAbove(scale, degree, 0);
  const third = degreeAbove(scale, degree, 2) - root;
  const fifth = degreeAbove(scale, degree, 4) - root;
  const minor = third === 3;
  const numeral = NUMERALS[degree % NUMERALS.length] ?? `${degree + 1}`;
  const name = minor ? numeral.toLowerCase() : numeral;
  const diminished = minor && fifth === 6;
  if (size < 4) return diminished ? `${name}°` : name;
  const seventh = degreeAbove(scale, degree, 6) - root;
  if (diminished) return `${name}ø7`;
  // A major triad with a major seventh is the only maj7 in a major key.
  return minor || seventh === 10 ? `${name}7` : `${name}maj7`;
}

/** The two layers a comparison drill draws: what it is, and what it is not. */
export function compareLayers(
  pattern: Pattern | undefined,
  intervals: readonly number[],
): { shared: number[]; only: number[]; against: number[] } | null {
  if (!pattern || pattern.kind !== "compare") return null;
  const mine = new Set(intervals.map((i) => ((i % 12) + 12) % 12));
  const theirs = new Set(pattern.against.map((i) => ((i % 12) + 12) % 12));
  return {
    shared: [...mine].filter((i) => theirs.has(i)).sort((a, b) => a - b),
    /** The degree this scale has that the other does not — the whole point. */
    only: [...mine].filter((i) => !theirs.has(i)).sort((a, b) => a - b),
    /** And the one it gives up. */
    against: [...theirs].filter((i) => !mine.has(i)).sort((a, b) => a - b),
  };
}

/** A cell spelled in a key: "C–E", "F–A". */
export function spellCell(cell: Cell, key: KeyName): string {
  return cell.intervals
    .map((interval) => spellPitchClass((keyPc(key) + interval) % 12, key))
    .join("–");
}

/** Every note a pattern plays, in order, as semitones above the root. */
export function patternSequence(
  pattern: Pattern | undefined,
  scale: readonly number[],
): number[] {
  return patternCells(pattern, scale).flatMap((cell) => cell.intervals);
}

/** The pitch class a note sounds. */
const soundedPc = (note: Note) => (OPEN_PC[note.s] + note.f) % 12;

/**
 * The shape's notes numbered in the order the pattern arrives at them.
 *
 * `withPlayOrder` numbers notes low string to high, ascending each string,
 * which is the route for a scale run and the wrong route for everything else:
 * thirds and sixths jump, arpeggios skip degrees. The board drew a field of
 * dots with a sweep through it and called that the instruction.
 *
 * Each note keeps the number of the first time the pattern reaches it, so the
 * numbering stays contiguous and the board's path polyline is the pattern's
 * own shape. Notes the pattern never reaches carry no number at all, which is
 * itself worth seeing.
 */
export function patternRoute<T extends Note>(
  notes: readonly T[],
  cells: readonly Cell[],
  key: KeyName,
): (T & { order?: number })[] {
  if (cells.length === 0) return notes.map((note) => ({ ...note }));

  const byPitchClass = new Map<number, T[]>();
  for (const note of notes) {
    const pc = soundedPc(note);
    const bucket = byPitchClass.get(pc);
    if (bucket) bucket.push(note);
    else byPitchClass.set(pc, [note]);
  }

  const order = new Map<string, number>();
  let previous: Note | null = null;
  let step = 0;

  for (const cell of cells) {
    for (const interval of cell.intervals) {
      const candidates = byPitchClass.get((keyPc(key) + interval) % 12);
      if (!candidates?.length) continue;
      // Nearest to the last note played, so the route is one a hand could
      // take rather than a jump across the neck for every degree.
      const pick = candidates.reduce((best, note) =>
        reach(note, previous) < reach(best, previous) ? note : best,
      );
      previous = pick;
      const id = `${pick.s}:${pick.f}`;
      if (!order.has(id)) {
        step += 1;
        order.set(id, step);
      }
    }
  }

  return notes.map((note) => {
    const at = order.get(`${note.s}:${note.f}`);
    return at === undefined ? { ...note } : { ...note, order: at };
  });
}

/** How far a hand travels between two notes. Strings count double: crossing
 *  three strings is a bigger move than sliding three frets. */
function reach(note: Note, from: Note | null): number {
  if (!from) return note.s * 12 + note.f;
  return Math.abs(note.f - from.f) + Math.abs(note.s - from.s) * 2;
}
