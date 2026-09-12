/**
 * Music theory: pitch classes, scales, fretboard shapes, and chord voicings.
 *
 * App Template Contract v1 §5: this is domain logic, not presentation. It sits
 * under lib/ so L2 sections and L3 elements can use it without importing from
 * a page, and so the boundary lint has somewhere legal to point.
 */
import type { KeyName, Note } from "./types";

export const FIFTHS: KeyName[] = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "Db",
  "Ab",
  "Eb",
  "Bb",
  "F",
];
export const LETTERS = "CDEFGAB";
export const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
export const OPEN_PC: Record<number, number> = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };
export const STRING_NAMES: Record<number, string> = {
  1: "e",
  2: "B",
  3: "G",
  4: "D",
  5: "A",
  6: "E",
};
export const PC_KEY: KeyName[] = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export function keyPc(key: KeyName) {
  const li = LETTERS.indexOf(key[0]);
  const accidental = key
    .slice(1)
    .split("")
    .reduce((sum, mark) => sum + (mark === "#" ? 1 : -1), 0);
  return (LETTER_PC[li] + accidental + 12) % 12;
}
export function majorScale(key: KeyName) {
  const li = LETTERS.indexOf(key[0]);
  const root = keyPc(key);
  return [0, 2, 4, 5, 7, 9, 11].map((interval, degree) => {
    const letterIndex = (li + degree) % 7;
    let delta = (root + interval - LETTER_PC[letterIndex] + 12) % 12;
    if (delta > 6) delta -= 12;
    return (
      LETTERS[letterIndex] +
      (delta > 0 ? "#".repeat(delta) : "b".repeat(-delta))
    );
  });
}
export function targetNotes(key: KeyName, low = 1, high = 7) {
  const root = keyPc(key);
  const notes: Note[] = [];
  for (let s = 6; s >= 1; s -= 1)
    for (let f = low; f <= high; f += 1)
      if ((OPEN_PC[s] + f) % 12 === root) notes.push({ s, f });
  return notes;
}
export function scaleShape(key: KeyName, low: number, high: number) {
  const pcs = [0, 2, 4, 5, 7, 9, 11].map((n) => (keyPc(key) + n) % 12);
  const notes: Note[] = [];
  for (let s = 6; s >= 1; s -= 1)
    for (let f = low; f <= high; f += 1)
      if (pcs.includes((OPEN_PC[s] + f) % 12)) notes.push({ s, f });
  return notes;
}
export function intervalShape(
  key: KeyName,
  intervals: number[],
  low: number,
  high: number,
) {
  const pcs = intervals.map((n) => (keyPc(key) + n) % 12);
  const notes: Note[] = [];
  for (let s = 6; s >= 1; s -= 1)
    for (let f = low; f <= high; f += 1)
      if (pcs.includes((OPEN_PC[s] + f) % 12)) notes.push({ s, f });
  return notes;
}
/**
 * A chord quality, normalised to the one name the shape tables use.
 *
 * The library spells quality for a reader ("Seventh", with `maj` in the symbol
 * separating the two kinds); the tables below need one key per sound.
 */
export type ChordShapeKey =
  | "Major"
  | "Minor"
  | "Dominant"
  | "Major7"
  | "Sus2"
  | "Sus4"
  | "Diminished";

export function shapeKey(chord: { quality: string; symbol: string }): ChordShapeKey {
  if (chord.quality === "Minor") return "Minor";
  if (chord.quality === "Seventh")
    return chord.symbol.includes("maj") ? "Major7" : "Dominant";
  if (chord.quality === "Sus2") return "Sus2";
  if (chord.quality === "Sus4") return "Sus4";
  if (chord.quality === "Diminished") return "Diminished";
  return "Major";
}

const QUALITY_INTERVALS: Record<ChordShapeKey, number[]> = {
  Major: [0, 4, 7],
  Minor: [0, 3, 7],
  Dominant: [0, 4, 7, 10],
  Major7: [0, 4, 7, 11],
  Sus2: [0, 2, 7],
  Sus4: [0, 5, 7],
  Diminished: [0, 3, 6],
};

