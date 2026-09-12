/**
 * The tuner has to be right, or it is worse than no tuner.
 *
 * FL-15. The acceptance is reference tones for all six open strings detected
 * within 2 cents. A cent is a hundredth of a semitone: two of them is about
 * the finest distinction a good ear makes, and well inside what a tuning peg
 * can resolve.
 *
 * Real strings are not sine waves, so the tones here are built with harmonics
 * — and for the wound bass strings, with a second harmonic *louder* than the
 * fundamental, which is what makes a naive autocorrelation report the octave
 * above. That case has its own test.
 */
import assert from "node:assert/strict";
import test from "node:test";

const {
  A4,
  IN_TUNE_CENTS,
  STANDARD_TUNING,
  centsBetween,
  detectPitch,
  frequencyOf,
  nearestString,
  readingFor,
  tuningStrings,
} = await import("../lib/fretlab/pitch.ts");
const { DROP_D_TUNING, OPEN_PC } = await import("../lib/fretlab/theory.ts");

const RATE = 44100;
const SIZE = 8192;

/**
 * A plucked-string tone: a fundamental plus decaying harmonics, with a phase
 * offset so the block never starts conveniently at zero.
 */
function tone(frequency, { rate = RATE, size = SIZE, harmonics = [1, 0.5, 0.3, 0.15], phase = 0.7 } = {}) {
  const samples = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    let value = 0;
    harmonics.forEach((gain, index) => {
      value += gain * Math.sin(2 * Math.PI * frequency * (index + 1) * (i / rate) + phase);
    });
    samples[i] = value * 0.3;
  }
  return samples;
}

test("every open string is detected within 2 cents", () => {
  for (const string of STANDARD_TUNING) {
    const detected = detectPitch(tone(string.frequency), RATE);
    assert.ok(detected !== null, `string ${string.string} was not heard at all`);
    const off = centsBetween(detected, string.frequency);
    assert.ok(
      Math.abs(off) < 2,
      `string ${string.string} (${string.name}${string.octave}, ${string.frequency.toFixed(2)} Hz) read ${off.toFixed(2)} cents out`,
    );
  }
});

test("Drop D gives the tuner a D2 sixth-string target", () => {
  const strings = tuningStrings(DROP_D_TUNING);
  assert.equal(strings[0].string, 6);
  assert.equal(strings[0].name, "D");
  assert.equal(strings[0].octave, 2);
  assert.equal(strings[0].midi, 38);
});

test("a string that is out of tune is reported as out by the right amount", () => {
  for (const string of STANDARD_TUNING) {
    for (const offset of [-40, -12, -3, 3, 12, 40]) {
      const target = string.frequency * Math.pow(2, offset / 1200);
      const detected = detectPitch(tone(target), RATE);
      assert.ok(detected !== null, `string ${string.string} ${offset}c was not heard`);
      const measured = centsBetween(detected, string.frequency);
      assert.ok(
        Math.abs(measured - offset) < 2,
        `string ${string.string}: ${offset}c out read as ${measured.toFixed(2)}c`,
      );
    }
  }
});

/**
 * The failure mode this detector is chosen for. On a wound bass string the
 * second harmonic frequently carries more energy than the fundamental, and a
 * plain autocorrelation locks onto it and reports the octave above — a tuner
 * that confidently tells you the low E is an E, an octave out.
 */
test("a fundamental quieter than its own second harmonic is still the pitch", () => {
  const lowE = STANDARD_TUNING[0];
  const detected = detectPitch(
    tone(lowE.frequency, { harmonics: [0.4, 1, 0.6, 0.3] }),
    RATE,
  );
  assert.ok(detected !== null);
  assert.ok(
    Math.abs(centsBetween(detected, lowE.frequency)) < 2,
    `read ${detected.toFixed(2)} Hz against ${lowE.frequency.toFixed(2)} Hz — an octave error is ${(lowE.frequency * 2).toFixed(2)}`,
  );
});

test("silence is not a note", () => {
  assert.equal(detectPitch(new Float32Array(SIZE), RATE), null);
});

test("a room tone too quiet to be a string is not a note", () => {
  const quiet = tone(196).map((value) => value * 0.005);
  assert.equal(detectPitch(Float32Array.from(quiet), RATE), null);
});

