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
import { screenSources } from "./helpers/sources.mjs";

const { CHORDS, SCALES, SONGS } = await import("../lib/fretlab/library.ts");
const { shapeWindow } = await import("../lib/fretlab/geometry.ts");
const {
  FIFTHS,
  OPEN_PC,
  chordIntervals,
  chordVoicing,
  degreeLabels,
  keyPc,
  majorScale,
  pcOfName,
  spellPitchClass,
  voicingIntervals,
} =
  await import(
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

// ---------------------------------------------------------------- voicings

test("a generated voicing is the chord it claims to be", () => {
  for (const chord of CHORDS) {
    for (const voicing of ["Barre", "Triad"]) {
      const notes = chordVoicing(chord, voicing);
      const want = [...new Set(voicingIntervals(chord, voicing))].sort((a, b) => a - b);
      const got = [...new Set(notes.map((n) => degreeOf(n, chord.root)))].sort(
        (a, b) => a - b,
      );
      assert.deepEqual(got, want, `${chord.symbol} ${voicing}`);
    }
  }
});

test("a barre voicing is reachable by one hand", () => {
  for (const chord of CHORDS) {
    const notes = chordVoicing(chord, "Barre");
    const frets = notes.map((n) => n.f);
    const reach = Math.max(...frets) - Math.min(...frets);
    assert.ok(reach <= 4, `${chord.symbol}: ${reach + 1} frets apart`);
    assert.ok(Math.min(...frets) >= 0, `${chord.symbol}: negative fret`);
    assert.ok(Math.max(...frets) <= 15, `${chord.symbol}: past the neck`);
  }
});

test("a barre voicing sounds its own root on its lowest string", () => {
  for (const chord of CHORDS) {
    const notes = chordVoicing(chord, "Barre");
    const lowest = notes.reduce((a, b) => (b.s > a.s ? b : a));
    assert.equal(
      degreeOf(lowest, chord.root),
      0,
      `${chord.symbol}: bass note is degree ${degreeOf(lowest, chord.root)}, not the root`,
    );
  }
});

test("a three-string voicing drops the fifth, never the third or the seventh", () => {
  for (const chord of CHORDS) {
    const shell = voicingIntervals(chord, "Triad");
    const full = chordIntervals(chord);
    assert.ok(shell.length <= 3, `${chord.symbol}: ${shell.length} tones on three strings`);
    for (const interval of full) {
      if (interval === 7 && full.length > 3) continue;
      assert.ok(shell.includes(interval), `${chord.symbol} drops ${interval}`);
    }
  }
});

test("every voicing fits the window it is drawn in", () => {
  for (const chord of CHORDS) {
    for (const voicing of ["Open", "Barre", "Triad"]) {
      const notes =
        voicing === "Open" ? chord.fingering : chordVoicing(chord, voicing);
      const { low, high } = shapeWindow(notes);
      for (const note of notes) {
        assert.ok(
          note.f >= low && note.f <= high,
          `${chord.symbol} ${voicing}: fret ${note.f} outside window ${low}-${high}`,
        );
      }
      assert.ok(high - low >= 4, `${chord.symbol} ${voicing}: window too narrow`);
    }
  }
});

// ---------------------------------------------------------------- spelling

test("the board spells notes the way the key does", () => {
  for (const key of FIFTHS) {
    for (const note of majorScale(key)) {
      const written = spellPitchClass(pcOfName(note), key);
      assert.equal(
        written,
        note.replaceAll("#", "♯").replaceAll("b", "♭"),
        `${key}: board writes ${written} where the scale says ${note}`,
      );
    }
  }
});

test("no key is drawn with two spellings of the same letter", () => {
  for (const key of FIFTHS) {
    const drawn = [0, 2, 4, 5, 7, 9, 11].map((step) =>
      spellPitchClass(keyPc(key) + step, key),
    );
    const letters = drawn.map((n) => n[0]);
    assert.equal(new Set(letters).size, 7, `${key} draws ${drawn.join(" ")}`);
  }
});

test("a scale's degree labels use its own formula", () => {
  const lydian = SCALES.find((s) => s.id === "lydian");
  const labels = degreeLabels(lydian);
  assert.equal(labels[6], "♯4", "Lydian's characteristic note is the sharp 4");
  const phrygian = SCALES.find((s) => s.id === "phrygian");
  assert.equal(degreeLabels(phrygian)[1], "♭2");
  // No scale given: the chromatic fallback still names every degree.
  assert.equal(degreeLabels()[6], "♭5");
});

test("every scale's labels cover every note it contains", () => {
  for (const scale of SCALES) {
    const labels = degreeLabels(scale);
    for (const interval of scale.intervals) {
      assert.ok(labels[interval], `${scale.name}: degree ${interval} unlabelled`);
    }
  }
});

// ---------------------------------------------------------------- no fiction

/**
 * Screens used to ship figures nobody had earned: a 31 day streak on a new
 * account, "18 minutes / 4 drills / 84 bpm", a frozen 02:18 clock, a week of
 * invented minutes, a 68/90 weekly goal with no goal feature behind it, and
 * Apple's 9:41 in the status bar.
 *
 * Numbers inside JSX text are the shape that bug takes, so this fails on any
 * of them. A figure belongs in an expression that derives it, not in markup.
 */
test("screens render no hardcoded figures", async () => {
  const files = await screenSources();
  const offenders = [];
  for (const file of files) {
    // Text nodes between tags: >  12  < but not >{value}<.
    for (const match of file.text.matchAll(/>\s*([0-9][0-9:.,/\s]*)\s*</g)) {
      const literal = match[1].trim();
      // A lone digit is structural numbering (step 1, 2, 3), not a measurement.
      if (/^[0-9]$/.test(literal)) continue;
      offenders.push(`${file.path}: >${literal}<`);
    }
    for (const match of file.text.matchAll(/\b(?:end|title|label)="[^"]*?\b(\d[\d:.,]*)\b[^"]*"/g)) {
      offenders.push(`${file.path}: "${match[0].slice(0, 48)}"`);
    }
  }
  assert.deepEqual(offenders, [], `fabricated figures:\n  ${offenders.join("\n  ")}`);
});
