/**
 * A drill has to play what its name says.
 *
 * FL-14. Drills stored flat pitch-class sets, and a set cannot express a
 * pattern. Six of them taught something else entirely: "Thirds through the
 * shape" held [0,4,7,11], a major-seventh arpeggio; "Sixths on the top
 * strings" held [0,4,9], a major-sixth chord; "Relative minor bridge" held the
 * major pentatonic, note for note identical to "Pentatonic box one".
 *
 * Every expectation below is worked by hand in the key of C, where the major
 * scale is C D E F G A B and no accidental can hide a mistake.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { DRILLS } = await import("../lib/fretlab/library.ts");
const { patternCells, patternSequence, compareLayers, spellCell } = await import(
  "../lib/fretlab/patterns.ts"
);
const { keyPc, spellPitchClass, FIFTHS } = await import("../lib/fretlab/theory.ts");

const drill = (id) => DRILLS.find((each) => each.id === id);

/** The first `count` notes a drill plays, spelled in C. */
function firstNotes(id, count = 8) {
  const each = drill(id);
  return patternSequence(each.pattern, each.intervals)
    .slice(0, count)
    .map((interval) => spellPitchClass((keyPc("C") + interval) % 12, "C"));
}

test("thirds through the shape plays thirds", () => {
  // C-E, D-F, E-G, F-A: pairs two scale degrees apart, ascending.
  assert.deepEqual(firstNotes("thirds"), [
    "C", "E",
    "D", "F",
    "E", "G",
    "F", "A",
  ]);
});

test("sixths on the top strings plays sixths", () => {
  // C-A, D-B, E-C, F-D: pairs five scale degrees apart.
  assert.deepEqual(firstNotes("sixths"), [
    "C", "A",
    "D", "B",
    "E", "C",
    "F", "D",
  ]);
});

test("a sixth is wider than a third", () => {
  const third = patternCells(drill("thirds").pattern, drill("thirds").intervals)[0];
  const sixth = patternCells(drill("sixths").pattern, drill("sixths").intervals)[0];
  assert.equal(third.intervals[1] - third.intervals[0], 4, "C to E is 4 semitones");
  assert.equal(sixth.intervals[1] - sixth.intervals[0], 9, "C to A is 9 semitones");
});

test("the I-IV-V map contains all three complete triads", () => {
  // C E G, F A C, G B D — the third of IV and the fifth of V used to be absent.
  assert.deepEqual(firstNotes("one-four-five", 9), [
    "C", "E", "G",
    "F", "A", "C",
    "G", "B", "D",
  ]);
  const cells = patternCells(drill("one-four-five").pattern, drill("one-four-five").intervals);
  assert.deepEqual(cells.map((cell) => cell.label), ["I", "IV", "V"]);
});

test("the relative minor bridge names both homes", () => {
  // C E G and A C E: the same notes, resolved two different ways.
  assert.deepEqual(firstNotes("relative-minor", 6), ["C", "E", "G", "A", "C", "E"]);
  const cells = patternCells(drill("relative-minor").pattern, drill("relative-minor").intervals);
  assert.deepEqual(cells.map((cell) => cell.label), ["I", "vi"]);
});

test("the relative minor bridge is no longer a copy of box one", () => {
  const bridge = drill("relative-minor");
  const box = drill("pentatonic-one");
  assert.notDeepEqual(
    [...bridge.intervals],
    [...box.intervals],
    "the bridge is the major pentatonic again",
  );
});

test("diatonic sevenths names all seven chord qualities", () => {
  const each = drill("diatonic-sevenths");
  const cells = patternCells(each.pattern, each.intervals);
  assert.deepEqual(
    cells.map((cell) => cell.label),
    ["Imaj7", "ii7", "iii7", "IVmaj7", "V7", "vi7", "viiø7"],
    "the qualities of a major key, in order",
  );
  // Cmaj7 then Dm7: C E G B, D F A C.
  assert.deepEqual(firstNotes("diatonic-sevenths"), [
    "C", "E", "G", "B",
    "D", "F", "A", "C",
  ]);
});