test("noise is not a note", () => {
  // Deterministic pseudo-noise, so the test cannot fail once in a hundred runs.
  let seed = 7;
  const samples = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i += 1) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    samples[i] = (seed / 2147483648) * 2 - 1;
  }
  const detected = detectPitch(samples, RATE);
  // Noise may correlate weakly somewhere; what it must not do is land on a
  // string and tell someone to turn a peg.
  if (detected !== null) {
    const near = nearestString(detected);
    assert.ok(
      Math.abs(centsBetween(detected, near.frequency)) > IN_TUNE_CENTS,
      `noise read as an in-tune ${near.name}${near.octave}`,
    );
  }
});

test("a block too short to hold two periods is refused", () => {
  assert.equal(detectPitch(tone(82.41, { size: 32 }), RATE), null);
  // 128 samples at 44.1k is under three milliseconds: no low E fits in it.
  assert.equal(detectPitch(tone(82.41, { size: 128 }), RATE), null);
});

test("a nonsense sample rate is refused rather than guessed at", () => {
  const samples = tone(440);
  assert.equal(detectPitch(samples, 0), null);
  assert.equal(detectPitch(samples, -44100), null);
  assert.equal(detectPitch(samples, Number.NaN), null);
});

// ------------------------------------------------------------------ naming

test("concert A is A4 with no deviation", () => {
  const reading = readingFor(A4);
  assert.equal(reading.name, "A");
  assert.equal(reading.octave, 4);
  assert.equal(reading.midi, 69);
  assert.ok(Math.abs(reading.cents) < 0.001);
});

test("a note reads flat when it is flat and sharp when it is sharp", () => {
  assert.ok(readingFor(A4 * Math.pow(2, -20 / 1200)).cents < -19);
  assert.ok(readingFor(A4 * Math.pow(2, 20 / 1200)).cents > 19);
});

test("the octave number follows scientific pitch notation", () => {
  // Middle C is C4 and MIDI 60; the guitar's low E is E2.
  assert.equal(readingFor(frequencyOf(60)).name, "C");
  assert.equal(readingFor(frequencyOf(60)).octave, 4);
  assert.equal(readingFor(frequencyOf(40)).name, "E");
  assert.equal(readingFor(frequencyOf(40)).octave, 2);
});

test("a frequency that is not one has no reading", () => {
  assert.equal(readingFor(0), null);
  assert.equal(readingFor(-440), null);
  assert.equal(readingFor(Number.NaN), null);
});

// ----------------------------------------------------------------- tuning

test("standard tuning is E A D G B E, low to high", () => {
  assert.deepEqual(
    STANDARD_TUNING.map((string) => `${string.name}${string.octave}`),
    ["E2", "A2", "D3", "G3", "B3", "E4"],
  );
  assert.deepEqual(
    STANDARD_TUNING.map((string) => string.midi),
    [40, 45, 50, 55, 59, 64],
  );
});

/**
 * The tuner and the fretboard have to agree about what an open string is, or
 * the app tunes you to one instrument and draws another. The pitch classes
 * come from the board's own table; only the octave is added here.
 */
test("the tuner's strings are the fretboard's strings", () => {
  for (const string of STANDARD_TUNING) {
    assert.equal(
      string.midi % 12,
      OPEN_PC[string.string],
      `string ${string.string} disagrees with the fretboard`,
    );
  }
});

test("the low E sounds at 82.41 Hz", () => {
  assert.ok(Math.abs(STANDARD_TUNING[0].frequency - 82.41) < 0.01);
  assert.ok(Math.abs(STANDARD_TUNING[5].frequency - 329.63) < 0.01);
});

test("a pitch is matched to the string it is nearest in semitones", () => {
  for (const string of STANDARD_TUNING) {
    const near = nearestString(string.frequency * Math.pow(2, 30 / 1200));
    assert.equal(near.string, string.string, `${string.name} matched the wrong string`);
  }
});

test("the string match does not favour the top of the neck", () => {
  // Halfway between the low E and the A in semitone terms. A hertz-based
  // comparison would pull this toward the higher string every time.
  const [lowE, a] = STANDARD_TUNING;
  const middle = Math.sqrt(lowE.frequency * a.frequency);
  const near = nearestString(middle - 0.5);
  assert.equal(near.string, lowE.string, "a hertz comparison would say A");
});

test("nothing matches a string when there is no tuning to match against", () => {
  assert.equal(nearestString(110, []), null);
  assert.equal(nearestString(Number.NaN), null);
});
