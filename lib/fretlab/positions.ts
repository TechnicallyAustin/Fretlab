/**
 * The shapes a guitarist actually learns a scale as.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and any
 * layer may import it.
 *
 * Until now a scale was a set of pitch classes, drawn by flooding a fret window
 * with every note that matched. That is a pitch map, not a scale shape, and it
 * made two of the app's own drills impossible to honour: "Pentatonic box one"
 * was whatever four-fret window happened to hold the most notes — not box one,
 * and not guaranteed to contain a root at all.
 *
 * A position here is a real shape: which frets are played on which strings,
 * anchored to the key. Each table is written relative to the root's fret on the
 * sixth string, so one table serves all twelve keys.
 *
 * **These tables are hand-written, so they are machine-checked.**
 * `tests/positions.test.mjs` asserts that every note in every position is in
 * the scale, that every position contains a root, that a position fits the span
 * it declares, and that the five positions together cover the neck with no
 * gaps. The relationship between the two pentatonics is checked too: a major
 * pentatonic box is the same physical shape as the next minor pentatonic box
 * up, because a major pentatonic is its relative minor's pentatonic. If a
 * number below is mistyped, one of those fails.
 */
import type { KeyName, Note, Tuning } from "./types";
import { keyPc, openPc, STANDARD_TUNING } from "./theory";

export type ScalePosition = {
  id: string;
  name: string;
  /** The CAGED chord this shape sits around, where that is the tradition. */
  shape?: string;
  /**
   * Semitones from the root's fret on string six up to this shape's lowest
   * fret. Negative where the shape starts below its own root, which is normal:
   * major pentatonic box one begins a fret under the root.
   */
  offset: number;
  /** Frets the shape covers, counted from its lowest. 3 means a four-fret box. */
  span: number;
  /**
   * Frets per string, relative to the shape's lowest fret. Index 0 is string
   * six (low E) through index 5, string one (high e).
   */
  frets: readonly (readonly number[])[];
};

/**
 * Minor pentatonic, the five boxes every guitarist learns first.
 *
 * Box one is the shape rooted on string six: in A, frets 5 and 8 on the low E.
 */
const MINOR_PENTATONIC: ScalePosition[] = [
  {
    id: "box-1",
    name: "Box 1",
    offset: 0,
    span: 3,
    frets: [[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]],
  },
  {
    id: "box-2",
    name: "Box 2",
    offset: 2,
    span: 3,
    frets: [[1, 3], [0, 3], [0, 3], [0, 2], [1, 3], [1, 3]],
  },
  {
    id: "box-3",
    name: "Box 3",
    offset: 4,
    span: 4,
    frets: [[1, 3], [1, 3], [1, 3], [0, 3], [1, 4], [1, 3]],
  },
  {
    id: "box-4",
    name: "Box 4",
    offset: 7,
    span: 3,
    frets: [[0, 3], [0, 3], [0, 2], [0, 2], [1, 3], [0, 3]],
  },
  {
    id: "box-5",
    name: "Box 5",
    offset: 9,
    span: 3,
    frets: [[1, 3], [1, 3], [0, 3], [0, 3], [1, 3], [1, 3]],
  },
];

/**
 * Major pentatonic: the same five physical shapes, entered one box later.
 *
 * A major pentatonic contains the same notes as the pentatonic of its relative
 * minor, so major box one is minor box two's shape. The test suite checks that
 * rather than taking it on trust.
 */
const MAJOR_PENTATONIC: ScalePosition[] = [
  {
    id: "box-1",
    name: "Box 1",
    offset: -1,
    span: 3,
    frets: [[1, 3], [0, 3], [0, 3], [0, 2], [1, 3], [1, 3]],
  },
  {
    id: "box-2",
    name: "Box 2",
    offset: 1,
    span: 4,
    frets: [[1, 3], [1, 3], [1, 3], [0, 3], [1, 4], [1, 3]],
  },
  {
    id: "box-3",
    name: "Box 3",
    offset: 4,
    span: 3,
    frets: [[0, 3], [0, 3], [0, 2], [0, 2], [1, 3], [0, 3]],
  },
  {
    id: "box-4",
    name: "Box 4",
    offset: 6,
    span: 3,
    frets: [[1, 3], [1, 3], [0, 3], [0, 3], [1, 3], [1, 3]],
  },
  {
    id: "box-5",
    name: "Box 5",
    offset: 9,
    span: 3,
    frets: [[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]],
  },
];