test("the triad sequence is seven distinguishable arpeggios", () => {
  const each = drill("arpeggio");
  const cells = patternCells(each.pattern, each.intervals);
  assert.equal(cells.length, 7);
  assert.deepEqual(cells.map((cell) => cell.label), ["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
  assert.deepEqual(firstNotes("arpeggio", 6), ["C", "E", "G", "D", "F", "A"]);
});

test("every arpeggio in the sequence is a real stack of thirds", () => {
  const each = drill("arpeggio");
  for (const cell of patternCells(each.pattern, each.intervals)) {
    for (let i = 1; i < cell.intervals.length; i += 1) {
      const gap = cell.intervals[i] - cell.intervals[i - 1];
      assert.ok(gap === 3 || gap === 4, `${cell.label}: a ${gap}-semitone "third"`);
    }
  }
});

test("major to Mixolydian draws the note it compares against", () => {
  const each = drill("mode-shift");
  const layers = compareLayers(each.pattern, each.intervals);
  assert.deepEqual(layers.only, [10], "Mixolydian's flat seventh");
  assert.deepEqual(layers.against, [11], "the major seventh it replaces");
  assert.equal(layers.shared.length, 6, "the other six degrees are common");
  assert.equal(
    spellPitchClass((keyPc("C") + layers.against[0]) % 12, "C"),
    "B",
    "in C the note being given up is B",
  );
});

test("a drill with no pattern generates no sequence", () => {
  const each = drill("position-one");
  assert.equal(each.pattern, undefined);
  assert.deepEqual(patternCells(each.pattern, each.intervals), []);
});

test("every pattern names only degrees its scale has", () => {
  for (const each of DRILLS) {
    if (!each.pattern || each.pattern.kind !== "chords") continue;
    for (const degree of each.pattern.degrees) {
      assert.ok(
        degree >= 0 && degree < each.intervals.length,
        `${each.id}: degree ${degree} is outside a ${each.intervals.length}-note scale`,
      );
    }
  }
});

test("a cell sounds the same notes in every key", () => {
  const each = drill("thirds");
  const [first] = patternCells(each.pattern, each.intervals);
  for (const key of FIFTHS) {
    const spelled = spellCell(first, key);
    assert.equal(spelled.split("–").length, 2, `${key}: ${spelled} is not a pair`);
  }
  assert.equal(spellCell(first, "C"), "C–E");
  assert.equal(spellCell(first, "G"), "G–B");
});

// ------------------------------------------------------- the route on the board

const { patternRoute } = await import("../lib/fretlab/patterns.ts");
const { drillShape } = await import("../lib/fretlab/fingering.ts");
const { OPEN_PC } = await import("../lib/fretlab/theory.ts");

const soundedPc = (note) => (OPEN_PC[note.s] + note.f) % 12;

/**
 * `withPlayOrder` numbers notes low string to high, ascending each string.
 * That is the route for a scale run and the wrong route for a drill that
 * jumps — so the board showed a field of dots with a sweep through it.
 */
test("a patterned drill is numbered by its pattern, not by a string sweep", () => {
  const each = drill("thirds");
  const shape = drillShape(each, "C");
  const cells = patternCells(each.pattern, each.intervals);
  const routed = patternRoute(shape.notes, cells, "C");

  const numbered = routed
    .filter((note) => note.order !== undefined)
    .sort((a, b) => a.order - b.order);
  assert.ok(numbered.length > 0, "nothing was numbered");

  // Contiguous 1..n, so the board's path has no holes in it.
  assert.deepEqual(
    numbered.map((note) => note.order),
    numbered.map((_, i) => i + 1),
  );

  // The first two notes are a third apart, which a string sweep would not be.
  const [first, second] = numbered;
  const gap = (soundedPc(second) - soundedPc(first) + 12) % 12;
  assert.ok(gap === 3 || gap === 4, `the route opens with a ${gap}-semitone step`);
});

test("the route only visits notes the shape actually contains", () => {
  for (const each of DRILLS) {
    if (!each.pattern || each.pattern.kind === "compare") continue;
    for (const key of ["C", "G", "Eb"]) {
      const shape = drillShape(each, key);
      const inShape = new Set(shape.notes.map((n) => `${n.s}:${n.f}`));
      for (const note of patternRoute(shape.notes, patternCells(each.pattern, each.intervals), key)) {
        assert.ok(inShape.has(`${note.s}:${note.f}`), `${each.id}: invented a note`);
      }
    }
  }
});

test("an unpatterned drill keeps its notes untouched", () => {
  const each = drill("position-one");
  const shape = drillShape(each, "C");
  const routed = patternRoute(shape.notes, [], "C");
  assert.deepEqual(
    routed.map((n) => `${n.s}:${n.f}`),
    shape.notes.map((n) => `${n.s}:${n.f}`),
  );
  assert.ok(routed.every((note) => note.order === undefined));
});
