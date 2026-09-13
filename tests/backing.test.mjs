/**
 * Something to play over, in time and in tune.
 *
 * FL-25. "Free play over a drone" has been a routine step since FL-10 with
 * nothing to play over.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { PROGRESSIONS, chordAtBar, chordIntervals, lengthInBars, progressionById } =
  await import("../lib/fretlab/backing.ts");
const { droneBuffer } = await import("../lib/fretlab/drone.ts");
const { detectPitch, centsBetween, STANDARD_TUNING, frequencyOf } = await import(
  "../lib/fretlab/pitch.ts"
);

const RATE = 44100;

// ------------------------------------------------------------ progressions

test("every progression is a whole number of bars that repeats", () => {
  for (const progression of PROGRESSIONS) {
    const bars = lengthInBars(progression);
    assert.ok(bars > 0, `${progression.name} has no length`);
    // The bar after the last is the first again.
    assert.deepEqual(
      chordAtBar(progression, bars),
      chordAtBar(progression, 0),
      `${progression.name} does not loop`,
    );
    assert.deepEqual(chordAtBar(progression, bars * 3 + 1), chordAtBar(progression, 1));
  }
});

test("a negative bar still lands somewhere real", () => {
  // The metronome counts negative bars through its count-in.
  for (const progression of PROGRESSIONS) {
    for (const bar of [-1, -4, -13]) {
      const chord = chordAtBar(progression, bar);
      assert.ok(chord, `${progression.name} bar ${bar} has no chord`);
      assert.ok(progression.chords.includes(chord));
    }
  }
});

test("the twelve-bar blues is twelve bars", () => {
  // The form is the name. If this is not twelve, the name is a lie.
  assert.equal(lengthInBars(progressionById("twelve-bar")), 12);

  // And it goes where the form goes: I for four, IV for two, back to I.
  const labels = Array.from({ length: 12 }, (_, bar) =>
    chordAtBar(progressionById("twelve-bar"), bar).label,
  );
  assert.deepEqual(labels, [
    "I7", "I7", "I7", "I7",
    "IV7", "IV7", "I7", "I7",
    "V7", "IV7", "I7", "V7",
  ]);
});

test("ii-V-I is a minor two, a dominant five and a major one", () => {
  const progression = progressionById("two-five-one");
  const [two, five, one] = progression.chords;
  assert.equal(two.quality, "minor-seven");
  assert.equal(five.quality, "dominant-seven");
  assert.equal(one.quality, "major");
  // In C: Dm7, G7, C.
  assert.deepEqual(chordIntervals(two), [2, 5, 9, 12]);
  assert.deepEqual(chordIntervals(five), [7, 11, 14, 17]);
  assert.deepEqual(chordIntervals(one), [0, 4, 7]);
});

test("I-IV-V is built on the first, fourth and fifth degrees", () => {
  const progression = progressionById("one-four-five");
  const roots = progression.chords.map((chord) => chordIntervals(chord)[0]);
  assert.deepEqual(roots, [0, 5, 7], "the roots are not I, IV and V");
  for (const chord of progression.chords) {
    assert.equal(chord.quality, "major", `${chord.label} should be major`);
  }
});

test("every chord is a real stack of thirds", () => {
  for (const progression of PROGRESSIONS) {
    for (const chord of progression.chords) {
      const intervals = chordIntervals(chord);
      assert.ok(intervals.length >= 3, `${chord.label} is not a chord`);
      for (let i = 1; i < intervals.length; i += 1) {
        const gap = intervals[i] - intervals[i - 1];
        assert.ok(gap === 3 || gap === 4, `${chord.label}: a ${gap}-semitone third`);
      }
    }
  }
});

test("the drone progression is the root and nothing else", () => {
  const drone = progressionById("drone");
  assert.equal(drone.chords.length, 1);
  assert.equal(chordIntervals(drone.chords[0])[0], 0, "a drone that is not on the root");
});

// ------------------------------------------------------------------- drone

test("a drone sounds the pitch it was asked for", () => {
  for (const string of STANDARD_TUNING) {
    const buffer = droneBuffer(string.frequency, RATE);
    const detected = detectPitch(buffer.slice(0, 8192), RATE);
    assert.ok(detected !== null, `${string.name} produced no pitch`);
    assert.ok(
      Math.abs(centsBetween(detected, string.frequency)) < 1,
      `${string.name}${string.octave}: ${centsBetween(detected, string.frequency).toFixed(2)} cents out`,
    );
  }
});

/**
 * A drone loops forever, so its end has to meet its start. Cut mid-cycle and
 * the loop point is a discontinuity — heard as a tick once a second, which is
 * obvious in a room and invisible in a waveform nobody looks at.
 *
 * The loop point sits where every partial crosses zero, which is also where
 * consecutive samples differ *most*. So the honest comparison is against the
 * largest step in the buffer, not the average: a seamless wrap is one normal
 * step at that phase.
 */
test("a drone loops without a click", () => {
  for (const string of STANDARD_TUNING) {
    const buffer = droneBuffer(string.frequency, RATE);
    let largest = 0;
    for (let i = 1; i < buffer.length; i += 1) {
      largest = Math.max(largest, Math.abs(buffer[i] - buffer[i - 1]));
    }
    const wrap = Math.abs(buffer[0] - buffer[buffer.length - 1]);
    assert.ok(
      wrap <= largest * 1.05,
      `${string.name}${string.octave}: the loop point jumps ${(wrap / largest).toFixed(2)}x a normal step`,
    );
  }
});

test("a drone does not decay", () => {
  // The difference between a drone and a plucked string. A decaying drone is
  // a note, and you cannot play over a note.
  const buffer = droneBuffer(frequencyOf(45), RATE, { seconds: 4 });
  const peak = (from, to) =>
    Math.max(...Array.from(buffer.slice(from, to), Math.abs));
  const start = peak(0, 4000);
  const end = peak(buffer.length - 4000, buffer.length);
  assert.ok(end > start * 0.6, `the drone faded from ${start.toFixed(2)} to ${end.toFixed(2)}`);
});

test("a drone stays inside the rails", () => {
  for (const midi of [40, 52, 64]) {
    for (const sample of droneBuffer(frequencyOf(midi), RATE)) {
      assert.ok(Math.abs(sample) <= 1, "a drone sample clipped");
    }
  }
});

test("nothing is generated for a pitch that is not one", () => {
  for (const bad of [0, -110, Number.NaN, Infinity]) {
    assert.equal(droneBuffer(bad, RATE).length, 0, `${bad} produced audio`);
  }
});
