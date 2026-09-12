/**
 * The scale shapes have to be the shapes.
 *
 * FL-12. A scale used to be a set of pitch classes drawn by flooding a fret
 * window with every matching note, and `bestBox()` picked the window holding
 * the most notes. So "Pentatonic box one" was not box one, and need not have
 * contained a root at all.
 *
 * The replacement is a hand-written table per scale, which is exactly the kind
 * of data that is wrong in one entry and looks right. Every assertion here is
 * a check on the table rather than on the code that reads it: if a single fret
 * number is mistyped, something below fails.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { DROP_D_TUNING, FIFTHS, OPEN_PC, keyPc, openPc } = await import("../lib/fretlab/theory.ts");
const { SCALES } = await import("../lib/fretlab/library.ts");
const { positionsFor, positionNotes, positionWindow, hasPositions } =
  await import("../lib/fretlab/positions.ts");

const SCALED = ["major", "major-pentatonic", "minor-pentatonic"];
const soundedPc = (note) => (OPEN_PC[note.s] + note.f) % 12;

/** The shape with its lowest fret subtracted, so two tables can be compared. */
function normalise(position) {
  const lowest = Math.min(...position.frets.flat());
  return position.frets.map((offsets) => offsets.map((o) => o - lowest));
}

test("the scales with positions are the ones that claim them", () => {
  for (const id of SCALED) {
    assert.ok(hasPositions(id), `${id} has no positions`);
    assert.equal(positionsFor(id).length, 5, `${id} should have five`);
  }
  // A scale with no table says so rather than returning something plausible.
  assert.deepEqual(positionsFor("lydian"), []);
  assert.equal(hasPositions("lydian"), false);
});

test("every note of every position belongs to the scale", () => {
  for (const id of SCALED) {
    const scale = SCALES.find((each) => each.id === id);
    for (const position of positionsFor(id)) {
      for (const key of FIFTHS) {
        const wanted = scale.intervals.map((i) => (keyPc(key) + i) % 12);
        for (const note of positionNotes(position, key)) {
          assert.ok(
            wanted.includes(soundedPc(note)),
            `${id} ${position.id} in ${key}: string ${note.s} fret ${note.f} is not in the scale`,
          );
        }
      }
    }
  }
});

test("every position contains a root", () => {
  for (const id of SCALED) {
    for (const position of positionsFor(id)) {
      for (const key of FIFTHS) {
        const notes = positionNotes(position, key);
        assert.ok(
          notes.some((note) => soundedPc(note) === keyPc(key)),
          `${id} ${position.id} in ${key} has no root in it`,
        );
      }
    }
  }
});

test("Drop D positions keep every displayed note inside the scale", () => {
  for (const id of SCALED) {
    const scale = SCALES.find((each) => each.id === id);
    for (const position of positionsFor(id)) {
      const wanted = scale.intervals.map((interval) => (keyPc("G") + interval) % 12);
      for (const note of positionNotes(position, "G", DROP_D_TUNING)) {
        const sounded = (openPc(DROP_D_TUNING, note.s) + note.f) % 12;
        assert.ok(wanted.includes(sounded), `${id} ${position.id}: Drop D note is outside the scale`);
      }
    }
  }
});

test("a position fits the span it declares", () => {
  for (const id of SCALED) {
    for (const position of positionsFor(id)) {
      const frets = position.frets.flat();
      assert.equal(Math.min(...frets), 0, `${id} ${position.id} is not zeroed`);
      assert.equal(
        Math.max(...frets),
        position.span,
        `${id} ${position.id} declares span ${position.span}`,
      );
      // Four frets is a hand. Anything wider is a shift and says so by
      // carrying no finger numbers.
      const fingered = positionNotes(position, "G").every(
        (note) => note.finger !== undefined,
      );
      assert.equal(
        fingered,
        position.span <= 3,
        `${id} ${position.id}: fingering disagrees with its span`,
      );
    }
  }
});

test("a position sits on the neck, not off the end of it", () => {
  for (const id of SCALED) {
    for (const position of positionsFor(id)) {
      for (const key of FIFTHS) {
        const window = positionWindow(position, key);
        // Folded into the first octave, so every position is reachable on the
        // twelve frets the app draws rather than at fret 20.
        assert.ok(window.low >= 0, `${id} ${position.id} in ${key} starts at ${window.low}`);
        assert.ok(window.low <= 11, `${id} ${position.id} in ${key} starts at ${window.low}`);
        assert.ok(window.high <= 15, `${id} ${position.id} in ${key} ends at ${window.high}`);
        for (const note of positionNotes(position, key)) {
          assert.ok(
            note.f >= window.low && note.f <= window.high,
            `${id} ${position.id}: fret ${note.f} is outside its own window`,
          );
        }
      }
    }
  }
});

test("every string in a position is playable in one hand position", () => {
  for (const id of SCALED) {
    for (const position of positionsFor(id)) {
      position.frets.forEach((offsets, index) => {
        assert.ok(offsets.length > 0, `${id} ${position.id}: string ${6 - index} is empty`);
        const sorted = [...offsets].sort((a, b) => a - b);
        assert.deepEqual(offsets, sorted, `${id} ${position.id}: string frets out of order`);
        assert.equal(
          new Set(offsets).size,
          offsets.length,
          `${id} ${position.id}: a fret is listed twice`,
        );
      });
    }
  }
});

