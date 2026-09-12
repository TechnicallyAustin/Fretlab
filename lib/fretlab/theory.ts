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
export function chordIntervals(chord: { quality: string; symbol: string }) {
  if (chord.quality === "Minor") return [0, 3, 7];
  if (chord.quality === "Seventh")
    return chord.symbol.includes("maj") ? [0, 4, 7, 11] : [0, 4, 7, 10];
  if (chord.quality === "Suspended") return [0, 2, 7];
  if (chord.quality === "Diminished") return [0, 3, 6];
  return [0, 4, 7];
}

export function chordVoicing(
  chord: { root: KeyName; quality: string; symbol: string },
  voicing: "Barre" | "Triad",
) {
  const intervals = chordIntervals(chord);
  if (voicing === "Barre") {
    const rootFret = Math.max(
      1,
      keyPc(chord.root) -
        OPEN_PC[6] +
        (keyPc(chord.root) < OPEN_PC[6] ? 12 : 0),
    );
    const offsets =
      chord.quality === "Minor"
        ? [0, 2, 2, 0, 0, 0]
        : chord.quality === "Seventh"
          ? chord.symbol.includes("maj")
            ? [0, 2, 1, 1, 0, 0]
            : [0, 2, 0, 1, 0, 0]
          : chord.quality === "Suspended"
            ? [0, 2, 2, 2, 0, 0]
            : [0, 2, 2, 1, 0, 0];
    return [6, 5, 4, 3, 2, 1].map((string, index) => ({
      s: string,
      f: rootFret + offsets[index],
    }));
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
