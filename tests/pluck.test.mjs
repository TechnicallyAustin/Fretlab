/**
 * The guitar sound has to be the note on screen.
 *
 * FL-22. `playTones` synthesised sine and triangle waves from a fixed MIDI 48
 * base using abstract intervals, so an open C and a barre C at the eighth fret
 * sounded identical and neither was in the octave a guitar puts them in.
 *
 * The synthesis is a pure function over samples, which means it can be checked
 * against **the app's own pitch detector** rather than against an ear: FL-15's
 * tuner listening to FL-22's string. If either drifts, this fails.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { pluckBuffer, STRUM_DELAY } = await import("../lib/fretlab/pluck.ts");
const { detectPitch, centsBetween, frequencyOf, STANDARD_TUNING } = await import(
  "../lib/fretlab/pitch.ts"
);
const { STANDARD_TUNING: BOARD_TUNING, DROP_D_TUNING } = await import(
  "../lib/fretlab/theory.ts"
);

const RATE = 44100;

/** Skip the pluck transient, then take a window the detector can work with. */
const body = (samples) => samples.slice(2000, 2000 + 8192);

/**
 * Two cents, which is FL-15's bar for the tuner. A reference tone may not be
 * looser than the instrument that measures it.
 *
 * The synthesis clears this by a wide margin — 0.11 cents at worst across the
 * range — but only because the fractional delay is an allpass. Linear
 * interpolation, tried first, drifted to 15 cents by the twelfth fret of the B
 * string, so the margin is the fix rather than luck.
 */
const TOLERANCE = 2;

test("a plucked string sounds the note it was asked for", () => {
  for (const string of STANDARD_TUNING) {
    const detected = detectPitch(body(pluckBuffer(string.frequency, RATE)), RATE);
    assert.ok(detected !== null, `${string.name}${string.octave} produced no pitch`);
    const off = centsBetween(detected, string.frequency);
    assert.ok(
      Math.abs(off) < TOLERANCE,
      `${string.name}${string.octave}: ${off.toFixed(2)} cents out`,
    );
  }
});

test("it stays in tune across the range a guitar covers", () => {
  // Low E open to the high e at the twelfth fret.
  for (let midi = 40; midi <= 76; midi += 1) {
    const target = frequencyOf(midi);
    const detected = detectPitch(body(pluckBuffer(target, RATE)), RATE);
    assert.ok(detected !== null, `MIDI ${midi} produced no pitch`);
    assert.ok(
      Math.abs(centsBetween(detected, target)) < TOLERANCE,
      `MIDI ${midi}: ${centsBetween(detected, target).toFixed(2)} cents out`,
    );
  }
});

test("a string decays instead of ringing forever", () => {
  const samples = pluckBuffer(110, RATE, { seconds: 2 });
  const peak = (from, to) => Math.max(...Array.from(samples.slice(from, to), Math.abs));
  const start = peak(2000, 6000);
  const later = peak(RATE, RATE + 4000);
  assert.ok(start > 0.05, "the pluck is inaudible");
  assert.ok(later < start * 0.9, "the note is not decaying");
  assert.ok(later > 0, "the note died before a second was out");
});

test("a pluck does not start with a click", () => {
  // A buffer that begins at full amplitude clicks. The first sample must be
  // near silence and the envelope must climb.
  const samples = pluckBuffer(196, RATE);
  assert.ok(Math.abs(samples[0]) < 0.01, `starts at ${samples[0]}`);
  const attack = Math.max(...Array.from(samples.slice(0, 300), Math.abs));
  assert.ok(attack > Math.abs(samples[0]), "the attack does not rise");
});

test("nothing is generated for a pitch that is not one", () => {
  for (const bad of [0, -110, Number.NaN, Infinity]) {
    const samples = pluckBuffer(bad, RATE);
    assert.ok(
      samples.every((value) => value === 0),
      `${bad} produced audio`,
    );
  }
});

test("the same string twice sounds the same", () => {
  // Deterministic noise: Math.random would give a different instrument on
  // every press, and nothing here could be asserted.
  const a = pluckBuffer(146.83, RATE, { seed: 7 });
  const b = pluckBuffer(146.83, RATE, { seed: 7 });
  assert.deepEqual(Array.from(a.slice(0, 500)), Array.from(b.slice(0, 500)));

  const c = pluckBuffer(146.83, RATE, { seed: 8 });
  assert.notDeepEqual(Array.from(a.slice(0, 500)), Array.from(c.slice(0, 500)));
});

test("a strum is not a chord struck all at once", () => {
  assert.ok(STRUM_DELAY > 0, "strings would all start together");
  assert.ok(STRUM_DELAY < 0.05, "a 50ms gap is an arpeggio, not a strum");
});

/**
 * The point of the task: a shape's pitch comes from its string and its fret,
 * through the tuning map, so Drop D sounds like Drop D.
 */
