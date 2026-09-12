# FretLab remediation plan

Derived from the September 2026 audit. This document is the working state for that
work: it is both the specification and the progress tracker. **Update it as you go** —
it is the only place the current state is recorded.

---

## How to use this document

1. Work tasks in ID order within a stage. Stages are ordered by dependency; do not
   start Stage 2 until every Stage 1 task is `DONE`.
2. Before starting a task, set its status to `WIP`. When it is finished **and
   verified**, set it to `DONE` and tick its checkbox.
3. Update the **Progress** table at the top of each stage in the same edit.
4. One commit per task. Message format: `FL-01: author chord fingerings` .
5. If a task turns out to be wrong, blocked, or larger than described, set its status
   to `BLOCKED`, add a `> **Blocked:**` note under the task explaining why, and move to
   the next task. Do not silently skip.

### Status values

| Value | Meaning |
|---|---|
| `TODO` | Not started |
| `WIP` | In progress |
| `DONE` | Implemented **and** its acceptance test passes |
| `BLOCKED` | Cannot proceed; reason recorded under the task |

---

## Guardrails

These hold for every task. Violating one fails the task even if the feature works.

- **The working tree is dirty right now.** Commit or stash the existing changes before
  starting. Do not fold unrelated pending work into these commits.
- **Every task ends green.** `npm run typecheck && npm run lint && npm test` must all
  pass before you mark a task `DONE`. `npm test` runs a build first, so it is slow;
  run `npm run test:unit` while iterating.
- **Do not weaken a test to make it pass.** If an existing assertion fails, either the
  change is wrong or the assertion encoded a bug. If it is the latter, say so in the
  commit message.
- **Respect the layer boundaries.** `eslint-plugin-boundaries` enforces
  `L1 → L2 → L3`, and `lib/fretlab/` may import nothing but itself. Screens must not
  import `next/navigation`. If a fix seems to need a boundary crossing, it needs a
  different design.
- **Do not touch the API contract.** The wire format, error envelope, idempotency,
  pagination and the `practice_sessions` scaffolding fields in §3/§4 are out of scope.
  Adding a *column* is fine; changing the envelope is not.
- **`drizzle-kit generate` hangs in this environment.** If a task needs a migration,
  hand-write the SQL in `drizzle/` to match `db/schema.ts` exactly, as
  `0000_contract_v1_baseline.sql` was.
- **No invented numbers, ever.** This is the single rule the audit found broken most
  often. If a figure is not derived from stored data, it does not render. An empty
  state that names the action is always correct; a plausible-looking placeholder
  never is.
- **Keep the visual identity.** The cream paper palette, the key-hue system and the
  note-role shape language are the product's strongest assets. Fix their bugs; do not
  redesign them.

---

## Stage 1 — Stop teaching wrong things

**Goal:** nothing in the app states a musical falsehood. Until this stage is `DONE`
the app should not be shown to a learner.

**Progress:** 8 / 8 done — Stage 1 complete, release gate clear

| ID | Task | Status |
|---|---|---|
| FL-01 | Author chord fingerings; delete the generator | `DONE` |
| FL-02 | Draw muted and open string markers | `DONE` |
| FL-03 | Repair generated barre voicings | `DONE` |
| FL-04 | Derive the chord fret window from the voicing | `DONE` |
| FL-05 | Spell notes from the key, not from a sharps table | `DONE` |
| FL-06 | Remove the pre-filled answers in Train | `DONE` |
| FL-07 | Delete every fabricated number | `DONE` |
| FL-08 | Write `tests/theory.test.mjs` | `DONE` |

---

### - [x] FL-01 — Author chord fingerings; delete the generator
**Status:** `DONE` · **Severity:** Blocker · **Audit ref:** B-01

**Files:** `lib/fretlab/fingering.ts:121`, `lib/fretlab/library.ts` (CHORDS),
`app/_screens/ChordDetail.tsx:101`, `tests/fingering.test.mjs`

**Problem.** `fingerChordShape()` assigns fingers by sorting the distinct frets
ascending and numbering them `1, 2, 3, 4`. Its comment claims notes sharing a fret
share a finger "matching the barre a player would use" — true for a barre chord, false
for every open chord. Verified output:

```
G    s6f3=>finger2  s5f2=>finger1  ...  s1f3=>finger2   <- one finger, two strings apart
A    s4f2=>finger1  s3f2=>finger1  s2f2=>finger1        <- index barre; should be 1-2-3
D    s3f2=>finger1  s2f3=>finger2  s1f2=>finger1        <- impossible straddle
E    s5f2=>finger2  s4f2=>finger2                       <- one finger, two strings
C    correct, by coincidence
```

