/**
 * The app decides what to practise, and is right.
 *
 * FL-23. Spaced repetition over what the app actually scores. The schedule is
 * derived by replaying recorded sessions rather than stored in a table, so
 * every interval here is a consequence of practice that really happened —
 * which is the same rule the rest of the app follows about numbers.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { LEECH_LAPSES, daysOverdue, dueToday, gradeFor, reviewSchedule } =
  await import("../lib/api/review.ts");

const NOW = new Date(2026, 8, 20, 12).getTime();
const DAY = 86_400_000;

/** A graded session `back` days ago. */
const scored = (back, accuracy, drill = "locator", key = "G") => ({
  id: `s${back}${drill}${key}${accuracy}`,
  drill_id: drill,
  music_key: key,
  accuracy,
  reps: 20,
  bpm: null,
  duration_seconds: 180,
  created_at: new Date(NOW - back * DAY).toISOString(),
  tags: [],
});

/** A timed session: practised, but never tested. */
const timed = (back, drill = "position-one", key = "G") => ({
  ...scored(back, null, drill, key),
  accuracy: null,
});

test("a percentage becomes a grade, and 70 is the pass mark", () => {
  assert.equal(gradeFor(100), 5);
  assert.equal(gradeFor(95), 5);
  assert.equal(gradeFor(85), 4);
  assert.equal(gradeFor(70), 3);
  assert.equal(gradeFor(69), 2);
  assert.equal(gradeFor(0), 0);
  // Three is the boundary SM-2 cares about: below it the item has failed.
  assert.ok(gradeFor(70) >= 3 && gradeFor(69) < 3);
});

test("a first pass comes back tomorrow, a second in six days", () => {
  const first = reviewSchedule([scored(0, 90)], NOW)[0];
  assert.equal(first.intervalDays, 1);
  assert.equal(first.streak, 1);

  const second = reviewSchedule([scored(1, 90), scored(0, 90)], NOW)[0];
  assert.equal(second.intervalDays, 6);
  assert.equal(second.streak, 2);
});

test("intervals grow with the ease once an item is known", () => {
  const sessions = [scored(30, 95), scored(29, 95), scored(23, 95), scored(0, 95)];
  const item = reviewSchedule(sessions, NOW)[0];
  assert.ok(item.intervalDays > 6, `third review scheduled ${item.intervalDays} days out`);
  assert.ok(item.ease > 2.5, "perfect answers should raise the ease");
});

test("a failure collapses the interval and costs ease", () => {
  const known = reviewSchedule([scored(20, 95), scored(19, 95), scored(13, 95)], NOW)[0];
  const lapsed = reviewSchedule(
    [scored(20, 95), scored(19, 95), scored(13, 95), scored(0, 40)],
    NOW,
  )[0];

  assert.ok(known.intervalDays > 1);
  assert.equal(lapsed.intervalDays, 1, "a failed item must come back tomorrow");
  assert.equal(lapsed.streak, 0);
  assert.equal(lapsed.lapses, 1);
  assert.ok(lapsed.ease < known.ease, "a failure should cost ease");
});

test("an item failed often enough is called a leech, not rescheduled forever", () => {
  const failures = Array.from({ length: LEECH_LAPSES }, (_, i) => scored(LEECH_LAPSES - i, 20));
  const item = reviewSchedule(failures, NOW)[0];
  assert.equal(item.lapses, LEECH_LAPSES);
  assert.equal(item.leech, true);

  const struggling = reviewSchedule(failures.slice(1), NOW)[0];
  assert.equal(struggling.leech, false, "one short of the threshold is not a leech");
});

test("ease never falls below the floor however badly it goes", () => {
  const many = Array.from({ length: 20 }, (_, i) => scored(20 - i, 10));
  const item = reviewSchedule(many, NOW)[0];
  assert.ok(item.ease >= 1.3, `ease fell to ${item.ease}`);
});

/**
 * The rule this whole file is downstream of: `Runner` records a null accuracy
 * on purpose, because it is a timer. Grading that would invent the number the
 * codebase exists not to invent.
 */
test("a timed session is practice, not a review", () => {
  assert.deepEqual(reviewSchedule([timed(0), timed(1), timed(2)], NOW), []);

  // And a mix schedules only the graded half.
  const schedule = reviewSchedule([timed(0), scored(0, 90), timed(1)], NOW);
  assert.equal(schedule.length, 1);
  assert.equal(schedule[0].drillId, "locator");
});

test("the same drill in two keys is two items", () => {
  // Knowing where the notes are in G is not knowing where they are in C.
  const schedule = reviewSchedule([scored(0, 90, "locator", "G"), scored(0, 90, "locator", "C")], NOW);
  assert.equal(schedule.length, 2);
  assert.deepEqual(schedule.map((item) => item.musicKey).sort(), ["C", "G"]);
});

test("only what is due today is offered today", () => {
  // Reviewed yesterday with a six-day interval: not due.
  const notYet = reviewSchedule([scored(8, 90), scored(1, 90)], NOW);
  assert.equal(dueToday(notYet, NOW).length, 0);

  // Reviewed eight days ago on a one-day interval: overdue.
  const overdue = reviewSchedule([scored(8, 90)], NOW);
  assert.equal(dueToday(overdue, NOW).length, 1);
  assert.equal(daysOverdue(overdue[0], NOW), 7);
});

test("an item due today is offered all day, not from the hour it was practised", () => {
  // Practised at noon yesterday on a one-day interval, so due at noon today.
  const schedule = reviewSchedule([scored(1, 90)], NOW);
  const morning = new Date(2026, 8, 20, 7).getTime();
  assert.equal(dueToday(schedule, morning).length, 1, "not offered before noon");
  const evening = new Date(2026, 8, 20, 22).getTime();
  assert.equal(dueToday(schedule, evening).length, 1);
});

test("the schedule is ordered by what needs doing first", () => {
  const schedule = reviewSchedule(
    [scored(9, 90, "locator"), scored(1, 90, "degrees"), scored(30, 90, "intervals")],
    NOW,
  );
  const due = schedule.map((item) => item.dueAt);
  assert.deepEqual(due, [...due].sort((a, b) => a - b), "not soonest-first");
});

test("no clock, no schedule", () => {
  for (const bad of [undefined, null, Number.NaN, "today"]) {
    assert.throws(() => reviewSchedule([], bad), /millisecond clock/);
    assert.throws(() => dueToday([], bad), /millisecond clock/);
  }
});

test("an empty history schedules nothing rather than guessing", () => {
  assert.deepEqual(reviewSchedule([], NOW), []);
  assert.deepEqual(dueToday([], NOW), []);
});
