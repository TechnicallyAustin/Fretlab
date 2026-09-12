/**
 * The FretLab content library: drills, routines, chords, scales, and songs.
 *
 * App Template Contract v1 §5: this is domain logic, not presentation. It sits
 * under lib/ so L2 sections and L3 elements can use it without importing from
 * a page, and so the boundary lint has somewhere legal to point.
 */
import type { KeyName, Tuning } from "./types";
import type { Pattern } from "./patterns";
import { intervalShape, STANDARD_TUNING } from "./theory";

export const DRILLS = [
  {
    id: "position-one",
    name: "Position one, up and back",
    category: "Scale fluency",
    level: "Beginner",
    minutes: 4,
    bpm: 84,
    difficulty: 1,
    scale: "major",
    position: "position-1",
    low: 1,
    high: 5,
    intervals: [0, 2, 4, 5, 7, 9, 11],
    reason: "Build one reliable map before connecting the whole neck.",
    goal: "Two clean round trips",
    cue: "Keep the turnaround in time.",
  },
  {
    id: "root-locator",
    kind: "map",
    name: "Locate every root",
    category: "Neck knowledge",
    level: "Beginner",
    minutes: 3,
    bpm: 0,
    difficulty: 1,
    low: 0,
    high: 12,
    intervals: [0],
    reason: "Root notes orient every scale, chord and phrase.",
    goal: "Find all roots in 20 seconds",
    cue: "Say the string name before each note.",
  },
  {
    id: "thirds",
    kind: "box",
    name: "Thirds through the shape",
    category: "Intervals",
    level: "Intermediate",
    minutes: 5,
    bpm: 76,
    difficulty: 2,
    low: 1,
    high: 7,
    // Was [0, 4, 7, 11] — a major-seventh arpeggio, not thirds. Thirds run
    // 1-3, 2-4, 3-5 through the scale, so the scale is the note set and the
    // pattern is the pairing.
    intervals: [0, 2, 4, 5, 7, 9, 11],
    pattern: { kind: "cells", step: 2, size: 2, unit: "third" },
    reason: "Thirds reveal chord quality inside a scale shape.",
    goal: "Three passes without a pause",
    cue: "Hear each pair before you move.",
  },
  {
    id: "major-triad",
    kind: "box",
    name: "Major triad targets",
    category: "Chord tones",
    level: "Beginner",
    minutes: 4,
    bpm: 72,
    difficulty: 1,
    low: 0,
    high: 7,
    intervals: [0, 4, 7],
    reason: "The root, third and fifth connect scales directly to chords.",
    goal: "Resolve every phrase to 1",
    cue: "Square roots are your landing points.",
  },
  {
    id: "pentatonic-one",
    name: "Pentatonic box one",
    category: "Scale fluency",
    level: "Beginner",
    minutes: 6,
    bpm: 92,
    difficulty: 2,
    // It is box one, so it points at box one. The window used to be
    // whichever four frets held the most notes, which is not box one.
    scale: "major-pentatonic",
    position: "box-1",
    low: 3,
    high: 8,
    intervals: [0, 2, 4, 7, 9],
    reason: "Five-note shapes make phrasing easier while time stays steady.",
    goal: "Four even eighth-note passes",
    cue: "Use alternate picking throughout.",
  },
  {
    id: "minor-pentatonic",
    name: "Minor pentatonic phrasing",
    category: "Improvisation",
    level: "Beginner",
    minutes: 6,
    bpm: 78,
    difficulty: 2,
    scale: "minor-pentatonic",
    position: "box-1",
    low: 3,
    high: 8,
    intervals: [0, 3, 5, 7, 10],
    reason: "A smaller note set lets rhythm and articulation lead.",
    goal: "Create four two-bar phrases",
    cue: "Leave one beat of space.",
  },
  {
    id: "string-six",
    kind: "map",
    strings: [6],
    name: "String six note sprint",
    category: "Neck knowledge",
    level: "Beginner",
    minutes: 3,
    bpm: 0,
    difficulty: 1,
    low: 0,
    high: 12,
    intervals: [0, 2, 4, 5, 7, 9, 11],
    reason: "Low-string roots unlock movable chords and scale positions.",
    goal: "Name all natural notes twice",
    cue: "Look away after the first pass.",
  },
  {
    id: "string-five",
    kind: "map",
    strings: [5],
    name: "String five root map",
    category: "Neck knowledge",
    level: "Beginner",
    minutes: 3,
    bpm: 0,
    difficulty: 1,
    low: 0,
    high: 12,
    intervals: [0, 5, 7],
    reason: "Most common movable chord roots begin on strings five and six.",
    goal: "Find 1, 4 and 5 instantly",
    cue: "Connect each root to a chord shape.",
  },
  {
    id: "sixths",
    kind: "box",
    strings: [1, 2, 3],
    name: "Sixths on the top strings",
    category: "Intervals",
    level: "Intermediate",
    minutes: 5,
    bpm: 68,
    difficulty: 2,
    low: 3,
    high: 10,
    // Was [0, 4, 9] — a major-sixth chord. A sixth is a dyad five scale
    // degrees apart, played as a double-stop across non-adjacent strings.
    intervals: [0, 2, 4, 5, 7, 9, 11],
    pattern: { kind: "cells", step: 5, size: 2, unit: "sixth" },
    reason: "Sixths turn scale knowledge into melodic double-stops.",
    goal: "One clean ascent and descent",
    cue: "Let both notes ring together.",
  },
  {
    id: "sevenths",
    kind: "box",
    name: "Leading-tone resolution",
    category: "Intervals",
    level: "Intermediate",
    minutes: 4,
    bpm: 64,
    difficulty: 2,
    low: 0,
    high: 9,
    intervals: [0, 11],
    reason: "The seventh-to-root pull makes harmony feel directional.",
    goal: "Hear ten clean resolutions",
    cue: "Let 7 lean into 1.",
  },
  {
    id: "one-four-five",
    kind: "box",
    name: "I–IV–V chord-tone map",
    category: "Chord tones",
    level: "Intermediate",
    minutes: 6,
    bpm: 80,
    difficulty: 2,
    low: 0,
    high: 9,
    // Was [0, 4, 5, 7, 11], missing the third of IV and the fifth of V.
    // The three triads together use all seven degrees; what makes it a
    // I-IV-V map is the grouping, not the note set.
    intervals: [0, 2, 4, 5, 7, 9, 11],
    pattern: { kind: "chords", degrees: [0, 3, 4], size: 3, unit: "chord" },
    reason: "These three chords power thousands of progressions.",
    goal: "Track the nearest chord tone",
    cue: "Move the least distance possible.",
  },
  {
    id: "relative-minor",
    kind: "box",
    name: "Relative minor bridge",
    category: "Harmony",
    level: "Intermediate",
    minutes: 5,
    bpm: 72,
    difficulty: 2,
    low: 0,
    high: 9,
    // Was the major pentatonic, note for note identical to "Pentatonic box
    // one". The bridge is between two chords that share notes and differ in
    // where they come to rest: the tonic and its relative minor.
    intervals: [0, 2, 4, 5, 7, 9, 11],
    pattern: { kind: "chords", degrees: [0, 5], size: 3, unit: "chord" },
    reason: "Major and relative minor share notes but change the tonal center.",
    goal: "Resolve four phrases both ways",
    cue: "Change the landing note, not the shape.",
  },
  {
    id: "arpeggio",
    kind: "map",
    name: "Triad arpeggio sequence",
    category: "Chord tones",
    level: "Intermediate",
    minutes: 6,
    bpm: 76,
    difficulty: 2,
    low: 0,
    high: 12,
    // One triad, drawn across the whole neck, with nothing to say which of
    // the seven it is a sequence of.
    intervals: [0, 2, 4, 5, 7, 9, 11],
    pattern: {
      kind: "chords",
      degrees: [0, 1, 2, 3, 4, 5, 6],
      size: 3,
      unit: "arpeggio",
    },
    reason: "Arpeggios make harmony audible one note at a time.",
    goal: "Connect two positions",
    cue: "Accent the root of each octave.",
  },
  {
    id: "two-position",
    kind: "map",
    name: "Two-position connection",
    category: "Scale fluency",
    level: "Intermediate",
    minutes: 7,
    bpm: 88,
    difficulty: 2,
    low: 2,
    high: 10,
    intervals: [0, 2, 4, 5, 7, 9, 11],
    reason: "Horizontal shifts replace isolated boxes with one neck-wide map.",
    goal: "Shift without breaking eighth notes",
    cue: "Change position on string three.",
  },
  {
    id: "three-note",
    kind: "box",
    name: "Three-note-per-string run",
    category: "Technique",
    level: "Advanced",
    minutes: 7,
    bpm: 96,
    difficulty: 3,
    // Three notes on each of six strings needs six frets. A global
    // four-fret BOX_SPAN made this drill impossible to draw as written.
    span: 5,
    low: 2,
    high: 10,
    intervals: [0, 2, 4, 5, 7, 9, 11],
    reason: "Consistent string groupings improve synchronization and speed.",
    goal: "Four clean sixteenth-note bars",
    cue: "Lead each new string with the opposite pick.",
  },
  {
    id: "diatonic-sevenths",
    kind: "map",
    name: "Diatonic seventh arpeggios",
    category: "Harmony",
    level: "Advanced",
    minutes: 8,
    bpm: 68,
    difficulty: 3,
    low: 0,
    high: 12,
    // The note set was right and told you nothing: it is the whole major
    // scale, in which no arpeggio is distinguishable from any other.
    intervals: [0, 2, 4, 5, 7, 9, 11],
    pattern: {
      kind: "chords",
      degrees: [0, 1, 2, 3, 4, 5, 6],
      size: 4,
      unit: "arpeggio",
    },
    reason: "Seventh chords expose every scale degree’s harmonic role.",
    goal: "Name all seven chord qualities",
    cue: "Keep common tones ringing.",
  },
  {
    id: "mode-shift",
    kind: "box",
    name: "Major to Mixolydian",
    category: "Harmony",
    level: "Advanced",
    minutes: 6,
    bpm: 80,
    difficulty: 3,
    low: 3,
    high: 10,
    // Mixolydian alone, so the natural seventh it tells you to compare
    // against was never drawn. The comparison is the drill.
    intervals: [0, 2, 4, 5, 7, 9, 10],
    pattern: { kind: "compare", against: [0, 2, 4, 5, 7, 9, 11], label: "Major" },
    reason: "Changing one degree shows how modes reshape a familiar key.",
    goal: "Hear and target the b7",
    cue: "Compare 7 and b7 directly.",
  },
  {
    id: "rhythmic-cells",
    name: "Rhythmic displacement",
    category: "Technique",
    level: "Advanced",
    minutes: 6,
    bpm: 84,
    difficulty: 3,
    low: 3,
    high: 8,
    intervals: [0, 2, 4, 7, 9],
    reason:
      "Moving a five-note idea across four beats builds rhythmic control.",
    goal: "Stay aligned for eight bars",
    cue: "Count aloud through the shift.",
  },
  {
    id: "open-strings",
    kind: "map",
    name: "Open string check",
    category: "Technique",
    level: "Beginner",
    minutes: 4,
    bpm: 0,
    difficulty: 1,
    // Fret zero only. Every pitch class is listed because an open string is
    // whatever the tuning makes it, not a degree of the key you are in — the
    // window, not the interval set, is what selects the six notes here.
    low: 0,
    high: 0,
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    reason: "A buzzing open string is a setup problem, not a practice problem.",
    goal: "Six strings ringing clean",
    cue: "Pick once and let it decay; listen for the buzz.",
  },
  {
    id: "open-chord-changes",
    kind: "box",
    name: "Open chord changes",
    category: "Chord tones",
    level: "Beginner",
    minutes: 3,
    bpm: 60,
    difficulty: 1,
    low: 0,
    high: 3,
    // The roots of I, IV and V in open position: the three places your hand
    // lands when changing between the first chords anyone learns.
    intervals: [0, 5, 7],
    reason: "Changing chords in time is the skill that makes songs playable.",
    goal: "One bar each, no gap at the change",
    cue: "Move on beat four, not on beat one.",
  },
  {
    id: "drone-play",
    kind: "map",
    name: "Free play over a drone",
    category: "Improvisation",
    level: "Beginner",
    minutes: 3,
    bpm: 0,
    difficulty: 1,
    low: 0,
    high: 12,
    intervals: [0, 2, 4, 5, 7, 9, 11],
    reason: "A drone makes the key audible, so your ear leads instead of the shape.",
    goal: "Phrases that end where they want to",
    cue: "Leave silence between phrases; land on the root.",
  },
] as const;
export type Drill = (typeof DRILLS)[number];