**Required change.** Fingering is authored data, not derived data. Add a `finger`
field to every entry in each chord's `fingering` array using the reference table in
[Appendix A](#appendix-a--chord-fingerings). Then:

- Delete `fingerChordShape` from `lib/fretlab/fingering.ts`.
- `ChordDetail.tsx:101` passes `chord.fingering` straight through for the Open
  voicing.
- Barre and Triad voicings are *generated* shapes, so they still need finger numbers.
  Replace the call with a `fingerBarreShape()` that is correct for the one thing it
  handles: the lowest fret in the shape is the barre and takes finger 1; remaining
  frets ascend 2, 3, 4. Do not reuse it for open chords.
- Remove the `fingerChordShape` assertions from `tests/fingering.test.mjs`.

**Acceptance.** In `tests/theory.test.mjs` (FL-08):

```js
test("no chord asks one finger for two different strings", () => {
  for (const chord of CHORDS) {
    const byFinger = new Map();
    for (const note of chord.fingering) {
      if (!note.finger) continue;                 // 0 = open, skip
      const seen = byFinger.get(note.finger) ?? [];
      seen.push(note);
      byFinger.set(note.finger, seen);
    }
    for (const [finger, notes] of byFinger) {
      if (notes.length === 1) continue;
      const frets = new Set(notes.map((n) => n.f));
      assert.equal(frets.size, 1,
        `${chord.symbol}: finger ${finger} is on frets ${[...frets]}`);
      // A barre is contiguous: no un-fingered lower note inside its span.
      const strings = notes.map((n) => n.s).sort((a, b) => a - b);
      const fret = notes[0].f;
      for (let s = strings[0]; s <= strings.at(-1); s += 1) {
        const inner = chord.fingering.find((n) => n.s === s);
        assert.ok(!inner || inner.f >= fret,
          `${chord.symbol}: finger ${finger} barres fret ${fret} across string ${s}, which is fretted lower`);
      }
    }
  }
});
```

**Done when.** All 16 chords carry finger numbers, `fingerChordShape` no longer
exists, the assertion above passes, and opening `/chords/g-major` shows `2 1 · · · 3`.

---

### - [x] FL-02 — Draw muted and open string markers
**Status:** `DONE` · **Severity:** Major · **Audit ref:** G-01

**Files:** `lib/fretlab/library.ts` (CHORDS), `components/fretlab/Fretboard.tsx`

**Problem.** The board draws only cells carrying a note, so a muted string is visually
identical to a string that is simply empty. C major is `x32010` and D major is
`xx0232`; a beginner has no way to know not to strum the bottom strings, and the muddy
inversion that results reads to them as their own mistake. Every printed chord box for
a century has carried `×` and `o` above the nut.

**Required change.**

1. Add an explicit `muted: number[]` field to each chord — see Appendix A. Do **not**
   infer it from absence: absent currently also means "outside the rendered window",
   and the two must not be conflated.
2. Add a `muted?: number[]` prop to `Fretboard`.
3. Render a marker row above the nut, only when the window includes fret 0 or 1:
   `×` at each muted string, `o` at each string present in the shape at fret 0.
   Reserve the vertical space in the `viewBox` so nothing clips.
4. Include the markers in the board's `aria-label`: *"…low E muted, D and G open."*

**Acceptance.** `tests/theory.test.mjs`:

```js
test("every chord declares which strings are silent", () => {
  for (const chord of CHORDS) {
    const played = new Set(chord.fingering.map((n) => n.s));
    const muted = new Set(chord.muted);
    for (let s = 1; s <= 6; s += 1) {
      assert.ok(played.has(s) !== muted.has(s),
        `${chord.symbol}: string ${s} is both played and muted, or neither`);
    }
  }
});
```

Plus a render assertion in `tests/rendered-html.test.mjs` that `/chords/c-major`
contains a mute marker.

**Done when.** `/chords/a-major` shows `×` over the low E, and `/chords/d-major` shows
`×` over both the low E and the A.

---

### - [x] FL-03 — Repair generated barre voicings
**Status:** `DONE` · **Severity:** Blocker · **Audit ref:** F-01

**Files:** `lib/fretlab/theory.ts:100-135` (`chordIntervals`, `chordVoicing`)

**Problem.** Three independent bugs in one function. Verified output:

```
E       want [0,4,7]      got [1,5,8]     sounds F     <- barre forced off fret 0
Em      want [0,3,7]      got [1,4,8]     sounds Fm
E7      want [0,4,7,10]   got [1,5,8,11]  sounds F7
Asus2   want [0,2,7]      got [0,5,7]     is a sus4    <- grip and interval set disagree
Bdim    want [0,3,6]      got [0,4,7]     is B major   <- falls through to the major shape
```

**Required change.**

1. **Barre root.** `rootFret` is `Math.max(1, keyPc(root) - OPEN_PC[6] + …)`, which
   forces an E-rooted chord onto fret 1. Compute it as
   `((keyPc(chord.root) - OPEN_PC[6]) + 12) % 12` and allow fret 0. A shape at fret 0
   is the open E form and is correct.
2. **Diminished.** The offsets ternary has no `Diminished` branch, so it falls to the
   major shape. Add one. The 6th-string diminished form is
   `[0, 1, 2, 0, x, x]` — note it is a four-string shape, so `chordVoicing` must be
   able to return fewer than six notes and mark the rest muted.
3. **Suspended.** `chordIntervals` returns `[0, 2, 7]` (sus2) while the barre offsets
   `[0, 2, 2, 2, 0, 0]` are a sus4 grip. Split the quality into `Sus2` and `Sus4`,
   give each its own interval set (`[0,2,7]` / `[0,5,7]`) and offsets
   (`[0,2,4,4,0,0]` / `[0,2,2,2,0,0]`), and retag `Asus2` in the library.
4. If the E-shape lands above fret 9, prefer the A-shape rooted on string 5 — that is
   what a player would actually use, and it keeps the shape inside the visible neck.

**Acceptance.** `tests/theory.test.mjs`:

```js
test("a generated voicing is the chord it claims to be", () => {
  for (const chord of CHORDS) {
    for (const voicing of ["Barre", "Triad"]) {
      const notes = chordVoicing(chord, voicing);
      const want = [...chordIntervals(chord)].sort((a, b) => a - b);
      const got = [...new Set(notes.map(
        (n) => (((OPEN_PC[n.s] + n.f - keyPc(chord.root)) % 12) + 12) % 12,
      ))].sort((a, b) => a - b);
      assert.deepEqual(got, want, `${chord.symbol} ${voicing}`);
    }
  }
});
```

**Done when.** The assertion passes for all 16 chords in both generated voicings.

---

### - [x] FL-04 — Derive the chord fret window from the voicing
**Status:** `DONE` · **Severity:** Blocker · **Audit ref:** F-01

**Files:** `app/_screens/ChordDetail.tsx:33` (`range`)

**Problem.** `range` is hardcoded to `[1, 7]` for Barre and `[4, 12]` for Triad, but
generated barre shapes land wherever their root is:

```
C       frets  8-10   visible 0/6   BLANK BOARD
D       frets 10-12   visible 0/6   BLANK BOARD
D7      frets 10-12   visible 0/6   BLANK BOARD
Cmaj7   frets  8-10   visible 0/6   BLANK BOARD
Bm      frets  7-9    visible 4/6   CLIPPED, shown as if whole
Bdim    frets  7-9    visible 3/6   CLIPPED, shown as if whole
```

A clipped board is worse than a blank one: it renders as a complete, playable, wrong
chord with nothing indicating notes are missing.

**Required change.** Compute the window from the notes being drawn:
`low = max(0, min(frets) - 1)`, `high = max(frets) + 1`. Keep a minimum span of 4
frets so a compact shape does not render as a sliver. Do the same for the Open
voicing rather than assuming `[0, 4]`.

**Acceptance.** `tests/theory.test.mjs`:

```js
test("every voicing fits the window it is drawn in", () => {
  for (const chord of CHORDS) {
    for (const voicing of ["Open", "Barre", "Triad"]) {
      const notes = voicing === "Open" ? chord.fingering : chordVoicing(chord, voicing);
      const [low, high] = windowFor(notes);          // export this from ChordDetail's helper
      for (const note of notes) {
        assert.ok(note.f >= low && note.f <= high,
          `${chord.symbol} ${voicing}: fret ${note.f} outside window ${low}-${high}`);
      }
    }
  }
});
```

Extract `windowFor` into `lib/fretlab/` so the test can reach it without importing a
screen (the boundary lint will otherwise reject it).

**Done when.** Every chord renders a visible, complete shape in all three voicings.

---

### - [x] FL-05 — Spell notes from the key, not from a sharps table
**Status:** `DONE` · **Severity:** Major · **Audit ref:** F-02

**Files:** `components/fretlab/Fretboard.tsx:28-29`, `lib/fretlab/theory.ts`

**Problem.** The board holds one sharps-only array and indexes it by pitch class,
while `majorScale()` in `theory.ts` already does correct letter-based spelling. The
two disagree on the same screen — the Scale degrees panel writes B♭ while the board
directly above it writes A♯.

| Key | Correct (already computed) | What the board draws |
|---|---|---|
| F | F G A **B♭** C D E | F G A **A♯** C D E |
| B♭ | **B♭** C D **E♭** F G A | **A♯** C D **D♯** F G A |
| E♭ | **E♭** F G **A♭ B♭** C D | **D♯** F G **G♯ A♯** C D |
| D♭ | **D♭ E♭** F **G♭ A♭ B♭** C | **C♯ D♯** F **F♯ G♯ A♯** C |

Five of the twelve keys are flat keys. A learner told the key of F contains both A♯
and B has been taught something they must later unlearn: a key uses each letter
exactly once, which is the entire reason accidentals exist.

**Required change.**

1. Export a `spellPitchClass(pc, key)` helper from `theory.ts` that looks the pitch
   class up in `majorScale(key)` first and falls back to the sharps table only for
   chromatic notes outside the key — and for those, follow the key's accidental
   direction (flat keys get flats).
2. `Fretboard` takes the spelled names via that helper instead of `NOTE_NAMES[pc]`.
3. Same fix for `INTERVALS` at line 28: the labels are fixed to a flat spelling, so
   Lydian's defining ♯4 is labelled ♭5 — the characteristic note of the scale is
   labelled as belonging to a different scale. Derive degree labels from the scale's
   own `formula` string, which the `SCALES` entries already carry.

**Acceptance.** `tests/theory.test.mjs`:

```js
test("a key spells each letter exactly once", () => {
  for (const key of FIFTHS) {
    const letters = majorScale(key).map((n) => n[0]);
    assert.equal(new Set(letters).size, 7, `${key}: ${majorScale(key).join(" ")}`);
  }
});

test("the board spells notes the way the key does", () => {
  for (const key of FIFTHS) {
    for (const note of majorScale(key)) {
      assert.equal(spellPitchClass(pcOf(note), key), note);
    }
  }
});
```

**Done when.** `/keys/current` in F shows B♭ on both the board and the degree table.

---

### - [x] FL-06 — Remove the pre-filled answers in Train
**Status:** `DONE` · **Severity:** Blocker · **Audit ref:** B-02

**Files:** `app/_screens/Train.tsx:34`

**Problem.** `const solved = () => new Set(notes.slice(0, -1)...)` — the drill opens
with every target already found except the last one. "Find every root across frets one
to seven" is a single tap. Worse, `accuracy` is `found.size / (found.size + misses)`,
so it starts at 86–100% before the user acts, and `record()` writes that to
`practice_sessions` as a measured result. The Progress screen, which correctly shows
only real data, is fed synthetic near-perfect accuracy on the first session.

**Required change.**

1. Start with an empty set: `useState<Set<string>>(new Set())`.
2. Change `accuracy` to first-attempt correctness: count a target as correct only if
   it was hit before any miss on that target. Hit count over total taps is not
   accuracy.
3. Remove the position hints. `Fretboard` currently draws a dashed circle at every
   unfound target, so even without the pre-fill the exercise shows you where the notes
   are and asks you to tap them — there is no recall step. Add a `hideTargets` prop;
   the drill prompts for a note by name and the board starts blank.
4. Record a per-note response time alongside accuracy. On a fretboard, recall *speed*
   is the metric that matters; hit count is not.

**Acceptance.** A render test asserting the initial found count is 0, and:

```js
test("a fresh training module has nothing found", () => {
  // initial state derived from the module, not from the note list
  assert.equal(initialFound(TRAINING_MODULES[0], "G").size, 0);
});
```

**Done when.** Opening `/train` shows `0/7 found` and a blank neck.

---

### - [x] FL-07 — Delete every fabricated number
**Status:** `DONE` · **Severity:** Blocker · **Audit ref:** U-04

**Files:** `app/_screens/Today.tsx:22-56`, `app/_screens/Train.tsx:180`,
`app/_screens/Runner.tsx:59`, `app/_screens/Guided.tsx:41`,
`app/_screens/Progress.tsx:39,46,188-195`, `app/_screens/Routines.tsx:43,48`,
`components/fretlab/BottomNav.tsx:62`, `app/_sections/LibraryLaunchpad.tsx`

**Problem.** `Today.tsx` greets a brand-new account with a **31 day streak**, a
hardcoded "Thursday", "Good evening" regardless of time, a week bar of invented
minutes, and 18 minutes / 4 drills / 84 bpm — none read from anything. `BottomNav`
shows a hardcoded `68 / 90 min` weekly goal. `Train` shows a static `0:24` next to two
live figures. `Runner` and `Guided` both show a literal `02:18`. `Progress` hardcodes
its month axis to `Mar Apr May Jun Jul Aug`, wrong on all but a few days of the year,
and clips its accuracy chart to a 55–95% band with no clamping, so a beginner scoring
40% draws a line outside the SVG.

The README states the principle correctly and `Progress` and `DrillHistory` honour it.
Nothing else does.

**Required change.** Every number either comes from a query or does not render.

- `Today` reads real sessions through `usePracticeSessions` and derives the greeting
  and day from the clock. With no history it shows the four-state empty case naming
  the action that fills it, exactly as `Progress` already does.
- Remove the static clocks in `Train`, `Runner` and `Guided`. `Train` already tracks
  `startedAt`; render that.
- `Progress`: derive the month labels from the 26-week range, and clamp the chart's
  y-scale to the data's actual range with labelled axis bounds.
- `BottomNav`'s weekly goal either becomes real or is removed. Prefer removed — there
  is no goal-setting feature to back it.
- `LibraryLaunchpad`'s "5 modules" and "Eleven sounds" are hardcoded beside a
  `SCALES.length` that is correct; make them all derived.

> A fabricated streak is worse than an empty state. It tells a first-time user that
> the numbers in this app are decorative, which retroactively devalues the real ones
> on Progress.

**Acceptance.** A test that greps the screen sources for numeric literals inside JSX
text nodes and fails on any outside an allowlist. Blunt, but this class of bug has
recurred across every screen and needs a mechanical guard:

```js
test("screens render no hardcoded figures", () => {
  for (const file of screenSources()) {
    const matches = file.text.match(/>\s*\d[\d:.,]*\s*</g) ?? [];
    assert.deepEqual(matches, [], `${file.path}: ${matches.join(", ")}`);
  }
});
```

**Done when.** A fresh account sees no number it did not create.

---

### - [x] FL-08 — Write `tests/theory.test.mjs`
**Status:** `DONE` · **Severity:** Blocker · **Audit ref:** entire theory section

**Files:** `tests/theory.test.mjs` (new)

**Problem.** This is the root cause of every other Stage 1 task. The suite has
`boundaries.test.mjs` proving the architecture lint fires, and `fingering.test.mjs`
covering drill spans — and not one assertion that a scale is spelled correctly or that
a chord contains its own root. Typecheck is clean and 52/52 tests pass with every bug
above present. Each blocker would have been caught by a handful of assertions.

**Required change.** Create the file in the house style — `node:test`, `assert/strict`,
`await import("../lib/fretlab/…")`. Collect the assertions written into FL-01 through
FL-05 plus:

```js
test("every scale formula matches its intervals", () => { /* parse formula -> semitones */ });
test("every chord's stated notes match its shape", () => { /* chord.notes vs sounded pcs */ });
test("every chord's formula matches its intervals", () => { /* chord.formula vs chordIntervals */ });
test("every song's progression names chords that exist", () => { /* SONGS -> CHORDS by symbol */ });
test("every routine step names a drill that exists", () => { /* see FL-10 */ });
test("a drill's intervals are a subset of the scale it claims", () => { /* name vs content */ });
```

**Acceptance.** The file runs in `npm run test:unit`, and temporarily reverting any
Stage 1 fix makes it fail.

**Done when.** Every Stage 1 task above has a corresponding assertion here, and you
have verified each one fails against the pre-fix code.

---

## Stage 2 — Make the practice loop real

**Goal:** the app can be practised with, not just read. Do not start before Stage 1 is
`DONE`.

**Progress:** 0 / 7 done

| ID | Task | Status |
|---|---|---|
| FL-09 | Audio metronome on the Web Audio clock | `TODO` |
| FL-10 | Routine steps become drill ids | `TODO` |
| FL-11 | Runner renders the real drill and records a session | `TODO` |
| FL-12 | Scale position tables (CAGED) | `TODO` |
| FL-13 | Fix the key-scoped streak | `TODO` |
| FL-14 | Give drills patterns instead of pitch-class sets | `TODO` |
| FL-15 | Tuner | `TODO` |

---

### - [ ] FL-09 — Audio metronome on the Web Audio clock
**Status:** `TODO` · **Severity:** Blocker · **Audit ref:** B-03

**Files:** `lib/fretlab/audio.ts`, `app/_screens/Runner.tsx:46-52`,
`app/_screens/Guided.tsx`, `app/_sections/DesktopPracticeStudio.tsx`

**Problem.** The metronome is four `<i>` elements with a CSS `animation-delay`. There
is no `AudioContext` anywhere except `audio.ts`, which only plays chord tones. A
silent, CSS-timed metronome is not a metronome: CSS animation clocks drift against the
audio clock, and changing BPM restarts the phase rather than continuing it.

This matters disproportionately because every drill carries a `bpm` and states its
goal in note values — "Four even eighth-note passes", "Stay aligned for eight bars",
"Four clean sixteenth-note bars". The content is written for a metronome the app does
not have.

**Required change.** Implement the standard Web Audio lookahead pattern: a `setInterval`
at ~25ms that schedules any beat falling within the next ~100ms against
`AudioContext.currentTime`. Never schedule from `setTimeout` directly.

- One long-lived `AudioContext`, created on the first user gesture and `resume()`d —
  iOS Safari requires this and `audio.ts` currently does neither.
- Accented downbeat, subdivisions (♩ ♪ ♫ triplets), a count-in, and a tap-tempo input.
- Changing BPM mid-run adjusts the next scheduled beat; it does not reset the bar.
- Keep the CSS pulse as the *visual* readout, driven from the audio clock.

**Acceptance.** Unit-test the scheduler against a fake clock: at 120 BPM, 8 beats are
scheduled at 0.5s intervals ±1ms; changing to 60 BPM after beat 3 leaves beats 1–3
untouched and spaces the rest at 1.0s.

**Done when.** A metronome you can practise to, audible on iOS Safari.

---

### - [ ] FL-10 — Routine steps become drill ids
**Status:** `TODO` · **Severity:** Major · **Audit ref:** G-03

**Files:** `lib/fretlab/library.ts` (ROUTINES), `app/_screens/RoutineDetail.tsx`,
`app/_screens/Routines.tsx`

**Problem.** `ROUTINES` lists steps as free-text names — "Open string check", "Locate
every D", "Free play over a drone", "Sixths on the top two". **None of these exist in
`DRILLS`**; the last is a near-miss for "Sixths on the top strings". With no id, a
routine step cannot open its drill, render its shape, or be scored. This is the
structural reason the runner does nothing, and it makes FL-11 impossible until it is
fixed.

Routine steps also carry their own `key`, which fights the app-wide stored key with
nothing resolving the conflict.

**Required change.**

```ts
drills: [{ drillId: "position-one", mins: 4, phase: "warm" }]
```

Either map each existing step name onto a real drill or author the missing drills.
"Open string check", "Free play over a drone" and "Open chord changes" describe real
exercises worth having — prefer authoring them over deleting the routine.

Decide explicitly whether a routine's key overrides the global key or inherits it, and
say so in the UI. Recommendation: a routine declares a key and the UI shows
"Practising in A — your key is G" with a one-tap switch.

**Acceptance.** In `tests/theory.test.mjs`:

```js
test("every routine step names a drill that exists", () => {
  for (const routine of ROUTINES)
    for (const step of routine.drills)
      assert.ok(DRILLS.some((d) => d.id === step.drillId),
        `${routine.name}: no drill "${step.drillId}"`);
});
```

**Done when.** Every routine step resolves, and the assertion guards it permanently.

---

### - [ ] FL-11 — Runner renders the real drill and records a session
**Status:** `TODO` · **Severity:** Blocker · **Audit ref:** B-03, G-04

**Files:** `app/_screens/Runner.tsx`, `app/_screens/Guided.tsx`,
`app/_screens/Summary.tsx`, `app/_screens/Progress.tsx:85-90`

**Problem.** `Runner.tsx` ignores every input. The drill title is a hardcoded string,
the notes are always `scaleShape(key, 1, 5)`, the step bar is always "step 2 of 4",
and "Finish session" records nothing. Starting *any* routine from *any* screen shows
the same drill.

The knock-on: `Progress`'s empty state says "Start a routine" → Routines → Runner →
records nothing. A new user who follows the app's own instruction watches their
progress screen stay empty forever. The only screen that writes a session is `Train`.

**Required change.** Depends on FL-10.

- `Runner` takes the routine and a step index as props and renders that drill's real
  name, shape, key and BPM.
- The step bar reflects the real position; the clock counts real elapsed time against
  the step's `mins`.
- Finishing records one `practice_session` per step with what was actually measured:
  `duration_seconds`, `bpm`, `drill_id`, `music_key`. **Do not invent an accuracy** —
  the runner is a timer and has nothing to measure. Leave the column null; `Progress`
  already handles null accuracy.
- `Summary` reports the recorded session rather than static copy.
- Until this lands, point `Progress`'s empty-state action at `train`, which does
  record.

**Acceptance.** Integration test: run a routine to completion, assert one session row
per step with the right `drill_id` and a plausible `duration_seconds`, and that
`accuracy` is null rather than fabricated.

**Done when.** Completing a routine makes the Progress screen change.

---

### - [ ] FL-12 — Scale position tables (CAGED)
**Status:** `TODO` · **Severity:** Major · **Audit ref:** G-02

**Files:** `lib/fretlab/library.ts` (SCALES), `lib/fretlab/fingering.ts:34,50-70`,
`app/_screens/ScaleLibraryDetail.tsx`

**Problem.** Scales are pitch-class sets rendered by flooding a fret window with every
matching note. Guitarists do not learn scales that way — they learn five CAGED shapes
or seven three-notes-per-string patterns, anchored on a root, with defined shifts
between them.

Consequences: "Pentatonic box one" is a name the app cannot honour, because
`bestBox()` picks the window containing the *most notes*, which is not box one and
need not contain a root at all. And "Three-note-per-string run" is structurally
impossible — `BOX_SPAN = 3` constrains box drills to four frets, while 3nps needs six.
The fingering engine contradicts the drill's entire premise.

**Required change.** Add a `positions` table per scale: for major and both
pentatonics, five shapes each with its root string, fret offset from the root, and the
per-string note count. Then:

- `drillShape` selects a *named position* rather than the densest window.
- `BOX_SPAN` becomes a property of the position, not a global constant, so a 3nps
  shape can declare a six-fret span.
- Scale detail gains a position selector and a "connect to the next position" drill.

This is the highest-value data addition in the plan: it unlocks position drills,
shifting drills and the whole CAGED curriculum, and it is the thing a guitar learner
most expects to find.

**Acceptance.** Every declared position contains at least one root; every position's
span matches its declared fret count; the five major-scale positions together cover
every scale tone between frets 0 and 12 with no gaps.

**Done when.** `/scales/major-pentatonic` offers boxes 1–5 and each is the shape a
guitarist would recognise.

---

### - [ ] FL-13 — Fix the key-scoped streak
**Status:** `TODO` · **Severity:** Major · **Audit ref:** G-04

**Files:** `app/_screens/Progress.tsx:33`, `lib/api/progress.ts`

**Problem.** `usePracticeSessions({ limit: 100, musicKey: selectedKey })` filters by
key, and then the streak, the consistency graph and the totals are all computed from
that filtered set. Practise daily in a different key each day and the app shows a
streak of 1. The streak is the primary retention mechanic in this category and it is
wrong by construction. `limit: 100` against a 26-week graph will also silently blank
old squares for an active user.

**Required change.** Query all sessions for streak, consistency, active days and rep
totals. Scope only the accuracy figures to the selected key, and label them as
key-scoped so the distinction is visible. Page the query or add a server-side
aggregate rather than truncating at 100.

**Acceptance.** `lib/api/progress.ts` is already pure and testable:

```js
test("a streak counts days, not keys", () => {
  const sessions = [day(0, "G"), day(1, "C"), day(2, "D")];
  assert.equal(summarise(sessions).streakDays, 3);
});
```

**Done when.** Practising in three different keys on three consecutive days shows a
3-day streak.

---

### - [ ] FL-14 — Give drills patterns instead of pitch-class sets
**Status:** `TODO` · **Severity:** Major · **Audit ref:** F-03

**Files:** `lib/fretlab/library.ts` (DRILLS), `lib/fretlab/fingering.ts`

**Problem.** Drills store flat pitch-class sets, which cannot express a *pattern*.
Intervallic exercises are sequences, not note collections, and six drills teach
something other than their name:

| Drill | Stored | What it actually is |
|---|---|---|
| Thirds through the shape | `[0,4,7,11]` | A maj7 arpeggio. Thirds means 1–3, 2–4, 3–5 … through the scale. |
| Sixths on the top strings | `[0,4,9]` | A major-6 chord. Sixths are dyads on non-adjacent strings. |
| I–IV–V chord-tone map | `[0,4,5,7,11]` | Missing the 3rd of IV and the 5th of V. |
| Relative minor bridge | `[0,2,4,7,9]` | The major pentatonic — identical to "Pentatonic box one". |
| Diatonic seventh arpeggios | `[0,2,4,5,7,9,11]` | The whole major scale. No arpeggio is distinguishable. |
| Major to Mixolydian | `[0,2,4,5,7,9,10]` | Mixolydian only; the ♮7 it says to compare against is never drawn. |

**Required change.** Add a `pattern` to the drill shape — an ordered list of
scale-degree pairs, or a small generator (`thirds`, `sixths`, `arpeggioSequence`,
`modeCompare`). Render the sequence with the existing `withPlayOrder` path so the
board shows the route rather than a field of dots.

For the mode-comparison drill use `NoteGroup` with `emphasis: "primary" | "secondary"`
from `noteRoles.ts` — it exists, is built for exactly this two-layer comparison, and is
currently unused.

**Acceptance.** In `tests/theory.test.mjs`, assert each drill's generated sequence
against a hand-checked expected first eight notes in the key of C.

**Done when.** "Thirds through the shape" draws thirds.

---

### - [ ] FL-15 — Tuner
**Status:** `TODO` · **Severity:** Major · **Audit ref:** competitive gap table

**Files:** new `lib/fretlab/pitch.ts`, new screen

**Problem.** Table stakes. Every competitor ships one free, and it is the reason people
open a guitar app on a weekday. FretLab has no microphone input at all.

**Required change.** Autocorrelation pitch detection over `getUserMedia` — about 80
lines. Show the detected note, cents deviation, and a per-string target for standard
tuning, reading the string pitches from the same `OPEN_PC` table the board uses so
alternate tunings (FL-19) come free.

Handle permission denial and no-microphone as first-class states, not as errors.

**Acceptance.** Feed recorded reference tones for all six open strings; assert the
detected pitch is within 2 cents.

**Done when.** It tunes a real guitar.

---

## Stage 3 — Make it shippable to real people

**Goal:** the app is usable by people who are not you. Largely parallel to Stage 2.

**Progress:** 0 / 6 done

| ID | Task | Status |
|---|---|---|
| FL-16 | Grid keyboard navigation and a screen-reader pass | `TODO` |
| FL-17 | Rem type scale, 16px floor, stand mode | `TODO` |
| FL-18 | Mobile IA: promote Library, reflow the hidden regions | `TODO` |
| FL-19 | Left-handed mirroring and alternate tunings | `TODO` |
| FL-20 | Dark theme | `TODO` |
| FL-21 | Onboarding | `TODO` |

---

### - [ ] FL-16 — Grid keyboard navigation and a screen-reader pass
**Status:** `TODO` · **Severity:** Blocker · **Audit ref:** U-01

**Files:** `components/fretlab/Fretboard.tsx:166,340-350`, `app/globals.css`

**Problem.** The board wrapper carries `role="img"` with an aria-label. In ARIA,
`role="img"` makes every descendant presentational — so the 78 `role="button"` cells
inside it are not exposed at all. The entire Train exercise is unreachable by
assistive technology and the careful per-cell aria-labels are dead code.

Keyboard is no better: `tabIndex` on an SVG `<g>` is unreliable in Safari, and
`.fret-hit` has a `:hover` rule but no `:focus-visible`. Across all 7,900 lines of CSS
there are **three** `focus-visible` declarations.

**Required change.**

- Drop `role="img"` when `interactive` is set; use `role="grid"` with
  `role="row"`/`role="gridcell"`.
- Arrow-key navigation with a single roving `tabindex` — 78 tab stops to reach one
  note is unusable regardless of what is exposed.
- A visible focus ring on `.fret-hit`, and an audit pass adding `:focus-visible` to
  every interactive element in `globals.css`.
- Keep `role="img"` for non-interactive boards; that part is correct.

**Acceptance.** An automated pass (axe-core against the rendered routes) plus a manual
VoiceOver run through `/train` recorded in the commit message. Automation will not
catch the `role="img"` swallow — a human has to listen to it.

**Done when.** `/train` is completable with a keyboard alone and announces sensibly in
VoiceOver.

---

### - [ ] FL-17 — Rem type scale, 16px floor, stand mode
**Status:** `TODO` · **Severity:** Major · **Audit ref:** U-03

**Files:** `app/globals.css`, `tests/rendered-html.test.mjs`

**Problem.** 194 of 379 `font-size` declarations are 12px or 13px, and a test enforces
12px as the floor. Every size is a fixed pixel value — `clamp()` appears twice in 7,900
lines and `rem` is essentially unused, so the browser's text-size preference does
nothing.

The domain makes this worse than usual. A phone propped on a music stand or resting on
the guitar's upper bout sits 60–80cm from the eye, not the 30–40cm a 12px body size
assumes. This audience also skews older than average. 12px is the wrong floor: it
should be the exception, not the default.

**Required change.** Rebase onto a rem scale with a 16px body minimum. Update the
existing "nothing ships below 12px" test to assert 16px for body copy and 13px for
true captions and nothing smaller. Add a **stand mode** toggle that scales the board,
its labels and the surrounding type up — competitors charge for this.

**Acceptance.** The revised size test, plus a zoom check at 200% with no clipping.

**Done when.** Readable at arm's length from a music stand.

---

### - [ ] FL-18 — Mobile IA: promote Library, reflow the hidden regions
**Status:** `TODO` · **Severity:** Major · **Audit ref:** U-02

**Files:** `app/globals.css:498-505`, `components/fretlab/BottomNav.tsx`,
`lib/fretlab/routes.ts`

**Problem.** One CSS rule sets `display:none` on twelve `.desktop-*` regions, restored
only above 900px. Phone users lose the practice studio, the drill tools, the progress
range selector, the train guide, the key relations panel, the routine summary and the
progress insight tiles — the last being the feature the README showcases.

It also breaks navigation. The bottom bar has four tabs: Today, Learn, Practice,
Theory. Chords, Scales, Songs and the Key map live **only** in
`.desktop-library-nav`. On a phone the path to the chord library is Theory → a link to
Keys → LibraryLaunchpad → Chords: three levels deep, through a tab labelled "Theory"
and a screen called "Keys". For a beginner, the chord library *is* the product.

The labels are also inverted: "Learn" opens drills, which are practice; "Practice"
opens Train, which is where you learn the neck.

**Required change.** This is not responsive design, it is two apps with one hidden.
Reflow the desktop regions into mobile sheets, accordions or a secondary tab rather
than deleting them. Restructure the tabs to **Today · Practice · Library · Progress**
and rename the views to match what they contain.

**Acceptance.** A test asserting every top-level library route is reachable within two
taps from the mobile tab bar, and that no `.desktop-*` region is `display:none`
without a mobile equivalent.

**Done when.** A phone user finds the chord library without being told where it is.

---

### - [ ] FL-19 — Left-handed mirroring and alternate tunings
**Status:** `TODO` · **Severity:** Major · **Audit ref:** competitive gap table

**Files:** `lib/fretlab/theory.ts:26` (`OPEN_PC`), `components/fretlab/Fretboard.tsx`

**Problem.** `OPEN_PC` is a hardcoded standard-tuning map and the board's string order
is fixed. Roughly 10% of players are left-handed, and Drop D, half-step-down and DADGAD
are ordinary requests. Both are frequently the deciding factor in a store review.

Note that `SONGS` already stores a `capo` field ("2nd fret" for Stand by Me) which
nothing reads — capo transposition is the same mechanism.

**Required change.** Make tuning a setting: an array of six pitch classes *with
octaves* (the current map is pitch-class only, which is also why audio can't place
notes in the right register — see FL-22). Left-handed is a coordinate flip in the
board plus reversed string order. Wire the existing `capo` field to offset the
rendered fret numbers.

**Acceptance.** In Drop D, the low string's fret 0 spells D and the D major scale's
roots land where a Drop D player expects.

**Done when.** A left-handed player in Drop D sees a correct board.

---

### - [ ] FL-20 — Dark theme
**Status:** `TODO` · **Severity:** Minor · **Audit ref:** U-06

**Files:** `app/globals.css`, `lib/fretlab/palette.ts`,
`components/fretlab/Fretboard.tsx`

**Problem.** Zero `prefers-color-scheme` queries. Practising at night, on a stage or in
a rehearsal room is the normal case in this category.

**Required change.** The palette is already tokenised through `cssVars()`, so this is
mostly a second token set plus the three-state light/dark/system pattern. Fold in the
27 raw hex literals in `Fretboard.tsx` — the README claims "no raw hex in components"
and they are the reason that claim is false. The board is already dark, so the harder
half exists.

**Acceptance.** Extend the existing "uses the paper theme and key-color token system"
test to assert no raw hex in `components/`, and snapshot both themes.

**Done when.** The app respects the OS setting and offers an explicit override.

---

### - [ ] FL-21 — Onboarding
**Status:** `TODO` · **Severity:** Major · **Audit ref:** beginner walkthrough

**Files:** new screen, `lib/fretlab/useStoredKey.ts`

**Problem.** A new user lands on Today with a fabricated streak (FL-07) and the biggest
button on screen starts a drill they did not choose, in the key of G, using a scale
they have never seen. The default key is a constant.

**Required change.** A short first-run flow: what can you already play, what do you
want to work on, right- or left-handed. Pick the first key and the first routine from
the answers. Someone who can play G, C and D should not be started in G major scale
position one — start them on chord changes.

**Acceptance.** A render test for the first-run route and that it is skipped for
returning users.

**Done when.** The first session is chosen for the user, not defaulted.

---

## Stage 4 — Retention and revenue

**Goal:** reasons to come back. Ongoing; sequence by what the data says.

**Progress:** 0 / 5 done

| ID | Task | Status |
|---|---|---|
| FL-22 | Real guitar audio tied to the displayed shape | `TODO` |
| FL-23 | Spaced repetition | `TODO` |
| FL-24 | Ear training | `TODO` |
| FL-25 | Drones and backing tracks | `TODO` |
| FL-26 | Minor keys and a larger chord library | `TODO` |

---

### - [ ] FL-22 — Real guitar audio tied to the displayed shape
**Status:** `TODO` · **Severity:** Minor · **Audit ref:** G-05

**Files:** `lib/fretlab/audio.ts`

**Problem.** `playTones()` synthesises sine and triangle waves from a fixed MIDI 48
base using abstract intervals. It does not use the voicing being displayed, so an open
C and a barre C at fret 8 sound identical, and neither is in the octave a guitar would
put them in. It also constructs a new `AudioContext` on every call — browsers cap
concurrent contexts — and never calls `resume()`, which iOS Safari requires.

**Required change.** Depends on FL-09's shared context and FL-19's octave-aware tuning
map. Derive pitches from the displayed shape's actual string and fret (string 6 open is
E2, MIDI 40). Add a plucked-string voice — a small sample set, or Karplus–Strong, which
is ~30 lines and removes the "this is not a guitar" impression immediately. Strum with
a small inter-string delay rather than simultaneously.

