/**
 * The metronome has to keep time.
 *
 * FL-09. The thing being replaced was four `<i>` elements with a CSS
 * `animation-delay`: silent, drifting against the audio clock, and restarting
 * its phase whenever the tempo changed. None of those are things a test can
 * catch from the outside, so the timing lives in a pure scheduler and these
 * run it against a fake clock.
 *
 * "Scheduled at 0.5s intervals" is checked to a millisecond. That tolerance is
 * the point: a metronome that is right on average and wrong beat to beat is
 * not one you can practise to.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { MetronomeScheduler, clampBpm, tappedTempo, MIN_BPM, MAX_BPM } =
  await import("../lib/fretlab/metronome.ts");

const MS = 0.001;

/**
 * Run a scheduler forward until it has produced `count` clicks, polling the
 * way the real loop does. `onClick` sees each one as it arrives, so a test can
 * change the tempo mid-run at an exact beat.
 */
function run(scheduler, count, onClick = () => {}) {
  let now = 0;
  const clicks = [];
  // Generous: at 40 bpm with no subdivision, 8 clicks take 10.5 seconds.
  for (let step = 0; step < 20000 && clicks.length < count; step += 1) {
    for (const click of scheduler.poll(now)) {
      clicks.push(click);
      onClick(click, clicks.length);
      if (clicks.length >= count) break;
    }
    now += 0.025;
  }
  assert.equal(clicks.length, count, `only produced ${clicks.length} clicks`);
  return clicks;
}

const gaps = (clicks) =>
  clicks.slice(1).map((click, i) => click.time - clicks[i].time);

test("a stopped metronome schedules nothing", () => {
  const scheduler = new MetronomeScheduler({ bpm: 120 });
  assert.deepEqual(scheduler.poll(0), []);
  assert.equal(scheduler.isRunning, false);
});

test("at 120 bpm, eight beats land half a second apart", () => {
  const scheduler = new MetronomeScheduler({ bpm: 120, meter: 4 });
  scheduler.start(0);
  const clicks = run(scheduler, 8);
  for (const gap of gaps(clicks)) {
    assert.ok(
      Math.abs(gap - 0.5) < MS,
      `expected a 0.5s gap, got ${gap.toFixed(6)}s`,
    );
  }
});

test("no beat is ever scheduled in the past", () => {
  const scheduler = new MetronomeScheduler({ bpm: 176 });
  scheduler.start(0);
  let now = 0;
  for (let step = 0; step < 400; step += 1) {
    for (const click of scheduler.poll(now)) {
      assert.ok(click.time >= now, `scheduled ${now - click.time}s late`);
    }
    now += 0.025;
  }
});

test("dropping to 60 bpm after beat 3 leaves beats 1-3 where they were", () => {
  const scheduler = new MetronomeScheduler({ bpm: 120, meter: 4 });
  scheduler.start(0);
  const clicks = run(scheduler, 8, (_click, played) => {
    if (played === 3) scheduler.setBpm(60);
  });

  const spacing = gaps(clicks);
  // Beats 1-3 were already spoken for at the old tempo.
  for (const gap of spacing.slice(0, 2)) {
    assert.ok(Math.abs(gap - 0.5) < MS, `beat moved: ${gap.toFixed(6)}s`);
  }
  // Everything after the change is spaced at the new one.
  for (const gap of spacing.slice(2)) {
    assert.ok(Math.abs(gap - 1) < MS, `expected 1s, got ${gap.toFixed(6)}s`);
  }
});

test("a tempo change does not restart the bar", () => {
  const scheduler = new MetronomeScheduler({ bpm: 120, meter: 4 });
  scheduler.start(0);
  const clicks = run(scheduler, 8, (_click, played) => {
    if (played === 3) scheduler.setBpm(60);
  });
  assert.deepEqual(
    clicks.map((click) => click.beat),
    [0, 1, 2, 3, 0, 1, 2, 3],
    "the count restarted instead of continuing",
  );
  assert.deepEqual(
    clicks.map((click) => click.bar),
    [0, 0, 0, 0, 1, 1, 1, 1],
  );
});