test("a fretted note takes its pitch from the string it is on", () => {
  const midiFor = (tuning, string, fret) => tuning.openMidi[string] + fret;

  // Open low E, standard, is E2 — MIDI 40.
  assert.equal(midiFor(BOARD_TUNING, 6, 0), 40);
  // The same string in Drop D is a tone lower.
  assert.equal(midiFor(DROP_D_TUNING, 6, 0), 38);
  // And the fifth fret of the low E is the open A.
  assert.equal(midiFor(BOARD_TUNING, 6, 5), midiFor(BOARD_TUNING, 5, 0));

  // Which the synth then sounds, at the pitch the tuner expects.
  const detected = detectPitch(body(pluckBuffer(frequencyOf(38), RATE)), RATE);
  assert.ok(
    Math.abs(centsBetween(detected, frequencyOf(38))) < TOLERANCE,
    "Drop D's low string is out of tune",
  );
});

// ------------------------------------------- what the shape on screen sounds

const { shapePitches } = await import("../lib/fretlab/audio.ts");
const { CHORDS } = await import("../lib/fretlab/library.ts");

/**
 * FL-22's claim, checked directly. It used to synthesise from an abstract
 * interval over a fixed MIDI 48 base, so an open C and a barre C at the eighth
 * fret sounded identical and neither was in a guitar's octave.
 */
test("two shapes of the same chord sound different", () => {
  const open = CHORDS.find((chord) => chord.id === "c-major").fingering
    .filter((note) => note.finger !== undefined);
  const barre = [
    { s: 5, f: 3 }, { s: 4, f: 5 }, { s: 3, f: 5 }, { s: 2, f: 5 }, { s: 1, f: 3 },
  ];

  const openPitches = shapePitches(open, BOARD_TUNING).map((p) => p.midi);
  const barrePitches = shapePitches(barre, BOARD_TUNING).map((p) => p.midi);

  assert.notDeepEqual(openPitches, barrePitches, "the two C shapes sound the same");

  // They share their lowest note — both are rooted on the C at the third fret
  // of the A string — so the difference is above it. Comparing the lowest note
  // is what this assertion tried first, and it is the wrong end of the shape.
  assert.equal(
    Math.min(...openPitches),
    Math.min(...barrePitches),
    "both C shapes are rooted on the same C",
  );
  assert.ok(
    Math.max(...barrePitches) > Math.max(...openPitches),
    "the barre shape should reach higher than the open one",
  );
  // And both are C major: every note is a C, an E or a G.
  for (const pitches of [openPitches, barrePitches]) {
    for (const midi of pitches) {
      assert.ok([0, 4, 7].includes(midi % 12), `MIDI ${midi} is not a C major tone`);
    }
  }
});

test("a shape sounds low string to high, the way a downstroke travels", () => {
  const strings = shapePitches(
    [{ s: 1, f: 3 }, { s: 6, f: 3 }, { s: 4, f: 0 }],
    BOARD_TUNING,
  ).map((p) => p.note.s);
  assert.deepEqual(strings, [6, 4, 1], "strings should sound low to high");
});

test("a string's pitch comes from the tuning, so Drop D drops", () => {
  const lowE = [{ s: 6, f: 0 }];
  assert.equal(shapePitches(lowE, BOARD_TUNING)[0].midi, 40, "standard low E is E2");
  assert.equal(shapePitches(lowE, DROP_D_TUNING)[0].midi, 38, "Drop D is a tone lower");

  // Everything above the sixth string is untouched by Drop D.
  for (const string of [1, 2, 3, 4, 5]) {
    const note = [{ s: string, f: 0 }];
    assert.equal(
      shapePitches(note, BOARD_TUNING)[0].midi,
      shapePitches(note, DROP_D_TUNING)[0].midi,
      `Drop D moved string ${string}`,
    );
  }
});

test("the synthesiser and the tuner agree on every pitch", () => {
  // They had two copies of the equal-temperament formula, one with 440
  // written into it. A change to concert pitch in one would have desynced the
  // thing that plays a note from the thing that measures it.
  for (let midi = 40; midi <= 76; midi += 1) {
    const fromShape = shapePitches([{ s: 6, f: midi - 40 }], BOARD_TUNING)[0];
    assert.equal(fromShape.midi, midi);
    assert.ok(
      Math.abs(centsBetween(fromShape.frequency, frequencyOf(midi))) < 0.0001,
      `MIDI ${midi}: the synth and the tuner disagree`,
    );
  }
});

test("a string the tuning does not have is not invented", () => {
  const sevenString = shapePitches([{ s: 7, f: 0 }, { s: 6, f: 0 }], BOARD_TUNING);
  assert.equal(sevenString.length, 1, "a seventh string should be dropped, not guessed");
  assert.equal(sevenString[0].note.s, 6);
});
