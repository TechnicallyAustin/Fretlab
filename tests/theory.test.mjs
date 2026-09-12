/**
 * The music has to be right.
 *
 * The suite this file joins proves the architecture: boundaries fire, routes
 * resolve, screens handle their four states. None of it could tell you that a
 * barre chord contained its own root, that a key spelled each letter once, or
 * that a fingering could be played by a hand — so for a long time none of those
 * were true while every test passed.
 *
 * Every assertion here stands for a defect that shipped.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { CHORDS, SCALES, SONGS } = await import("../lib/fretlab/library.ts");
const { FIFTHS, OPEN_PC, chordIntervals, keyPc, majorScale } = await import(
  "../lib/fretlab/theory.ts"
);

/** The pitch class a shape sounds on a given string and fret. */
const soundedPc = (note) => (OPEN_PC[note.s] + note.f) % 12;
/** Semitones above the chord root. */
const degreeOf = (note, root) => (((soundedPc(note) - keyPc(root)) % 12) + 12) % 12;

// ---------------------------------------------------------------- fingerings

test("no chord asks one finger for two different frets", () => {
  for (const chord of CHORDS) {
    const byFinger = new Map();
    for (const note of chord.fingering) {
      if (!note.finger) continue; // 0 is an open string
      byFinger.set(note.finger, [...(byFinger.get(note.finger) ?? []), note]);
    }
    for (const [finger, notes] of byFinger) {
      const frets = new Set(notes.map((n) => n.f));
      assert.equal(
        frets.size,
        1,
        `${chord.symbol}: finger ${finger} is asked for frets ${[...frets].join(" and ")}`,
      );
    }
  }
});

test("a shared finger is a real barre, with nothing fretted lower inside it", () => {
  for (const chord of CHORDS) {
    const byFinger = new Map();
    for (const note of chord.fingering) {
      if (!note.finger) continue;
      byFinger.set(note.finger, [...(byFinger.get(note.finger) ?? []), note]);
    }
    for (const [finger, notes] of byFinger) {
      if (notes.length === 1) continue;
      const strings = notes.map((n) => n.s).sort((a, b) => a - b);
      const fret = notes[0].f;
      for (let s = strings[0]; s <= strings.at(-1); s += 1) {
        const inner = chord.fingering.find((n) => n.s === s);
        assert.ok(
          !inner || inner.f >= fret,
          `${chord.symbol}: finger ${finger} barres fret ${fret} but string ${s} is fretted at ${inner.f}`,
        );
      }
    }
  }
});

test("every fretted note has a finger and every open string has none", () => {
  for (const chord of CHORDS) {
    for (const note of chord.fingering) {
      if (note.f === 0) {
        assert.equal(note.finger, 0, `${chord.symbol}: open string ${note.s}`);
      } else {
        assert.ok(
          note.finger >= 1 && note.finger <= 4,
          `${chord.symbol}: string ${note.s} finger ${note.finger}`,
        );
      }
    }
  }
});

test("every chord declares which strings are silent", () => {
  for (const chord of CHORDS) {
    const played = new Set(chord.fingering.map((n) => n.s));
    const muted = new Set(chord.muted);
    for (let s = 1; s <= 6; s += 1) {
      assert.ok(
        played.has(s) !== muted.has(s),
        `${chord.symbol}: string ${s} is ${played.has(s) && muted.has(s) ? "both played and muted" : "neither played nor muted"}`,
      );
    }
  }
});

// ---------------------------------------------------------------- chord data

test("every chord's stored shape sounds the notes it claims", () => {
  const NAME_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const pcOfName = (name) =>
    (NAME_PC[name[0]] +
      [...name.slice(1)].reduce((n, mark) => n + (mark === "#" ? 1 : -1), 0) +
      12) %
    12;
  for (const chord of CHORDS) {
    const want = new Set(chord.notes.split(" · ").map(pcOfName));
    const got = new Set(chord.fingering.map(soundedPc));
    assert.deepEqual(
      [...got].sort((a, b) => a - b),
      [...want].sort((a, b) => a - b),
      `${chord.symbol} claims ${chord.notes}`,
    );
  }
});

test("every chord's shape matches its interval formula", () => {
  for (const chord of CHORDS) {
    const want = [...new Set(chordIntervals(chord))].sort((a, b) => a - b);
    const got = [...new Set(chord.fingering.map((n) => degreeOf(n, chord.root)))].sort(
      (a, b) => a - b,
    );
    assert.deepEqual(got, want, `${chord.symbol}`);
  }
});

// ---------------------------------------------------------------- key spelling

test("a major key spells each letter exactly once", () => {
  for (const key of FIFTHS) {
    const notes = majorScale(key);
    const letters = notes.map((n) => n[0]);
    assert.equal(
      new Set(letters).size,
      7,
      `${key} spells ${notes.join(" ")}, which reuses a letter`,
    );
  }
});

test("a major scale is seven notes in the right places", () => {
  const STEPS = [0, 2, 4, 5, 7, 9, 11];
  const NAME_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  for (const key of FIFTHS) {
    const notes = majorScale(key);
    assert.equal(notes.length, 7, key);
    notes.forEach((name, i) => {
      const pc =
        (NAME_PC[name[0]] +
          [...name.slice(1)].reduce((n, m) => n + (m === "#" ? 1 : -1), 0) +
          12) %
        12;
      assert.equal(pc, (keyPc(key) + STEPS[i]) % 12, `${key}: degree ${i + 1} is ${name}`);
    });
  }
});

// ---------------------------------------------------------------- scales

test("every scale formula matches its intervals", () => {
  const DEGREE_SEMITONES = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 };
  for (const scale of SCALES) {
    if (scale.formula.includes("W") || scale.formula.includes("H")) {
      // Step notation: W and H must add up to the interval list.
      const steps = scale.formula.split(" ");
      let pc = 0;
      const built = [0];
      for (const step of steps.slice(0, -1)) {
        pc += step === "W" ? 2 : 1;
        built.push(pc);
      }
      assert.deepEqual(built, [...scale.intervals], `${scale.name} formula`);
      continue;
    }
    const built = scale.formula.split(" ").map((token) => {
      const degree = Number(token.at(-1));
      const accidental = token.includes("b") ? -1 : token.includes("#") ? 1 : 0;
      return DEGREE_SEMITONES[degree] + accidental;
    });
    assert.deepEqual(built, [...scale.intervals], `${scale.name} formula`);
  }
});

// ---------------------------------------------------------------- songs

test("every song progression names a chord the library has", () => {
  const symbols = new Set(CHORDS.map((c) => c.symbol));
  for (const song of SONGS) {
    for (const symbol of song.progression) {
      assert.ok(
        symbols.has(symbol),
        `${song.title}: no chord "${symbol}" in the library`,
      );
    }
  }
});
