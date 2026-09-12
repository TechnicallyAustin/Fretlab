/**
 * Turns a drill into something a beginner can actually put their hand on.
 *
 * `intervalShape` returns every note in a fret window on every string. That is
 * a pitch map, not a fingering: "Thirds through the shape" came back as a
 * seven-fret spread across all six strings, and "Sixths on the top strings"
 * included the bottom three. Neither can be played as written.
 *
 * A drill is one of two things, and they need different treatment:
 *
 *   box  a shape held in one hand position. Constrained to four frets, one
 *        finger per fret, so it can be fingered without shifting.
 *   map  a deliberate tour of the neck ("locate every root"). Spanning the
 *        board is the point, so no finger numbers are implied.
 */
import type { KeyName, Note } from "./types";
import { intervalShape } from "./theory";

export type FingeredNote = Note & {
  /** 1-4 within the box, 0 for an open string. Absent on map drills. */
  finger?: number;
};

export type DrillLike = {
  low: number;
  high: number;
  intervals: readonly number[];
  /** Restrict to these strings (1 = high e). Absent means all six. */
  strings?: readonly number[];
  kind?: "box" | "map";
};

/** Four frets, so each finger owns one. */
export const BOX_SPAN = 3;

export function drillKind(drill: DrillLike): "box" | "map" {
  if (drill.kind) return drill.kind;
  // A window wider than a hand span is a tour, not a shape.
  return drill.high - drill.low > 5 ? "map" : "box";
}

function allowedStrings(drill: DrillLike): Set<number> {
  return new Set(drill.strings ?? [1, 2, 3, 4, 5, 6]);
}

/**
 * Picks the four-fret window inside the drill's range holding the most notes.
 * Ties go to the lower position, which is the easier reach for a beginner.
 */
function bestBox(drill: DrillLike, key: KeyName): { low: number; high: number } {
  const strings = allowedStrings(drill);
  let best = { low: drill.low, high: Math.min(drill.high, drill.low + BOX_SPAN), count: -1 };

  for (let start = drill.low; start + BOX_SPAN <= Math.max(drill.high, drill.low + BOX_SPAN); start += 1) {
    const end = start + BOX_SPAN;
    if (start > drill.high) break;
    const count = intervalShape(key, [...drill.intervals], start, end).filter((note) =>
      strings.has(note.s),
    ).length;
    if (count > best.count) best = { low: start, high: end, count };
  }

  return { low: best.low, high: best.high };
}

export type DrillShape = {
  notes: FingeredNote[];
  low: number;
  high: number;
  kind: "box" | "map";
  /** Frets shown on the board, which may be wider than the notes themselves. */
  windowLow: number;
  windowHigh: number;
};

export function drillShape(drill: DrillLike, key: KeyName, fullNeck = false): DrillShape {
  const kind = drillKind(drill);
  const strings = allowedStrings(drill);

  if (fullNeck || kind === "map") {
    const low = fullNeck ? 0 : drill.low;
    const high = fullNeck ? 12 : drill.high;
    return {
      notes: intervalShape(key, [...drill.intervals], low, high).filter((note) =>
        strings.has(note.s),
      ),
      low,
      high,
      kind,
      windowLow: low,
      windowHigh: high,
    };
  }

  const box = bestBox(drill, key);
  const notes: FingeredNote[] = intervalShape(key, [...drill.intervals], box.low, box.high)
    .filter((note) => strings.has(note.s))
    .map((note) => ({ ...note, finger: note.f === 0 ? 0 : note.f - box.low + 1 }));

  // Open strings sit outside the box but are still played, so show the nut.
  const includesOpen = box.low <= 1;

  return {
    notes,
    low: box.low,
    high: box.high,
    kind,
    windowLow: includesOpen ? 0 : box.low,
    windowHigh: box.high,
  };
}

/**
 * Finger numbers for a stored chord shape.
 *
 * Open strings take no finger. Fretted notes are numbered by fret order from
 * the lowest fretted position, which is how the common open and movable shapes
 * are actually played. Where one fret carries several notes they share a finger,
 * matching the barre a player would use.
 */
export function fingerChordShape(shape: readonly Note[]): FingeredNote[] {
  const fretted = shape.filter((note) => note.f > 0);
  if (!fretted.length) return shape.map((note) => ({ ...note, finger: 0 }));

  const frets = [...new Set(fretted.map((note) => note.f))].sort((a, b) => a - b);
  const fingerByFret = new Map(frets.map((fret, index) => [fret, Math.min(4, index + 1)]));

  return shape.map((note) => ({
    ...note,
    finger: note.f === 0 ? 0 : (fingerByFret.get(note.f) ?? 1),
  }));
}

/**
 * The order the notes are actually played in.
 *
 * A field of dots asks a beginner to work out the path for themselves. Numbering
 * the notes in playing order turns the board into an instruction: play 1, then
 * 2, then 3.
 *
 * Order runs low string to high, ascending the frets on each string, which is
 * how every shape drill in the library is meant to be played: up, then back.
 */
export function withPlayOrder(notes: readonly FingeredNote[]): (FingeredNote & { order: number })[] {
  return [...notes]
    .sort((a, b) => (a.s === b.s ? a.f - b.f : b.s - a.s))
    .map((note, index) => ({ ...note, order: index + 1 }));
}

/** The fingers a shape actually uses, for the caption under the board. */
export function fingersUsed(
  notes: readonly FingeredNote[],
  boxLow: number,
): { finger: number; fret: number }[] {
  const fingers = [...new Set(notes.map((note) => note.finger).filter((f): f is number => !!f))];
  return fingers.sort((a, b) => a - b).map((finger) => ({ finger, fret: boxLow + finger - 1 }));
}