export function chordIntervals(chord: { quality: string; symbol: string }) {
  return QUALITY_INTERVALS[shapeKey(chord)];
}

/**
 * The tones a given voicing is actually trying to sound.
 *
 * Three strings cannot hold a seventh chord, and the fifth is the tone that
 * carries the least: it is neither the name of the chord nor its quality. So a
 * three-string voicing of a seventh drops it, which is the shell voicing every
 * comping guitarist plays. Stating that here keeps it a decision rather than
 * whatever a search happens to settle on.
 */
export function voicingIntervals(
  chord: { quality: string; symbol: string },
  voicing: "Open" | "Barre" | "Triad",
) {
  const full = chordIntervals(chord);
  if (voicing !== "Triad" || full.length <= 3) return full;
  return full.filter((interval) => interval !== 7);
}

/**
 * Movable shapes, as fret offsets from the barre. Index 0 is string 6.
 * `null` is a string the shape does not use, which for a movable form means it
 * must be damped rather than left to ring.
 *
 * Two families, because one is not enough: the E form runs out of neck above
 * fret 9, and some qualities have no comfortable E form at all.
 */
const E_SHAPES: Record<ChordShapeKey, (number | null)[]> = {
  Major: [0, 2, 2, 1, 0, 0],
  Minor: [0, 2, 2, 0, 0, 0],
  Dominant: [0, 2, 0, 1, 0, 0],
  Major7: [0, 2, 1, 1, 0, 0],
  Sus2: [0, 2, 4, 4, 0, 0],
  Sus4: [0, 2, 2, 2, 0, 0],
  Diminished: [0, 1, 2, 0, null, null],
};

const A_SHAPES: Record<ChordShapeKey, (number | null)[]> = {
  Major: [null, 0, 2, 2, 2, 0],
  Minor: [null, 0, 2, 2, 1, 0],
  Dominant: [null, 0, 2, 0, 2, 0],
  Major7: [null, 0, 2, 1, 2, 0],
  Sus2: [null, 0, 2, 2, 0, 0],
  Sus4: [null, 0, 2, 2, 3, 0],
  Diminished: [null, 0, 1, 2, 1, null],
};

const STRINGS_HIGH_TO_LOW = [6, 5, 4, 3, 2, 1];

function buildShape(offsets: (number | null)[], barreFret: number): Note[] {
  return STRINGS_HIGH_TO_LOW.flatMap((string, index) => {
    const offset = offsets[index];
    return offset === null ? [] : [{ s: string, f: barreFret + offset }];
  });
}

function span(notes: Note[]) {
  const frets = notes.map((note) => note.f);
  return Math.max(...frets) - Math.min(...frets);
}