/**
 * The drill's pattern, if it has one.
 *
 * `DRILLS` is `as const`, so it is a union of literal types and only some
 * members carry a `pattern` key at all. Reading it needs the check; doing that
 * once here keeps every caller from repeating it.
 */
export function drillPattern(drill: Drill): Pattern | undefined {
  return "pattern" in drill ? (drill.pattern as Pattern) : undefined;
}
export function drillNotes(
  drill: Drill,
  key: KeyName,
  full = false,
  tuning: Tuning = STANDARD_TUNING,
) {
  return intervalShape(
    key,
    [...drill.intervals],
    full ? 0 : drill.low,
    full ? 12 : drill.high,
    tuning,
  );
}
export const TRAINING_MODULES = [
  {
    id: "locator",
    name: "Note locator",
    level: "Beginner",
    minutes: 3,
    intervals: [0],
    target: "root note",
    instruction: "Find every root across frets one to seven.",
  },
  {
    id: "degrees",
    name: "Scale degrees",
    level: "Beginner",
    minutes: 4,
    intervals: [0, 4, 7],
    target: "1 · 3 · 5",
    instruction: "Find the stable major-triad degrees inside the key.",
  },
  {
    id: "chord-tones",
    name: "Chord tones",
    level: "Intermediate",
    minutes: 5,
    intervals: [0, 3, 7, 10],
    target: "1 · b3 · 5 · b7",
    instruction: "Map a minor-seven sound without relying on a shape.",
  },
  {
    id: "intervals",
    name: "Interval recall",
    level: "Advanced",
    minutes: 5,
    intervals: [0, 2, 5, 9],
    target: "1 · 2 · 4 · 6",
    instruction: "Locate the color tones, then name each distance aloud.",
  },
] as const;
export type DrillId = Drill["id"];

