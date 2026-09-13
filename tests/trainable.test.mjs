/**
 * Everything the app teaches, it can also score.
 *
 * Audit §1. `Train` is the only screen that records an accuracy, and it could
 * only run the four `TRAINING_MODULES`. The other 21 drills were timed and
 * recorded `accuracy: null`, so Progress's accuracy figures, its daily chart
 * and FL-23's review queue all described a quarter of the content — and a
 * learner who worked through routines, the app's own primary path, produced no
 * accuracy data at all.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { DRILLS, TRAINING_MODULES, trainables, trainableById } = await import(
  "../lib/fretlab/library.ts"
);
const { intervalShape, FIFTHS } = await import("../lib/fretlab/theory.ts");
const { reviewSchedule, dueToday } = await import("../lib/api/review.ts");

test("every drill and module can be scored", () => {
  const ids = new Set(trainables().map((item) => item.id));
  for (const drill of DRILLS) {
    assert.ok(ids.has(drill.id), `${drill.id} cannot be scored`);
  }
  for (const module of TRAINING_MODULES) {
    assert.ok(ids.has(module.id), `${module.id} cannot be scored`);
  }
  assert.equal(
    ids.size,
    DRILLS.length + TRAINING_MODULES.length,
    "the trainable set should be every drill plus every module",
  );
});

test("a trainable has targets to find in every key", () => {
  // A drill with no notes in its window is an unwinnable screen: nothing to
  // tap, and an accuracy of zero recorded against it.
  for (const item of trainables()) {
    for (const key of FIFTHS) {
      const notes = intervalShape(key, [...item.intervals], item.low, item.high)
        .filter((note) => !item.strings || item.strings.includes(note.s));
      assert.ok(
        notes.length > 0,
        `${item.id} in ${key} has nothing to find between frets ${item.low} and ${item.high}`,
      );
    }
  }
});

test("a trainable says what to look for, in the app's own vocabulary", () => {
  for (const item of trainables()) {
    assert.ok(item.target.length > 0, `${item.id} has no target`);
    assert.ok(item.instruction.length > 0, `${item.id} has no instruction`);
    // Degrees are named the way the rest of the app names them, not as
    // semitone counts — "1 · 3 · 5", never "0 · 4 · 7".
    assert.doesNotMatch(
      item.target,
      /\b(?:8|9|10|11)\b/,
      `${item.id} names a semitone count rather than a degree: ${item.target}`,
    );
  }
});

test("a drill keeps its own fret window when it is scored", () => {
  // A module searches frets 1-7. A drill brings its own range, and scoring it
  // over the wrong frets would ask for notes that are not in the shape.
  const sixths = trainableById("sixths");
  const drill = DRILLS.find((each) => each.id === "sixths");
  assert.equal(sixths.low, drill.low);
  assert.equal(sixths.high, drill.high);
  assert.deepEqual([...sixths.strings], [...drill.strings], "string limit lost");
});

/**
 * The point of the change, checked end to end: a scored drill has to reach the
 * scheduler, because that is what was empty before.
 */
test("scoring a drill puts it into the review queue", () => {
  const now = new Date(2026, 8, 20, 12).getTime();
  const session = (drillId) => ({
    id: `s-${drillId}`,
    drill_id: drillId,
    music_key: "G",
    accuracy: 88,
    reps: 12,
    bpm: null,
    duration_seconds: 200,
    created_at: new Date(now - 3 * 86_400_000).toISOString(),
    tags: [],
  });

  // A drill that could never be scored before.
  const schedule = reviewSchedule([session("pentatonic-one")], now);
  assert.equal(schedule.length, 1);
  assert.equal(schedule[0].drillId, "pentatonic-one");
  assert.equal(dueToday(schedule, now).length, 1, "not offered for review");
});

test("the review queue can now cover the whole library", () => {
  const now = new Date(2026, 8, 20, 12).getTime();
  const sessions = trainables().map((item, index) => ({
    id: `s${index}`,
    drill_id: item.id,
    music_key: "G",
    accuracy: 90,
    reps: 10,
    bpm: null,
    duration_seconds: 120,
    created_at: new Date(now - 5 * 86_400_000).toISOString(),
    tags: [],
  }));
  const schedule = reviewSchedule(sessions, now);
  assert.equal(
    schedule.length,
    trainables().length,
    "some trainable item cannot be scheduled",
  );
  assert.ok(schedule.length > 20, `only ${schedule.length} items are schedulable`);
});