export function chordVoicing(
  chord: { root: KeyName; quality: string; symbol: string },
  voicing: "Barre" | "Triad",
) {
  const intervals = voicingIntervals(chord, voicing);
  if (voicing === "Barre") {
    const key = shapeKey(chord);
    // Fret 0 is the open form and is correct; forcing it to 1 sharpened every
    // E-rooted chord by a semitone, so E major sounded F.
    const eRoot = (((keyPc(chord.root) - OPEN_PC[6]) % 12) + 12) % 12;
    const aRoot = (((keyPc(chord.root) - OPEN_PC[5]) % 12) + 12) % 12;
    const candidates = [
      buildShape(E_SHAPES[key], eRoot),
      buildShape(A_SHAPES[key], aRoot),
    ].filter((notes) => notes.every((note) => note.f >= 0 && note.f <= 15));
    // Prefer the tighter grip, then the lower position: both are the easier
    // reach, and the E form running past fret 9 is what pushed chords off the
    // end of the neck.
    candidates.sort(
      (a, b) =>
        span(a) - span(b) ||
        Math.min(...a.map((n) => n.f)) - Math.min(...b.map((n) => n.f)),
    );
    return candidates[0] ?? buildShape(E_SHAPES[key], eRoot);
  }
  const candidates = [3, 2, 1].map((string) =>
    Array.from({ length: 9 }, (_, index) => 4 + index)
      .map((fret) => ({
        s: string,
        f: fret,
        degree: (OPEN_PC[string] + fret - keyPc(chord.root) + 12) % 12,
      }))
      .filter((note) => intervals.includes(note.degree)),
  );
  let best: Note[] | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const first of candidates[0])
    for (const second of candidates[1])
      for (const third of candidates[2]) {
        const notes = [first, second, third];
        const degrees = new Set(notes.map((note) => note.degree));
        if (!intervals.every((interval) => degrees.has(interval))) continue;
        const frets = notes.map((note) => note.f);
        const score =
          Math.max(...frets) -
          Math.min(...frets) +
          frets.reduce((sum, fret) => sum + fret, 0) / 100;
        if (score < bestScore) {
          bestScore = score;
          best = notes.map(({ s, f }) => ({ s, f }));
        }
      }
  return (
    best ??
    intervalShape(chord.root, intervals, 4, 12)
      .filter((note) => note.s <= 3)
      .slice(0, 3)
  );
}

/**
 * How a pitch class is written in a given key.
 *
 * The board used to hold one sharps-only table and index it by pitch class, so
 * the key of F drew A# where its own scale — computed correctly two functions
 * away — says Bb. Five of the twelve keys are flat keys, and in Eb three of the
 * seven notes came out with the wrong letter. A key uses each letter exactly
 * once; that rule is the whole reason accidentals exist, and a learner shown
 * both A# and B in one key has to unlearn it later.
 *
 * Notes inside the key take their spelling from the key. Chromatic notes take
 * the key's own accidental direction, so a flat key stays in flats.
 */
const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

/** Renders an ASCII accidental as the typographic one the board draws. */
function typeset(name: string) {
  return name.replaceAll("#", "♯").replaceAll("b", "♭");
}

export function spellPitchClass(pc: number, key: KeyName): string {
  const normalised = ((pc % 12) + 12) % 12;
  const scale = majorScale(key);
  for (const name of scale) {
    if (pcOfName(name) === normalised) return typeset(name);
  }
  // Outside the key: follow the key's own accidental direction.
  const flatKey = key.includes("b") || key === "F";
  return (flatKey ? FLAT_NAMES : SHARP_NAMES)[normalised];
}

/** The pitch class a written note name sounds. */
export function pcOfName(name: string): number {
  const letter = LETTERS.indexOf(name[0]);
  const accidental = [...name.slice(1)].reduce(
    (sum, mark) => sum + (mark === "#" || mark === "♯" ? 1 : -1),
    0,
  );
  return ((LETTER_PC[letter] + accidental) % 12 + 12) % 12;
}

/**
 * Degree labels for a scale, taken from the scale's own formula.
 *
 * A fixed chromatic table spells every raised degree as a lowered one, so the
 * board labelled Lydian's ♯4 — the note the whole mode is named for — as ♭5,
 * which is a different scale's note. The SCALES entries already carry the right
 * spelling in their `formula`; this reads it back.
 *
 * Degrees outside the scale keep the chromatic fallback, since they have no
 * function in it to name.
 */
const CHROMATIC_DEGREES = [
  "1", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7",
];

export function degreeLabels(scale?: {
  formula: string;
  intervals: readonly number[];
}): string[] {
  const labels = [...CHROMATIC_DEGREES];
  if (!scale || scale.formula.includes("W")) return labels;
  const tokens = scale.formula.split(" ");
  if (tokens.length !== scale.intervals.length) return labels;
  scale.intervals.forEach((semitones, index) => {
    labels[((semitones % 12) + 12) % 12] = typeset(tokens[index]);
  });
  return labels;
}
