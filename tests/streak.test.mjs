/**
 * A streak counts days practised.
 *
 * FL-13. `Progress` queried `{ limit: 100, musicKey: selectedKey }` and then
 * derived the streak, the consistency graph, the active-day count and the rep
 * total from that filtered set. So practising every day in a different key
 * showed a streak of 1 — the primary retention mechanic in this category,
 * wrong by construction. The 100-row cap made it degrade further the more you
 * practised, silently blanking the oldest squares of a 26-week graph.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { summarise, consistencyLevels, accuracySeries } = await import(
  "../lib/api/progress.ts"
);
const { readProjectFile } = await import("./helpers/sources.mjs");

const NOW = new Date(2026, 8, 11, 12).getTime();
const DAY = 86_400_000;

/** A session `back` days ago, in `key`. */
const day = (back, key, accuracy = null) => ({
  id: `s${back}${key}`,
  drill_id: "position-one",
  music_key: key,
  accuracy,
  reps: 10,
  bpm: 80,
  duration_seconds: 600,
  created_at: new Date(NOW - back * DAY).toISOString(),
  tags: [],
});

test("a streak counts days, not keys", () => {
  const sessions = [day(0, "G"), day(1, "C"), day(2, "D")];
  assert.equal(summarise(sessions, NOW).streakDays, 3);
});

test("a key-filtered history is what made the streak wrong", () => {
  const sessions = [day(0, "G"), day(1, "C"), day(2, "D")];
  // What the screen used to compute: the same three days, filtered to one key.
  const filtered = sessions.filter((s) => s.music_key === "G");
  assert.equal(summarise(filtered, NOW).streakDays, 1, "the old behaviour");
  assert.equal(summarise(sessions, NOW).streakDays, 3, "the fixed behaviour");
});

test("practice in any key fills the consistency graph", () => {
  const sessions = [day(0, "G"), day(1, "C"), day(2, "D")];
  const levels = consistencyLevels(sessions, 26, NOW);
  const active = levels.filter((level) => level > 0).length;
  assert.equal(active, 3, "a day practised in any key is a day practised");
});

test("active days and reps count every key", () => {
  const sessions = [day(0, "G"), day(1, "C"), day(2, "D")];
  const stats = summarise(sessions, NOW);
  assert.equal(stats.activeDays, 3);
  assert.equal(stats.reps, 30);
  assert.equal(stats.sessionCount, 3);
});

/**
 * The other half: accuracy *is* key-scoped, because a score in G and a score
 * in F# are not comparable. Rescoping the streak must not quietly rescope this
 * one too.
 */
test("accuracy stays scoped to the key it was earned in", () => {
  const sessions = [day(0, "G", 90), day(1, "C", 50), day(2, "G", 80)];
  const inG = sessions.filter((s) => s.music_key === "G");
  assert.equal(summarise(inG, NOW).accuracy, 85, "G's own average");
  assert.equal(summarise(sessions, NOW).accuracy, 73, "mixed, which is meaningless");

  const series = accuracySeries(inG, "7 days", NOW);
  assert.deepEqual(series, [80, 90], "oldest first, G only");
});

test("a day practised twice is still one day of streak", () => {
  const sessions = [day(0, "G"), day(0, "C"), day(1, "D")];
  assert.equal(summarise(sessions, NOW).streakDays, 2);
  assert.equal(summarise(sessions, NOW).activeDays, 2);
});

test("a streak survives today being empty but breaks on a missed day", () => {
  // Practised yesterday and the day before, not yet today.
  assert.equal(summarise([day(1, "G"), day(2, "C")], NOW).streakDays, 2);
  // A gap at day 1 ends it.
  assert.equal(summarise([day(0, "G"), day(2, "C")], NOW).streakDays, 1);
});

/**
 * The screen must ask for the whole history, not a page of it. A 26-week graph
 * built from `limit: 100` blanks its oldest squares for exactly the players
 * who earned them.
 */
test("Progress asks for every session, in every key", async () => {
  const source = await readProjectFile("app/_screens/Progress.tsx");
  assert.match(
    source,
    /usePracticeSessions\(\{\s*all:\s*true\s*\}\)/,
    "Progress should fetch the whole history",
  );
  assert.ok(
    !/usePracticeSessions\([^)]*musicKey/.test(source),
    "Progress must not filter its history by key at the query",
  );
  assert.ok(
    !/usePracticeSessions\([^)]*limit:\s*100/.test(source),
    "Progress must not truncate its history at one page",
  );
});

/**
 * Found while writing the tests above, not in the audit.
 *
 * `accuracySeries` sorts its day keys as strings to put the chart in date
 * order, and the keys were unpadded — `2026-8-9`, `2026-10-1`. Sorted
 * lexicographically that puts October before September and the 11th before
 * the 9th, so the accuracy line was drawn out of order. A chart whose x-axis
 * is scrambled is worse than no chart: the trend it shows is fiction.
 */
test("the accuracy chart runs oldest to newest", () => {
  // The 9th, 10th and 11th: one-digit and two-digit days in one window.
  const sessions = [day(0, "G", 95), day(1, "G", 85), day(2, "G", 75)];
  assert.deepEqual(
    accuracySeries(sessions, "7 days", NOW),
    [75, 85, 95],
    "days with different digit counts sorted wrong",
  );
});

test("the accuracy chart runs in order across a month boundary", () => {
  // NOW is 11 September 2026, so a 30-day window reaches back into August.
  const across = [day(0, "G", 90), day(15, "G", 60), day(25, "G", 50)];
  assert.deepEqual(
    accuracySeries(across, "30 days", NOW),
    [50, 60, 90],
    "August sorted after September",
  );
});