/**
 * One step of a routine.
 *
 * Steps used to be free text — "Sixths on the top two", a near-miss for the
 * drill actually called "Sixths on the top strings" — and nine of the twelve
 * named nothing in `DRILLS` at all. A step with no id cannot open its drill,
 * draw its shape or be scored, which is why the runner did nothing. Typing
 * `drillId` against the drill ids makes a mistyped step a build error, and
 * `tests/theory.test.mjs` guards it at runtime too.
 */
export type RoutineStep = {
  drillId: DrillId;
  mins: number;
  phase: "warm" | "core" | "cool";
};

export type Routine = {
  id: string;
  name: string;
  cadence: string;
  /**
   * The key this routine is written for, or null to follow whatever key the
   * user has chosen.
   *
   * Steps used to carry a key each, so "Ten minute warm-up" ran through G, D
   * and C while every screen displayed the user's own key regardless — the
   * field was both incoherent and ignored. The decision is now explicit and
   * belongs to the routine: a routine whose point is one key declares it and
   * the UI says so, and everything else inherits.
   */
  key: KeyName | null;
  drills: RoutineStep[];
};

export const ROUTINES: Routine[] = [
  {
    id: "warm-up",
    name: "Ten minute warm-up",
    cadence: "Every morning",
    key: null,
    drills: [
      { drillId: "open-strings", mins: 4, phase: "warm" },
      { drillId: "root-locator", mins: 3, phase: "core" },
      { drillId: "open-chord-changes", mins: 3, phase: "cool" },
    ],
  },
  {
    id: "one-key-deep",
    name: "One key, deep",
    cadence: "Three times a week",
    // The only routine that declares a key: staying in one is the whole point
    // of it, so it overrides rather than inherits.
    key: "G",
    drills: [
      { drillId: "position-one", mins: 4, phase: "warm" },
      { drillId: "thirds", mins: 5, phase: "core" },
      { drillId: "major-triad", mins: 4, phase: "core" },
      { drillId: "root-locator", mins: 3, phase: "cool" },
      { drillId: "drone-play", mins: 2, phase: "cool" },
    ],
  },
  {
    id: "neck-knowledge",
    name: "Neck knowledge",
    cadence: "Weekends",
    key: null,
    drills: [
      { drillId: "pentatonic-one", mins: 4, phase: "warm" },
      { drillId: "sixths", mins: 3, phase: "core" },
      { drillId: "open-chord-changes", mins: 4, phase: "core" },
      { drillId: "drone-play", mins: 3, phase: "cool" },
    ],
  },
];