**Done when.** Hearing a chord matches seeing it.

---

### - [ ] FL-23 — Spaced repetition
**Status:** `TODO` · **Severity:** Major · **Audit ref:** competitive gap table

**Problem.** No adaptive review. Every competitor at the paid tier has some form of it,
and it is the mechanism that makes daily practice produce results.

**Required change.** Per-item scheduling (SM-2 or a simple leech-aware variant) over
note locations, chord changes and intervals. The hard part — per-session accuracy in a
real table — already exists; this is the payoff for FL-06 recording honest scores.
Surface it as "Today's review: 12 items".

**Done when.** The app decides what to practise and is right.

---

### - [ ] FL-24 — Ear training
**Status:** `TODO` · **Severity:** Major

**Required change.** Interval and chord-quality recognition, reusing the note-role
system so what you hear is labelled with the same vocabulary as what you see. Depends
on FL-22 for credible audio.

---

### - [ ] FL-25 — Drones and backing tracks
**Status:** `TODO` · **Severity:** Major

**Required change.** A drone in all twelve keys (synthesised, no licensing) and simple
I–IV–V / ii–V–I backing loops. The "Free play over a drone" routine step already
assumes this exists.

---

### - [ ] FL-26 — Minor keys and a larger chord library
**Status:** `TODO` · **Severity:** Major · **Audit ref:** F-04