/**
 * The major scale in five CAGED positions.
 *
 * Named for the chord shape each sits around, which is how the system is
 * taught: position one surrounds the E-shape barre chord on the root.
 */
const MAJOR: ScalePosition[] = [
  {
    id: "position-1",
    name: "Position 1",
    shape: "E shape",
    offset: -1,
    span: 3,
    frets: [[0, 1, 3], [0, 1, 3], [0, 2, 3], [0, 2, 3], [1, 3], [0, 1, 3]],
  },
  {
    id: "position-2",
    name: "Position 2",
    shape: "D shape",
    offset: 1,
    span: 4,
    frets: [[1, 3], [1, 3], [0, 1, 3], [0, 1, 3], [1, 3, 4], [1, 3]],
  },
  {
    id: "position-3",
    name: "Position 3",
    shape: "C shape",
    offset: 4,
    span: 3,
    frets: [[0, 1, 3], [0, 2, 3], [0, 2, 3], [0, 2], [0, 1, 3], [0, 1, 3]],
  },
  {
    id: "position-4",
    name: "Position 4",
    shape: "A shape",
    offset: 6,
    span: 3,
    frets: [[1, 3], [0, 1, 3], [0, 1, 3], [0, 2, 3], [1, 3], [1, 3]],
  },
  {
    id: "position-5",
    name: "Position 5",
    shape: "G shape",
    offset: 9,
    span: 3,
    frets: [[0, 2, 3], [0, 2, 3], [0, 2], [0, 2], [0, 1, 3], [0, 2, 3]],
  },
];

const TABLES: Record<string, ScalePosition[]> = {
  major: MAJOR,
  "major-pentatonic": MAJOR_PENTATONIC,
  "minor-pentatonic": MINOR_PENTATONIC,
};

/** The named positions for a scale, or none where they are not written yet. */
export function positionsFor(scaleId: string): ScalePosition[] {
  return TABLES[scaleId] ?? [];
}

export function hasPositions(scaleId: string): boolean {
  return positionsFor(scaleId).length > 0;
}

/** The fret of the key's root on string six, 0-11. */
export function rootFret(key: KeyName, tuning: Tuning = STANDARD_TUNING): number {
  return (keyPc(key) - openPc(tuning, 6) + 12) % 12;
}

/**
 * Where a position sits on the neck in a given key.
 *
 * The anchor is folded into the first octave. A shape repeats every twelve
 * frets, so this is the same shape either way, and both edges need it: major
 * pentatonic box one starts a fret *below* its root, which is under the nut in
 * F, and position five in E-flat would otherwise land on fret 20 and run off
 * the end of a 22-fret neck. Folding also keeps all five inside the twelve
 * frets this app draws.
 */
export function positionWindow(
  position: ScalePosition,
  key: KeyName,
  tuning: Tuning = STANDARD_TUNING,
): { low: number; high: number } {
  const anchor = (((rootFret(key, STANDARD_TUNING) + position.offset) % 12) + 12) % 12;
  const frets = position.frets.flatMap((offsets, index) => {
    const string = 6 - index;
    const tuningOffset = STANDARD_TUNING.openMidi[string] - tuning.openMidi[string];
    return offsets.map((offset) => anchor + offset + tuningOffset);
  });
  return { low: Math.min(...frets), high: Math.max(...frets) };
}

export type PositionNote = Note & {
  /** 1-4, one finger per fret. Absent where the shape is wider than a hand. */
  finger?: number;
};

/** Every note of a position, in a key, with a finger where one is implied. */
export function positionNotes(
  position: ScalePosition,
  key: KeyName,
  tuning: Tuning = STANDARD_TUNING,
): PositionNote[] {
  const low = (((rootFret(key, STANDARD_TUNING) + position.offset) % 12) + 12) % 12;
  const notes: PositionNote[] = [];
  position.frets.forEach((offsets, index) => {
    const s = 6 - index;
    const tuningOffset = STANDARD_TUNING.openMidi[s] - tuning.openMidi[s];
    for (const offset of offsets) {
      const f = low + offset + tuningOffset;
      // One finger per fret only holds inside a hand span. A wider shape is
      // played with a shift, and implying a finger for it would be a lie.
      notes.push(
        position.span <= 3 && tuningOffset === 0
          ? { s, f, finger: offset + 1 }
          : { s, f },
      );
    }
  });
  return notes;
}