test("the downbeat is the only accented beat in the bar", () => {
  const scheduler = new MetronomeScheduler({ bpm: 120, meter: 3 });
  scheduler.start(0);
  const clicks = run(scheduler, 6);
  assert.deepEqual(
    clicks.map((click) => click.accent),
    ["downbeat", "beat", "beat", "downbeat", "beat", "beat"],
  );
});

test("eighth notes fall halfway between the beats", () => {
  const scheduler = new MetronomeScheduler({
    bpm: 120,
    meter: 4,
    subdivision: 2,
  });
  scheduler.start(0);
  const clicks = run(scheduler, 8);
  for (const gap of gaps(clicks)) {
    assert.ok(Math.abs(gap - 0.25) < MS, `got ${gap.toFixed(6)}s`);
  }
  assert.deepEqual(
    clicks.map((click) => click.accent),
    [
      "downbeat", "offbeat", "beat", "offbeat",
      "beat", "offbeat", "beat", "offbeat",
    ],
    "the offbeat is not a beat and must not be counted as one",
  );
});

test("triplets divide the beat in three, not in two", () => {
  const scheduler = new MetronomeScheduler({ bpm: 90, subdivision: 3 });
  scheduler.start(0);
  const clicks = run(scheduler, 7);
  const third = 60 / 90 / 3;
  for (const gap of gaps(clicks)) {
    assert.ok(Math.abs(gap - third) < MS, `got ${gap.toFixed(6)}s`);
  }
  // Three clicks per beat, so beat one comes back around on the fourth.
  assert.deepEqual(
    clicks.map((click) => click.tick),
    [0, 1, 2, 0, 1, 2, 0],
  );
});

test("the count-in is counted in beats, whatever the subdivision", () => {
  const scheduler = new MetronomeScheduler({
    bpm: 120,
    meter: 4,
    subdivision: 4,
    countInBars: 1,
  });
  scheduler.start(0);
  const clicks = run(scheduler, 8);

  const countIn = clicks.filter((click) => click.countIn);
  assert.equal(countIn.length, 4, "one bar of count-in is four beats");
  for (const gap of gaps(countIn)) {
    assert.ok(Math.abs(gap - 0.5) < MS, `count-in subdivided: ${gap}s`);
  }
  assert.ok(countIn.every((click) => click.tick === 0));

  // Bar one starts a beat after the last count-in click, then subdivides.
  const first = clicks.find((click) => !click.countIn);
  assert.equal(first.bar, 0);
  assert.equal(first.accent, "downbeat");
  assert.ok(Math.abs(first.time - countIn[3].time - 0.5) < MS);
  const after = clicks.slice(clicks.indexOf(first));
  for (const gap of gaps(after)) {
    assert.ok(Math.abs(gap - 0.125) < MS, `got ${gap.toFixed(6)}s`);
  }
});

test("a suspended page resyncs instead of replaying the backlog", () => {
  const scheduler = new MetronomeScheduler({ bpm: 120, meter: 4 });
  scheduler.start(0);
  scheduler.poll(0);
  // The phone locked for five minutes.
  const clicks = scheduler.poll(300);
  assert.ok(clicks.length < 4, `replayed ${clicks.length} missed clicks`);
  assert.ok(clicks.every((click) => click.time >= 300));
  assert.equal(clicks[0].beat, 0, "resyncing starts a fresh bar");
});

test("the tempo stays inside what a person can play", () => {
  assert.equal(clampBpm(10), MIN_BPM);
  assert.equal(clampBpm(9000), MAX_BPM);
  assert.equal(clampBpm(Number.NaN), MIN_BPM);
  assert.equal(clampBpm(120.4), 120);

  const scheduler = new MetronomeScheduler({ bpm: 120 });
  scheduler.start(0);
  scheduler.setBpm(5000);
  assert.equal(scheduler.bpm, MAX_BPM);
});

test("tapping four times at 120 bpm reads as 120 bpm", () => {
  assert.equal(tappedTempo([0, 500, 1000, 1500]), 120);
  assert.equal(tappedTempo([0]), null);
  assert.equal(tappedTempo([]), null);
});

test("a pause in the tapping starts the count over", () => {
  // Two taps at 60 bpm, a long think, then three at 120.
  const taps = [0, 1000, 9000, 9500, 10000];
  assert.equal(tappedTempo(taps), 120);
});