**Problem.** `KeyName` is twelve major keys. "House of the Rising Sun" is stored as
`key: "A"` with Am–C–D–F–E — it is in A minor, and every palette, degree table and
scale overlay treats it as A major. The Chord tones training module drills 1–♭3–5–♭7
against the selected *major* root, so "Key of C" silently means Cm7, which is not in
C major. And the diatonic chords of B major are rooted on C♯, D♯, F♯, G♯ and A♯ — five
roots `KeyName` cannot represent, so a degree table in B cannot link to any chord page.

**Required change.** Split the concept: a `tonic` (pitch class plus letter spelling)
and a `mode`. Expand `CHORDS` to roughly 60. Revisit `library.ts:729`, where chord
difficulty is derived from array index — F major sits at index 5 and is labelled
Beginner alongside G, C and D, while the first-fret F barre is the single most common
point at which beginners quit. Author `level` per chord and add the Fmaj7 and
four-string F as the stepping stones, which is how F is actually taught.

---

## Before distribution

Not code, but blocking for release. Not tracked as tasks — decisions for you, not the
agent.

- **Song content.** Titles, artists and chord progressions are safe; progressions are
  not copyrightable and neither are titles. The moment you add lyrics, tab or audio you
  need mechanical and print licensing (NMPA / Harry Fox in the US). Separately, stop
  pairing named artists with generic stock photos — `/guitar-stage.jpg` next to
  "Fleetwood Mac" reads as an implied association.