export function drillById(id: string): Drill | undefined {
  return DRILLS.find((drill) => drill.id === id);
}

/**
 * A routine's steps with their drills attached.
 *
 * Unresolvable ids are dropped rather than thrown: the type and the test both
 * prevent one from existing, and neither is a reason for a bad id to blank a
 * practice screen mid-session.
 */
export function routineSteps(routine: Routine) {
  return routine.drills.flatMap((step) => {
    const drill = drillById(step.drillId);
    return drill ? [{ ...step, drill }] : [];
  });
}

/** The key a routine is practised in: its own if it declares one. */
export function routineKey(routine: Routine, selectedKey: KeyName): KeyName {
  return routine.key ?? selectedKey;
}

export const CHORDS = [
  {
    id: "g-major",
    root: "G" as KeyName,
    symbol: "G",
    name: "G major",
    quality: "Major",
    formula: "1 · 3 · 5",
    notes: "G · B · D",
    fingering: [
      { s: 6, f: 3, finger: 2 },
      { s: 5, f: 2, finger: 1 },
      { s: 4, f: 0, finger: 0 },
      { s: 3, f: 0, finger: 0 },
      { s: 2, f: 0, finger: 0 },
      { s: 1, f: 3, finger: 3 },
    ],
    muted: [],
    tip: "Let the open strings ring; keep the third finger relaxed.",
  },
  {
    id: "c-major",
    root: "C" as KeyName,
    symbol: "C",
    name: "C major",
    quality: "Major",
    formula: "1 · 3 · 5",
    notes: "C · E · G",
    fingering: [
      { s: 5, f: 3, finger: 3 },
      { s: 4, f: 2, finger: 2 },
      { s: 3, f: 0, finger: 0 },
      { s: 2, f: 1, finger: 1 },
      { s: 1, f: 0, finger: 0 },
    ],
    muted: [6],
    tip: "Curve the first finger so the open high E stays clear.",
  },
  {
    id: "d-major",
    root: "D" as KeyName,
    symbol: "D",
    name: "D major",
    quality: "Major",
    formula: "1 · 3 · 5",
    notes: "D · F# · A",
    fingering: [
      { s: 4, f: 0, finger: 0 },
      { s: 3, f: 2, finger: 1 },
      { s: 2, f: 3, finger: 3 },
      { s: 1, f: 2, finger: 2 },
    ],
    muted: [6, 5],
    tip: "Start from the open D string and avoid the low E.",
  },
  {
    id: "a-major",
    root: "A" as KeyName,
    symbol: "A",
    name: "A major",
    quality: "Major",
    formula: "1 · 3 · 5",
    notes: "A · C# · E",
    fingering: [
      { s: 5, f: 0, finger: 0 },
      { s: 4, f: 2, finger: 1 },
      { s: 3, f: 2, finger: 2 },
      { s: 2, f: 2, finger: 3 },
      { s: 1, f: 0, finger: 0 },
    ],
    muted: [6],
    tip: "Keep the three second-fret notes compact and let both A notes ring.",
  },
  {
    id: "e-major",
    root: "E" as KeyName,
    symbol: "E",
    name: "E major",
    quality: "Major",
    formula: "1 · 3 · 5",
    notes: "E · G# · B",
    fingering: [
      { s: 6, f: 0, finger: 0 },
      { s: 5, f: 2, finger: 2 },
      { s: 4, f: 2, finger: 3 },
      { s: 3, f: 1, finger: 1 },
      { s: 2, f: 0, finger: 0 },
      { s: 1, f: 0, finger: 0 },
    ],
    muted: [],
    tip: "Place the G# first; it is the note that makes the chord major.",
  },
  {
    id: "f-major",
    root: "F" as KeyName,
    symbol: "F",
    name: "F major",
    quality: "Major",
    formula: "1 · 3 · 5",
    notes: "F · A · C",
    fingering: [
      { s: 6, f: 1, finger: 1 },
      { s: 5, f: 3, finger: 3 },
      { s: 4, f: 3, finger: 4 },
      { s: 3, f: 2, finger: 2 },
      { s: 2, f: 1, finger: 1 },
      { s: 1, f: 1, finger: 1 },
    ],
    muted: [],
    tip: "Use arm weight instead of squeezing the full first-fret barre.",
  },
  {
    id: "e-minor",
    root: "E" as KeyName,
    symbol: "Em",
    name: "E minor",
    quality: "Minor",
    formula: "1 · b3 · 5",
    notes: "E · G · B",
    fingering: [
      { s: 6, f: 0, finger: 0 },
      { s: 5, f: 2, finger: 2 },
      { s: 4, f: 2, finger: 3 },
      { s: 3, f: 0, finger: 0 },
      { s: 2, f: 0, finger: 0 },
      { s: 1, f: 0, finger: 0 },
    ],
    muted: [],
    tip: "Use two adjacent fingers and listen for all six strings.",
  },
  {
    id: "a-minor",
    root: "A" as KeyName,
    symbol: "Am",
    name: "A minor",
    quality: "Minor",
    formula: "1 · b3 · 5",
    notes: "A · C · E",
    fingering: [
      { s: 5, f: 0, finger: 0 },
      { s: 4, f: 2, finger: 2 },
      { s: 3, f: 2, finger: 3 },
      { s: 2, f: 1, finger: 1 },
      { s: 1, f: 0, finger: 0 },
    ],
    muted: [6],
    tip: "Think of C major with fingers two and three shifted inward.",
  },
  {
    id: "b-minor",
    root: "B" as KeyName,
    symbol: "Bm",
    name: "B minor",
    quality: "Minor",
    formula: "1 · b3 · 5",
    notes: "B · D · F#",
    fingering: [
      { s: 5, f: 2, finger: 1 },
      { s: 4, f: 4, finger: 3 },
      { s: 3, f: 4, finger: 4 },
      { s: 2, f: 3, finger: 2 },
      { s: 1, f: 2, finger: 1 },
    ],
    muted: [6],
    tip: "Build the barre first, then place the compact minor shape.",
  },
  {
    id: "d-seven",
    root: "D" as KeyName,
    symbol: "D7",
    name: "D dominant seven",
    quality: "Seventh",
    formula: "1 · 3 · 5 · b7",
    notes: "D · F# · A · C",
    fingering: [
      { s: 4, f: 0, finger: 0 },
      { s: 3, f: 2, finger: 2 },
      { s: 2, f: 1, finger: 1 },
      { s: 1, f: 2, finger: 3 },
    ],
    muted: [6, 5],
    tip: "The C on string two creates the pull back toward G.",
  },
  {
    id: "c-major-seven",
    root: "C" as KeyName,
    symbol: "Cmaj7",
    name: "C major seven",
    quality: "Seventh",
    formula: "1 · 3 · 5 · 7",
    notes: "C · E · G · B",
    fingering: [
      { s: 5, f: 3, finger: 3 },
      { s: 4, f: 2, finger: 2 },
      { s: 3, f: 0, finger: 0 },
      { s: 2, f: 0, finger: 0 },
      { s: 1, f: 0, finger: 0 },
    ],
    muted: [6],
    tip: "Lift the first finger from C major to reveal the open B.",
  },
  {
    id: "g-seven",
    root: "G" as KeyName,
    symbol: "G7",
    name: "G dominant seven",
    quality: "Seventh",
    formula: "1 · 3 · 5 · b7",
    notes: "G · B · D · F",
    fingering: [
      { s: 6, f: 3, finger: 3 },
      { s: 5, f: 2, finger: 2 },
      { s: 4, f: 0, finger: 0 },
      { s: 3, f: 0, finger: 0 },
      { s: 2, f: 0, finger: 0 },
      { s: 1, f: 1, finger: 1 },
    ],
    muted: [],
    tip: "Keep the first-fret F clear; it creates the pull toward C.",
  },
  {
    id: "a-seven",
    root: "A" as KeyName,
    symbol: "A7",
    name: "A dominant seven",
    quality: "Seventh",
    formula: "1 · 3 · 5 · b7",
    notes: "A · C# · E · G",
    fingering: [
      { s: 5, f: 0, finger: 0 },
      { s: 4, f: 2, finger: 1 },
      { s: 3, f: 0, finger: 0 },
      { s: 2, f: 2, finger: 3 },
      { s: 1, f: 0, finger: 0 },
    ],
    muted: [6],
    tip: "Let the open G ring between the two second-fret notes.",
  },
  {
    id: "e-seven",
    root: "E" as KeyName,
    symbol: "E7",
    name: "E dominant seven",
    quality: "Seventh",
    formula: "1 · 3 · 5 · b7",
    notes: "E · G# · B · D",
    fingering: [
      { s: 6, f: 0, finger: 0 },
      { s: 5, f: 2, finger: 2 },
      { s: 4, f: 0, finger: 0 },
      { s: 3, f: 1, finger: 1 },
      { s: 2, f: 0, finger: 0 },
      { s: 1, f: 0, finger: 0 },
    ],
    muted: [],
    tip: "Compare it with E major: lifting one finger reveals the b7.",
  },
  {
    id: "a-sus-two",
    root: "A" as KeyName,
    symbol: "Asus2",
    name: "A suspended two",
    quality: "Sus2",
    formula: "1 · 2 · 5",
    notes: "A · B · E",
    fingering: [
      { s: 5, f: 0, finger: 0 },
      { s: 4, f: 2, finger: 1 },
      { s: 3, f: 2, finger: 2 },
      { s: 2, f: 0, finger: 0 },
      { s: 1, f: 0, finger: 0 },
    ],
    muted: [6],
    tip: "The open B removes the third, leaving an open, unresolved color.",
  },
  {
    id: "b-diminished",
    root: "B" as KeyName,
    symbol: "Bdim",
    name: "B diminished",
    quality: "Diminished",
    formula: "1 · b3 · b5",
    notes: "B · D · F",
    fingering: [
      { s: 5, f: 2, finger: 1 },
      { s: 4, f: 3, finger: 2 },
      { s: 3, f: 4, finger: 4 },
      { s: 2, f: 3, finger: 3 },
    ],
    muted: [6, 1],
    tip: "Use the compact symmetry to hear how strongly it wants to resolve to C.",
  },
].map((chord, index) => ({
  ...chord,
  level:
    index < 8 || chord.quality.startsWith("Sus")
      ? "Beginner"
      : index < 15
        ? "Intermediate"
        : "Advanced",
}));
export const SCALES = [
  {
    id: "major",
    name: "Major",
    family: "Major",
    level: "Beginner",
    mood: "clear · resolved",
    formula: "W W H W W W H",
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  {
    id: "natural-minor",
    name: "Natural minor",
    family: "Minor",
    level: "Beginner",
    mood: "dark · grounded",
    formula: "W H W W H W W",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  {
    id: "major-pentatonic",
    name: "Major pentatonic",
    family: "Pentatonic",
    level: "Beginner",
    mood: "open · melodic",
    formula: "1 2 3 5 6",
    intervals: [0, 2, 4, 7, 9],
  },
  {
    id: "minor-pentatonic",
    name: "Minor pentatonic",
    family: "Pentatonic",
    level: "Beginner",
    mood: "direct · bluesy",
    formula: "1 b3 4 5 b7",
    intervals: [0, 3, 5, 7, 10],
  },
  {
    id: "blues",
    name: "Blues",
    family: "Minor",
    level: "Intermediate",
    mood: "gritty · expressive",
    formula: "1 b3 4 b5 5 b7",
    intervals: [0, 3, 5, 6, 7, 10],
  },
  {
    id: "dorian",
    name: "Dorian",
    family: "Modes",
    level: "Intermediate",
    mood: "minor · lifted",
    formula: "1 2 b3 4 5 6 b7",
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
  {
    id: "mixolydian",
    name: "Mixolydian",
    family: "Modes",
    level: "Intermediate",
    mood: "major · restless",
    formula: "1 2 3 4 5 6 b7",
    intervals: [0, 2, 4, 5, 7, 9, 10],
  },
  {
    id: "harmonic-minor",
    name: "Harmonic minor",
    family: "Minor",
    level: "Intermediate",
    mood: "dramatic · magnetic",
    formula: "1 2 b3 4 5 b6 7",
    intervals: [0, 2, 3, 5, 7, 8, 11],
  },
  {
    id: "lydian",
    name: "Lydian",
    family: "Modes",
    level: "Advanced",
    mood: "bright · floating",
    formula: "1 2 3 #4 5 6 7",
    intervals: [0, 2, 4, 6, 7, 9, 11],
  },
  {
    id: "phrygian",
    name: "Phrygian",
    family: "Modes",
    level: "Advanced",
    mood: "dark · tense",
    formula: "1 b2 b3 4 5 b6 b7",
    intervals: [0, 1, 3, 5, 7, 8, 10],
  },
  {
    id: "melodic-minor",
    name: "Melodic minor",
    family: "Minor",
    level: "Advanced",
    mood: "modern · fluid",
    formula: "1 2 b3 4 5 6 7",
    intervals: [0, 2, 3, 5, 7, 9, 11],
  },
];
export const SONGS = [
  {
    id: "stand-by-me",
    title: "Stand by Me",
    artist: "Ben E. King",
    key: "A" as KeyName,
    level: "Beginner",
    capo: "2nd fret",
    tempo: 118,
    progression: ["G", "Em", "C", "D"],
    focus: "Four-chord pocket",
    image: "/guitar-stage.jpg",
  },
  {
    id: "dreams",
    title: "Dreams",
    artist: "Fleetwood Mac",
    key: "F" as KeyName,
    level: "Beginner",
    capo: "None",
    tempo: 120,
    progression: ["F", "G"],
    focus: "Time and consistency",
    image: "/guitar-strings.jpg",
  },
  {
    id: "house-rising-sun",
    title: "House of the Rising Sun",
    artist: "Traditional",
    key: "A" as KeyName,
    level: "Intermediate",
    capo: "None",
    tempo: 78,
    progression: ["Am", "C", "D", "F", "E"],
    focus: "Arpeggio control",
    image: "/guitar-neck.jpg",
  },
  {
    id: "three-little-birds",
    title: "Three Little Birds",
    artist: "Bob Marley",
    key: "A" as KeyName,
    level: "Beginner",
    capo: "None",
    tempo: 76,
    progression: ["A", "D", "E"],
    focus: "Off-beat rhythm",
    image: "/guitar-stage.jpg",
  },
  {
    id: "knockin",
    title: "Knockin’ on Heaven’s Door",
    artist: "Bob Dylan",
    key: "G" as KeyName,
    level: "Beginner",
    capo: "None",
    tempo: 70,
    progression: ["G", "D", "Am", "C"],
    focus: "Smooth changes",
    image: "/guitar-strings.jpg",
  },
  {
    id: "sweet-home",
    title: "Sweet Home Alabama",
    artist: "Lynyrd Skynyrd",
    key: "D" as KeyName,
    level: "Intermediate",
    capo: "None",
    tempo: 98,
    progression: ["D", "C", "G"],
    focus: "Riff articulation",
    image: "/guitar-neck.jpg",
  },
];


export type RunStepPlan = { drillId: DrillId; drill: Drill; mins: number };

/**
 * What the runner is about to run.
 *
 * The runner is reached from two places that mean different things: a routine
 * card, and the "Start this drill" button on a drill, chord or scale page.
 * Both used to land on a runner that rendered the same hardcoded drill
 * regardless, so "Start 4-minute drill" started something else entirely.
 * Resolving the id against both lists lets one screen serve both honestly.
 */
export type RunPlan = {
  id: string;
  name: string;
  key: KeyName;
  steps: RunStepPlan[];
};

export function runPlanFor(id: string, selectedKey: KeyName): RunPlan | null {
  const routine = ROUTINES.find((each) => each.id === id);
  if (routine) {
    return {
      id: routine.id,
      name: routine.name,
      key: routineKey(routine, selectedKey),
      steps: routineSteps(routine).map((step) => ({
        drillId: step.drillId,
        drill: step.drill,
        mins: step.mins,
      })),
    };
  }

  // A single drill is a one-step run, in whatever key you are working in.
  const drill = drillById(id);
  if (!drill) return null;
  return {
    id: drill.id,
    name: drill.name,
    key: selectedKey,
    steps: [{ drillId: drill.id, drill, mins: drill.minutes }],
  };
}
