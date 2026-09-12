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
import type { KeyName, Note, Tuning } from "./types";
import { intervalShape, STANDARD_TUNING } from "./theory";
import { positionNotes, positionWindow, positionsFor } from "./positions";
import { fingerFor } from "./hand";

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
  /**
   * The named scale position this drill *is*, where it names one.
   *
   * "Pentatonic box one" could not be honoured while a box was whatever window
   * held the most notes: that window is not box one, and need not contain a
   * root. A drill that names a shape now points at it.
   */
  scale?: string;
  position?: string;
  /**
   * Frets this drill's shape may span, overriding the four-fret default.
   *
   * `BOX_SPAN` used to be a global constant, which made "Three-note-per-string
   * run" structurally impossible: three notes on each of six strings needs six
   * frets, and every box was clamped to four.
   */
  span?: number;
};

/** Four frets, so each finger owns one. The default, not the only option. */
export const BOX_SPAN = 3;

/** The span a drill's shape is allowed, which a wide drill may widen. */
function spanOf(drill: DrillLike): number {
  return drill.span ?? BOX_SPAN;
}

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
function bestBox(drill: DrillLike, key: KeyName, tuning: Tuning): { low: number; high: number } {
  const strings = allowedStrings(drill);
  const span = spanOf(drill);
  let best = { low: drill.low, high: Math.min(drill.high, drill.low + span), count: -1 };

  for (let start = drill.low; start + span <= Math.max(drill.high, drill.low + span); start += 1) {
    const end = start + span;
    if (start > drill.high) break;
    const count = intervalShape(key, [...drill.intervals], start, end, tuning).filter((note) =>
      strings.has(note.s),
    ).length;
    if (count > best.count) best = { low: start, high: end, count };
  }

  return { low: best.low, high: best.high };
}

/**
 * The shape for a drill that names a scale position, or null if it names none.
 *
 * The window is the position's own, so the board is drawn around the shape a
 * guitarist would recognise rather than around whatever `intervalShape`
 * happened to return.
 */
function namedPosition(drill: DrillLike, key: KeyName, tuning: Tuning): DrillShape | null {
  if (!drill.scale || !drill.position) return null;
  const position = positionsFor(drill.scale).find(
    (each) => each.id === drill.position,
  );
  if (!position) return null;

  const strings = allowedStrings(drill);
  const window = positionWindow(position, key, tuning);
  const notes = positionNotes(position, key, tuning).filter((note) =>
    strings.has(note.s),
  );
  // A shape reaching the nut shows it, the same as a generated box does.
  const includesOpen = window.low <= 1;

  return {
    notes,
    low: window.low,
    high: window.high,
    kind: "box",
    windowLow: includesOpen ? 0 : window.low,
    windowHigh: window.high,
  };
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

export function drillShape(
  drill: DrillLike,
  key: KeyName,
  fullNeck = false,
  tuning: Tuning = STANDARD_TUNING,
): DrillShape {
  const kind = drillKind(drill);
  const strings = allowedStrings(drill);

  // A drill that names a position gets that position, not the densest window
  // near it. This is the whole point of the tables: "box one" has to be box
  // one, in the key you are playing in.
  const named = namedPosition(drill, key, tuning);
  if (named && !fullNeck) return named;

  if (fullNeck || kind === "map") {
    const low = fullNeck ? 0 : drill.low;
    const high = fullNeck ? 12 : drill.high;
    return {
      notes: intervalShape(key, [...drill.intervals], low, high, tuning).filter((note) =>
        strings.has(note.s),
      ),
      low,
      high,
      kind,
      windowLow: low,
      windowHigh: high,
    };
  }

  const box = bestBox(drill, key, tuning);
  // One finger per fret only holds inside a hand span. A drill that declared a
  // wider shape is played with a shift, so numbering its notes 1-6 would ask
  // for a grip no hand makes.
  const withinHand = spanOf(drill) <= BOX_SPAN;
  const notes: FingeredNote[] = intervalShape(key, [...drill.intervals], box.low, box.high, tuning)
    .filter((note) => strings.has(note.s))
    .map((note) =>
      withinHand
        ? { ...note, finger: fingerFor(note.f, box.low) }
        : { ...note },
    );

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
 * Finger numbers for a *generated* movable shape.
 *
 * Open chords do not come through here — their fingering is authored in the
 * library, because the grip a hand actually uses cannot be derived from the
 * fret numbers. Open G puts a note on fret 3 of both outer strings with four
 * open strings between them; any rule that numbers by fret order gives them
 * the same finger and asks for a barre that must also leave the middle open.
 *
 * A barre shape is the one case where the derivation holds: the lowest fret is
 * the barre and takes the first finger, and each higher fret takes the next.
 */
export function fingerBarreShape(shape: readonly Note[]): FingeredNote[] {
  const fretted = shape.filter((note) => note.f > 0);
  if (!fretted.length) return shape.map((note) => ({ ...note, finger: 0 }));

  // The barre is the lowest fretted note; every finger is placed relative to
  // it. This used to number by *rank* of distinct fret — first fret found gets
  // finger 1, second gets 2 — which ignores how far apart they are. A C barre
  // sits at fret 3 with its triad at fret 5, two frets up, and rank called
  // that the middle finger. Two frets above the index is the ring finger, and
  // the middle finger cannot comfortably reach it while the index holds a
  // barre.
  const barre = Math.min(...fretted.map((note) => note.f));

  return shape.map((note) => ({ ...note, finger: fingerFor(note.f, barre) }));
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
): { finger: number; fret: number }[] {
  // Read from the notes rather than recomputed from the box.
  //
  // This used to derive the fret as `boxLow + finger - 1`, which is the
  // inverse of the numbering rule written out a second time — so the caption
  // could disagree with the board, and did: a shape reaching the nut has a box
  // low of 0, and the caption read "Index on fret 0", which is the nut and
  // takes no finger at all. The notes already know which fret they are on.
  const byFinger = new Map<number, number>();
  for (const note of notes) {
    if (!note.finger) continue;
    const lowest = byFinger.get(note.finger);
    if (lowest === undefined || note.f < lowest) byFinger.set(note.finger, note.f);
  }
  return [...byFinger]
    .sort(([a], [b]) => a - b)
    .map(([finger, fret]) => ({ finger, fret }));
}