- **The README.** It is unusually candid and that is a genuine asset, but it currently
  claims token discipline the code breaks (27 raw hex literals in `Fretboard.tsx`) and
  describes the runner as "a timer, not a scorer" when it is neither. Update it as
  FL-07, FL-11 and FL-20 land. If this doubles as a portfolio piece, an inaccurate
  honesty section costs more than the gaps it admits to.
- **`db:migrate`** still targets a D1 database named `site-creator-d1`, left over from
  another project.

---

## Appendix A — Chord fingerings

Authored data for FL-01 and FL-02. `finger`: 0 = open, 1 = index, 2 = middle,
3 = ring, 4 = pinky. `muted` lists strings that must not sound. String 1 is the high e.

| Chord | Shape | Fingering (s:f→finger) | Muted |
|---|---|---|---|
| G major | `320003` | 6:3→2, 5:2→1, 4:0→0, 3:0→0, 2:0→0, 1:3→3 | — |
| C major | `x32010` | 5:3→3, 4:2→2, 3:0→0, 2:1→1, 1:0→0 | 6 |
| D major | `xx0232` | 4:0→0, 3:2→1, 2:3→3, 1:2→2 | 6, 5 |
| A major | `x02220` | 5:0→0, 4:2→1, 3:2→2, 2:2→3, 1:0→0 | 6 |
| E major | `022100` | 6:0→0, 5:2→2, 4:2→3, 3:1→1, 2:0→0, 1:0→0 | — |
| F major | `133211` | 6:1→1, 5:3→3, 4:3→4, 3:2→2, 2:1→1, 1:1→1 | — |
| E minor | `022000` | 6:0→0, 5:2→2, 4:2→3, 3:0→0, 2:0→0, 1:0→0 | — |
| A minor | `x02210` | 5:0→0, 4:2→2, 3:2→3, 2:1→1, 1:0→0 | 6 |
| B minor | `x24432` | 5:2→1, 4:4→3, 3:4→4, 2:3→2, 1:2→1 | 6 |
| D7 | `xx0212` | 4:0→0, 3:2→2, 2:1→1, 1:2→3 | 6, 5 |
| Cmaj7 | `x32000` | 5:3→3, 4:2→2, 3:0→0, 2:0→0, 1:0→0 | 6 |
| G7 | `320001` | 6:3→3, 5:2→2, 4:0→0, 3:0→0, 2:0→0, 1:1→1 | — |
| A7 | `x02020` | 5:0→0, 4:2→1, 3:0→0, 2:2→3, 1:0→0 | 6 |
| E7 | `020100` | 6:0→0, 5:2→2, 4:0→0, 3:1→1, 2:0→0, 1:0→0 | — |
| Asus2 | `x02200` | 5:0→0, 4:2→1, 3:2→2, 2:0→0, 1:0→0 | 6 |
| Bdim | `x2343x` | 5:2→1, 4:3→2, 3:4→4, 2:3→3 | 6, 1 |

