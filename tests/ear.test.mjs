/**
 * Ear training asks answerable questions.
 *
 * FL-24. A question generator is easy to get subtly wrong in ways nobody
 * notices from the outside: the right answer missing from the options, the
 * same answer every time, distractors so far from the answer that the drill
 * teaches nothing. All of those look like a working screen.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { CHOICES, INTERVALS, QUALITIES, askQuestion, explain } = await import(
  "../lib/fretlab/ear.ts"
);
const { roleForDegree } = await import("../lib/fretlab/noteRoles.ts");

const seeds = Array.from({ length: 60 }, (_, i) => i);

test("the right answer is always among the options", () => {
  for (const mode of ["intervals", "qualities"]) {
    for (const seed of seeds) {
      const question = askQuestion(mode, seed);
      assert.ok(
        question.options.some((option) => option.id === question.answer),
        `${mode} seed ${seed}: the answer is not offered`,
      );
      assert.equal(question.options.length, CHOICES, `${mode} seed ${seed}`);
      const ids = question.options.map((o) => o.id);
      assert.equal(new Set(ids).size, ids.length, "an option is offered twice");
    }
  }
});

test("every option is named and explained", () => {
  for (const mode of ["intervals", "qualities"]) {
    for (const seed of seeds.slice(0, 20)) {
      for (const option of askQuestion(mode, seed).options) {
        assert.ok(option.name.length > 0, "an option has no name");
        assert.ok(option.detail.length > 0, `${option.name} has no detail`);
      }
    }
  }
});

test("the questions are not all the same question", () => {
  for (const mode of ["intervals", "qualities"]) {
    const answers = new Set(seeds.map((seed) => askQuestion(mode, seed).answer));
    assert.ok(
      answers.size > 3,
      `${mode} only ever asks ${answers.size} distinct question(s)`,
    );
  }
});

test("every interval and every quality gets asked", () => {
  const asked = new Set(seeds.map((seed) => askQuestion("intervals", seed).answer));
  for (const interval of INTERVALS) {
    assert.ok(asked.has(String(interval.semitones)), `${interval.name} is never asked`);
  }
  const qualities = new Set(seeds.map((seed) => askQuestion("qualities", seed).answer));
  for (const quality of QUALITIES) {
    assert.ok(qualities.has(quality.id), `${quality.name} is never asked`);
  }
});

/**
 * The distinction worth drilling is a major third against a minor third. A
 * major third against an octave is not ear training, it is a coin toss you
 * always win.
 */
test("the wrong answers are near the right one", () => {
  for (const seed of seeds) {
    const question = askQuestion("intervals", seed);
    const answer = Number(question.answer);
    const distances = question.options
      .map((option) => Math.abs(Number(option.id) - answer))
      .filter((distance) => distance > 0);
    assert.ok(
      Math.min(...distances) <= 2,
      `seed ${seed}: the nearest wrong answer is ${Math.min(...distances)} semitones away`,
    );
  }
});

test("a question is repeatable from its seed", () => {
  // A learner should be able to retry a drill rather than re-roll it, and a
  // Math.random question cannot be asserted at all.
  for (const mode of ["intervals", "qualities"]) {
    for (const seed of [0, 7, 41]) {
      assert.deepEqual(askQuestion(mode, seed), askQuestion(mode, seed));
    }
  }
});

test("what you hear is named the way the board names it", () => {
  // The point of reusing NoteRole: the third you have been reading on the
  // fretboard is the third you are being asked to hear.
  for (const interval of INTERVALS) {
    assert.equal(
      interval.role,
      roleForDegree(interval.semitones % 12),
      `${interval.name} carries a different role from the same degree on the board`,
    );
  }
  const third = INTERVALS.find((i) => i.semitones === 4);
  assert.equal(third.role, "third");
  assert.equal(third.degree, "3");
  const fifth = INTERVALS.find((i) => i.semitones === 7);
  assert.equal(fifth.role, "fifth");
});

test("an interval question plays the root and then the interval", () => {
  for (const seed of seeds.slice(0, 12)) {
    const question = askQuestion("intervals", seed);
    assert.equal(question.intervals[0], 0, "an interval is heard against its root");
    assert.equal(question.intervals.length, 2);
    assert.equal(String(question.intervals[1]), question.answer);
  }
});

test("a chord question plays the chord it is asking about", () => {
  for (const seed of seeds.slice(0, 12)) {
    const question = askQuestion("qualities", seed);
    const quality = QUALITIES.find((each) => each.id === question.answer);
    assert.deepEqual(question.intervals, quality.intervals);
    assert.ok(question.intervals.length >= 3, "a chord needs at least three notes");
  }
});

test("every quality is a distinct sound", () => {
  // Two qualities with the same intervals would be an unanswerable question.
  const shapes = QUALITIES.map((q) => q.intervals.join(","));
  assert.equal(new Set(shapes).size, shapes.length, "two qualities sound identical");
});

test("the answer is explained in the key it was played in", () => {
  const interval = explain(askQuestion("intervals", 3), "G");
  assert.match(interval, /semitones up/);
  assert.match(interval, /\bG\b/, "the explanation should name the key");
  const quality = explain(askQuestion("qualities", 2), "G");
  assert.ok(quality.length > 10, "a quality answer should say what to listen for");
});

// ------------------------------------------------ the screen and the queue

test("an ear round is recorded like any other scored practice", async () => {
  const { readProjectFile } = await import("./helpers/sources.mjs");
  const source = await readProjectFile("app/_screens/Ear.tsx");

  // Right first time, exactly as Train counts a tapped note — otherwise the
  // two kinds of practice would mean different things by "accuracy".
  assert.match(source, /right first time/i);
  assert.match(source, /accuracy: Math\.round\(\(clean \/ ROUND\) \* 100\)/);
  assert.match(source, /drill_id: mode === "intervals"/);

  // And it must reach the scheduler, which is the point of scoring it.
  const { reviewSchedule, dueToday } = await import("../lib/api/review.ts");
  const now = new Date(2026, 8, 20, 12).getTime();
  const session = {
    id: "ear-1",
    drill_id: "ear-intervals",
    music_key: "G",
    accuracy: 75,
    reps: 8,
    bpm: null,
    duration_seconds: 190,
    created_at: new Date(now - 4 * 86_400_000).toISOString(),
    tags: ["G", "ear"],
  };
  const schedule = reviewSchedule([session], now);
  assert.equal(schedule.length, 1, "an ear round does not reach the review queue");
  assert.equal(dueToday(schedule, now).length, 1);
});

test("the question cannot be answered by reading the screen", async () => {
  const { readProjectFile } = await import("./helpers/sources.mjs");
  const source = await readProjectFile("app/_screens/Ear.tsx");
  // The answer is revealed only after a choice is made. If `explain` were
  // rendered unconditionally the drill would be a reading exercise.
  const explainAt = source.indexOf("explain(question");
  const guardAt = source.indexOf("{picked && (");
  assert.ok(guardAt > 0 && explainAt > guardAt, "the answer is shown before the guess");
});