/**
 * A major pentatonic holds the same notes as the pentatonic of its relative
 * minor, three semitones down. So the five shapes are one set, entered at a
 * different point: major box N is the physical shape of minor box N+1.
 *
 * This is the check that two independently written tables agree, which is what
 * would catch a plausible-looking typo in either.
 */
test("the two pentatonics are the same five shapes", () => {
  const major = positionsFor("major-pentatonic");
  const minor = positionsFor("minor-pentatonic");
  for (let i = 0; i < 5; i += 1) {
    assert.deepEqual(
      normalise(major[i]),
      normalise(minor[(i + 1) % 5]),
      `major box ${i + 1} should be the shape of minor box ${((i + 1) % 5) + 1}`,
    );
  }
});

test("a major pentatonic position sounds its relative minor's notes", () => {
  // A major pentatonic = F# minor pentatonic: same six strings, same frets.
  const majorBox = positionsFor("major-pentatonic")[0];
  const minorBox = positionsFor("minor-pentatonic")[1];
  const fromMajor = positionNotes(majorBox, "A").map((n) => `${n.s}:${n.f}`);
  const fromMinor = positionNotes(minorBox, "F#").map((n) => `${n.s}:${n.f}`);
  assert.deepEqual(fromMajor.sort(), fromMinor.sort());
});

/**
 * The five positions are a system, not five separate shapes: played in
 * sequence they should hand off to each other without leaving a scale tone
 * unreachable. A gap here means a learner walking up the neck falls through a
 * hole the app told them was not there.
 */
test("the five positions cover the neck with no gaps", () => {
  for (const id of SCALED) {
    const scale = SCALES.find((each) => each.id === id);
    for (const key of FIFTHS) {
      const wanted = scale.intervals.map((i) => (keyPc(key) + i) % 12);

      const covered = new Set();
      for (const position of positionsFor(id)) {
        for (const note of positionNotes(position, key)) {
          // A shape repeats every octave, so a position covers the neck at
          // twelve-fret intervals either side of where it is anchored.
          for (const shift of [-12, 0, 12]) {
            covered.add(`${note.s}:${note.f + shift}`);
          }
        }
      }

      for (let s = 6; s >= 1; s -= 1) {
        for (let f = 0; f <= 12; f += 1) {
          if (!wanted.includes((OPEN_PC[s] + f) % 12)) continue;
          assert.ok(
            covered.has(`${s}:${f}`),
            `${id} in ${key}: string ${s} fret ${f} is in no position`,
          );
        }
      }
    }
  }
});

// -------------------------------------------------------- drills use the tables

const { DRILLS } = await import("../lib/fretlab/library.ts");
const { drillShape, BOX_SPAN } = await import("../lib/fretlab/fingering.ts");

/**
 * The bug this table set exists to fix: "Pentatonic box one" was drawn by
 * `bestBox()`, which picks the four-fret window holding the *most notes*. That
 * is not box one, and nothing made it contain a root.
 */
test("a drill that names a box gets that box", () => {
  const drill = DRILLS.find((each) => each.id === "pentatonic-one");
  assert.equal(drill.position, "box-1", "the drill should name its shape");

  for (const key of FIFTHS) {
    const shape = drillShape(drill, key);
    const box = positionsFor("major-pentatonic")[0];
    assert.deepEqual(
      shape.notes.map((n) => `${n.s}:${n.f}`).sort(),
      positionNotes(box, key).map((n) => `${n.s}:${n.f}`).sort(),
      `${key}: the drill drew something other than box one`,
    );
    assert.ok(
      shape.notes.some((n) => soundedPc(n) === keyPc(key)),
      `${key}: box one was drawn without a root in it`,
    );
  }
});

test("every drill naming a position resolves to a real one", () => {
  for (const drill of DRILLS) {
    if (!drill.scale && !drill.position) continue;
    assert.ok(drill.scale && drill.position, `${drill.id}: half a reference`);
    assert.ok(
      positionsFor(drill.scale).some((each) => each.id === drill.position),
      `${drill.id}: no position "${drill.position}" in ${drill.scale}`,
    );
  }
});

/**
 * `BOX_SPAN` was a global four frets, so a three-note-per-string drill — three
 * notes on each of six strings, which needs six — could not be drawn as
 * written. The span belongs to the shape now.
 */
test("a three-note-per-string drill is allowed the frets it needs", () => {
  const drill = DRILLS.find((each) => each.id === "three-note");
  assert.ok(drill.span > BOX_SPAN, "the drill still inherits the four-fret box");

  for (const key of FIFTHS) {
    const shape = drillShape(drill, key);
    assert.ok(
      shape.high - shape.low >= 4,
      `${key}: drawn across ${shape.high - shape.low + 1} frets`,
    );
    const perString = new Map();
    for (const note of shape.notes) {
      perString.set(note.s, (perString.get(note.s) ?? 0) + 1);
    }
    // Not every string reaches three inside one window, but the shape must at
    // least be wide enough that some do — under the old clamp, none could.
    assert.ok(
      [...perString.values()].some((count) => count >= 3),
      `${key}: no string carries three notes`,
    );
  }
});