Notes on the choices, so they are not "corrected" back:

- **G major** is given as 2–1–3. The 3–2–4 fingering is equally standard and better
  prepares a change to C; either is defensible, neither may put one finger on two
  strings. If you switch, switch the whole library consistently.
- **F major** is a full six-string barre: index across fret 1, ring on the A string,
  pinky on the D string, middle on the G string. FL-26 adds the easier four-string
  form as a stepping stone.
- **B minor** barres fret 2 with the index across strings 5–1. This is the one chord
  in the library where two strings legitimately share finger 1, and FL-01's
  contiguity check is written to permit exactly that case.
- **A7, E7 and Asus2** are fingered as one-finger lifts from A major and E major
  respectively, which is how each chord's `tip` field already describes them. Keep the
  data and the prose in agreement.
- **Bdim** mutes the high e as well as the low E. It is the only four-string shape in
  the library, which is why `chordVoicing` must be able to return fewer than six notes
  (FL-03).

---

## Execution log

**Stage 1 — complete.** Branch `fretlab-remediation`, seven commits on top of a
`baseline: FretLab app as audited` commit that captured the previously
uncommitted app so the work has a rollback point and a readable diff.

| Commit | Covers |
|---|---|
| `238b7cb` | FL-01, FL-02 |
| `48f5cc8` | FL-03, FL-04 |
| `9fd9070` | FL-05 |
| `2909083` | FL-06 |
| `942b02c` | FL-07 |
| `460dbeb` | FL-08 |

