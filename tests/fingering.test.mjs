/**
 * Drill shapes must be playable.
 *
 * `intervalShape` returns every matching note on every string in a window,
 * which is a pitch map, not a fingering. These assertions keep the beginner
 * view honest: a box shape fits one hand position, and a drill that names its
 * strings uses only those strings.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { DRILLS } = await import("../lib/fretlab/library.ts");
const { drillShape, drillKind, fingerBarreShape, BOX_SPAN } = await import(
  "../lib/fretlab/fingering.ts"
);
const { CHORDS } = await import("../lib/fretlab/library.ts");

const KEYS = ["G", "C", "A", "Eb"];

/**
 * This asserted `span <= BOX_SPAN` against a global four-fret constant, which
 * is the constraint FL-12 removes: three notes on each of six strings needs
 * six frets, so a global clamp made "Three-note-per-string run" impossible to
 * draw as written. The assertion was encoding that bug.
 *
 * The rule it is replaced by is stricter, not looser: a drill gets exactly the
 * span it declares, and a drill that declares nothing still gets a hand.
 */
test("every box drill fits the span it declares", () => {
  for (const drill of DRILLS) {
    if (drillKind(drill) !== "box") continue;
    const allowed = drill.span ?? BOX_SPAN;
    for (const key of KEYS) {
      const shape = drillShape(drill, key);
      const span = shape.high - shape.low;
      assert.ok(
        span <= allowed,
        `${drill.id} in ${key} spans ${span + 1} frets; it declares ${allowed + 1}`,
      );
    }
  }
});

test("only a drill that asks for a wider shape gets one", () => {
  const wide = DRILLS.filter((drill) => (drill.span ?? BOX_SPAN) > BOX_SPAN);
  assert.deepEqual(
    wide.map((drill) => drill.id),
    ["three-note"],
    "a drill widened its span without saying why",
  );
});

/**
 * One finger per fret only holds inside a hand span. A shape wider than that
 * is played with a shift, and numbering its notes 1-4 would ask for a grip no
 * hand makes — so a wide shape must carry no fingers at all. Both directions
 * are checked here; the original only checked the first, which is why a
 * six-fret drill could not exist.
 */
test("a box drill is fingered exactly when a hand could hold it", () => {
  for (const drill of DRILLS) {
    if (drillKind(drill) !== "box") continue;
    const handSpan = (drill.span ?? BOX_SPAN) <= BOX_SPAN;
    for (const note of drillShape(drill, "G").notes) {
      if (!handSpan) {
        assert.equal(
          note.finger,
          undefined,
          `${drill.id} implies a finger for a shape wider than a hand`,
        );
        continue;
      }
      assert.notEqual(note.finger, undefined, `${drill.id} left a note unfingered`);
      assert.ok(note.finger >= 0 && note.finger <= 4, `${drill.id} finger ${note.finger}`);
      if (note.f === 0) assert.equal(note.finger, 0, "open strings take no finger");
    }
  }
});

test("a drill that names its strings uses only those strings", () => {
  const constrained = DRILLS.filter((drill) => drill.strings);
  assert.ok(constrained.length > 0, "expected drills with a string constraint");

  for (const drill of constrained) {
    for (const key of KEYS) {
      const used = new Set(drillShape(drill, key).notes.map((note) => note.s));
      for (const string of used) {
        assert.ok(
          drill.strings.includes(string),
          `${drill.id} uses string ${string}, outside ${JSON.stringify(drill.strings)}`,
        );
      }
    }
  }
});

test("'sixths on the top strings' stays on the top strings", () => {
  const drill = DRILLS.find((item) => item.id === "sixths");
  const used = new Set(drillShape(drill, "G").notes.map((note) => note.s));
  for (const string of used) assert.ok(string <= 3, `string ${string} is not a top string`);
});

test("map drills tour the neck and imply no fingering", () => {
  const rootLocator = DRILLS.find((item) => item.id === "root-locator");
  assert.equal(drillKind(rootLocator), "map");
  const shape = drillShape(rootLocator, "G");
  assert.ok(shape.high - shape.low > BOX_SPAN, "a map drill should span the neck");
  for (const note of shape.notes) {
    assert.equal(note.finger, undefined, "a map drill must not imply a finger");
  }
});

test("a generated barre shape is fingered from the barre up", () => {
  // Only generated movable shapes come through fingerBarreShape. Authored open
  // chords are validated in theory.test.mjs, where the hand-shape rules live.
  const eShapeBarre = [
    { s: 6, f: 5 }, { s: 5, f: 7 }, { s: 4, f: 7 },
    { s: 3, f: 6 }, { s: 2, f: 5 }, { s: 1, f: 5 },
  ];
  const fingered = fingerBarreShape(eShapeBarre);
  assert.equal(fingered.length, eShapeBarre.length);
  for (const note of fingered) {
    assert.ok(note.finger >= 1 && note.finger <= 4, `finger ${note.finger}`);
  }
  // The barre fret takes finger 1; each higher fret takes the next finger.
  assert.deepEqual(
    fingered.map((n) => n.finger),
    [1, 3, 3, 2, 1, 1],
  );
});

test("an all-open shape asks for no fingers", () => {
  const fingered = fingerBarreShape([{ s: 6, f: 0 }, { s: 1, f: 0 }]);
  for (const note of fingered) assert.equal(note.finger, 0);
});

test("drill cards and boards read the same shape", () => {
  // The card and the detail page must not disagree about what the drill is.
  for (const drill of DRILLS) {
    const a = drillShape(drill, "G");
    const b = drillShape(drill, "G");
    assert.deepEqual(a.notes, b.notes, `${drill.id} is not deterministic`);
  }
});

test("play order runs low string to high, ascending each string", async () => {
  const { withPlayOrder } = await import("../lib/fretlab/fingering.ts");
  const ordered = withPlayOrder([
    { s: 1, f: 5 },
    { s: 6, f: 3 },
    { s: 6, f: 2 },
    { s: 3, f: 4 },
  ]);

  assert.deepEqual(
    ordered.map((note) => `${note.s}:${note.f}`),
    ["6:2", "6:3", "3:4", "1:5"],
    "order should ascend the neck from the low E string",
  );
  assert.deepEqual(ordered.map((note) => note.order), [1, 2, 3, 4]);
});

test("every drill produces a numbered path a beginner can follow", async () => {
  const { withPlayOrder } = await import("../lib/fretlab/fingering.ts");
  for (const drill of DRILLS) {
    const ordered = withPlayOrder(drillShape(drill, "G").notes);
    assert.ok(ordered.length > 0, `${drill.id} produced no notes`);
    // Numbering must be contiguous from 1, or the path cannot be followed.
    assert.deepEqual(
      ordered.map((note) => note.order),
      ordered.map((_, index) => index + 1),
      `${drill.id} has a gap in its play order`,
    );
  }
});