`npm run typecheck`, `npm run lint` and `npm test` are green: 73 tests, up from
52, with 21 of the new ones in `tests/theory.test.mjs`. Checked out against the
baseline commit, 11 of those 20 theory assertions fail — the verification FL-08
asked for.

### Three things worth knowing before Stage 2

1. **A test found a real design hole.** "A generated voicing is the chord it
   claims to be" failed on D7 Triad: three strings cannot hold a seventh chord,
   and the old code fell through its search to an arbitrary slice of the neck.
   The fix is `voicingIntervals`, which drops the fifth and says so — the shell
   voicing. That decision was previously an accident.

2. **The purity lint shaped the clock work.** `react-hooks` rejects reading
   `Date.now()` during render *and* calling `setState` in an effect body, which
   is why three screens had frozen strings instead of clocks. `useClock`
   (`useSyncExternalStore`, matching `useStoredKey`) and `useElapsed`
   (subscription callback) are the two shapes that satisfy it. Reuse them rather
   than reaching for `Date.now()` in FL-09 and FL-11.

3. **Two fabrications survived a manual pass.** `ScaleLibraryDetail` rendered
   "72 percent learned" on every scale, and `Progress` had a 26-week figure in an
   aria-label. The mechanical guard in `screens render no hardcoded figures`
   caught both after I had already read those files. Keep that test.

### Scope notes

- `DRILLS` lost its baked-in `progress` field. `lastAccuracyByDrill` replaces it,
  so a drill shows progress only where the player recorded some. FL-12 and FL-14
  touch the same records.
- `Runner`'s invented step bar and "1 of 4" are gone rather than fixed. The screen
  cannot know its position until routine steps carry drill ids (FL-10), so FL-11
  restores a real one.
- Chord `level` is still derived from array index. That is FL-26's, left alone.
