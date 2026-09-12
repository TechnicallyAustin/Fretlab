# Handoff — continuing the FretLab remediation

You are picking up a remediation that is half done. `docs/REMEDIATION-PLAN.md` is
both the specification and the tracker; this file is how to work on it.

**Stages 1 and 2 are complete. Stage 3 is next, starting at FL-16.**

Read this file, then read the plan's **Status**, **How to use this document** and
**Guardrails** sections, then the one task you are about to do. Do not read all
twenty-six tasks up front — they are long, and the plan is explicit that tasks
are done one at a time.

---

## The loop

One task at a time, in ID order, each ending in its own commit.

1. **Read the task.** It names its files, its problem, its required change, its
   acceptance test and its "done when".
2. **Set its status to `WIP`** in the plan, and update the stage's Progress
   table in the same edit.
3. **Implement it.**
4. **Write its acceptance test**, then **verify the test by breaking the code it
   guards** — reintroduce the original defect, watch the test fail, restore.
   This is not optional and it is not ceremony: four of the five defects found
   in Stage 2 that the audit had missed were found by writing a test, and a test
   that has never failed is not known to test anything.
5. **Verify green:** `npm run typecheck && npm run lint && npm test`.
6. **Update the plan** — status `DONE`, tick the checkbox, update Progress, and
   add a short `> **Done.**` note under the task saying what you actually did,
   anything you found, and anything you deliberately did not do.
7. **Commit**, one task per commit, message starting `FL-NN: `.

If a task turns out to be wrong, blocked, or much larger than described, set it
`BLOCKED`, write a `> **Blocked:**` note saying why, and move to the next one.
Do not silently skip and do not silently expand.

### When you find something the plan did not list

You will. Stage 2 turned up five. Write it up under the task that exposed it,
fix it in its own commit if it is not part of the task in hand, and add it to
the stage's execution log at the end of the plan. Do not fold an unrelated fix
into a task's commit.

---

## Verifying

| Command | What it does | Notes |
|---|---|---|
| `npm run test:unit` | Every test, no build | Fast. Use this while iterating. |
| `npm test` | Builds, then every test | Slow. The build is what makes the server-render tests real. Run before committing. |
| `npm run typecheck` | `tsc --noEmit` | |
| `npm run lint` | eslint, including the boundary rules | |
| `npm run test:integration` | Against a live server | Needs `npm run setup && npm run dev` in another terminal. Skips cleanly with no server, so a green `npm test` does **not** mean these ran. |

**Known flake:** `npm test` runs the integration suite in parallel with
everything else, and with a dev server up they contend on the shared local D1. A
write test fails maybe one run in five and passes on its own. Re-run before
believing it; do not "fix" it by weakening an assertion.

---

## What this codebase enforces mechanically

Most of the rules below are enforced by lint or by a test, and several exist
because the exact mistake has already shipped once. Where a rule has a guard,
the guard is named — if you find yourself wanting to change one of those tests,
re-read the guardrail about not weakening tests first.

### No invented numbers

The single rule the audit found broken most often. If a figure is not derived
from stored data, it does not render. An empty state naming the action that
fills it is always correct; a plausible placeholder never is.

- Guard: `screens render no hardcoded figures` in `tests/theory.test.mjs`.
- That guard greps JSX text nodes, so it **cannot** see a number that reaches the
  screen through library data. That is exactly how `completed: 3` survived
  FL-07. Check data as well as markup.

### Never read the clock during render

Every date helper in `lib/api/progress.ts` takes `now: number` as a **required**
argument. There are no `Date.now()` defaults and there must not be.

- Screens get the clock from `useClock()`, which returns `now: number | null` —
  null until the client has one, because the server has neither the user's clock
  nor their timezone.
- Guard the render with `typeof now !== "number"`, **not** `now === null`. A
  stale module hands back `undefined`, which `=== null` does not catch; that
  crashed the Today screen with "Invalid time value".
- `assertClock()` refuses a bad clock at `startOfToday` with a message naming
  the fix.
- Guards: `no date helper reads the wall clock by default`, `no screen tests its
  clock with an identity check`, `nothing clock-derived is server-rendered on
  Today`.

### Browser state goes through `useSyncExternalStore`

The `react-hooks` lint rejects reading `Date.now()` during render, calling
`setState` in an effect body, and reading a ref during render. The three shapes
that satisfy it are already here — copy one rather than inventing a fourth:

- `useStoredKey` — localStorage, shared across tabs.
- `useClock` — the wall clock, hour-granular.
- `lastRun.ts` — sessionStorage, read once.
- `useElapsed` — a subscription callback, for a running timer.

A create-once mutable object (the metronome scheduler) goes in `useState` with a
lazy initialiser, not a ref, because the render reads it.

### Layer boundaries

`eslint-plugin-boundaries` enforces `L1 → L2 → L3`, and `lib/fretlab/` may
import nothing but itself. L2 and L3 may not import `next/navigation`. If a fix
seems to need a boundary crossing, it needs a different design.

- Guard: `tests/boundaries.test.mjs`, which also writes a deliberate violation
  and asserts the lint rejects it.

### Do not touch the API contract

The wire format, error envelope, idempotency and pagination are out of scope.
Adding a column is fine; changing the envelope is not. `drizzle-kit generate`
hangs in this environment — hand-write migration SQL to match `db/schema.ts`.

### Text has a 12px floor

Guard: `text is readable: nothing ships below 12px`. It will catch an 11px label
in new CSS. It caught one of mine.

### Keep the visual identity

The cream paper palette, the key-hue system and the note-role shape language are
the product's strongest assets. Fix their bugs; do not redesign them.

---

## The music has to be right

This is a teaching app, so a wrong shape is a wrong lesson. Music data is
hand-written and therefore machine-checked. The pattern to copy when you add
more:

- **Check the data against theory, not against itself.** Every note of every
  scale position is asserted to be in the scale; every chord fingering is
  asserted playable by one hand.
- **Find an independent cross-check where one exists.** The strongest assertion
  in `tests/positions.test.mjs` is that a major pentatonic box must be the same
  physical shape as the next minor pentatonic box up — two separately typed
  tables agreeing is what catches a plausible typo in either.
- **Work expectations by hand in C**, where no accidental can hide a mistake.
  `tests/patterns.test.mjs` does this throughout.

---

## Where things live

```
lib/fretlab/          domain logic; imports nothing but itself
  theory.ts           pitch classes, spelling, intervalShape, OPEN_PC
  library.ts          DRILLS, ROUTINES, CHORDS, SCALES, SONGS + accessors
  positions.ts        CAGED / box tables for 3 scales          (FL-12)
  patterns.ts         what a drill is played as: cells, chords, compare (FL-14)
  fingering.ts        drill -> playable shape, spans, play order
  metronome.ts        pure scheduler; no Web Audio in it       (FL-09)
  useMetronome.ts     the lookahead loop                       (FL-09)
  audio.ts            the one shared AudioContext, unlock()
  pitch.ts            NSDF pitch detection                     (FL-15)
  useTuner.ts         microphone capture and its four states   (FL-15)
  lastRun.ts          what the runner recorded, for Summary    (FL-11)
  useClock.ts         the wall clock, as an external store
lib/api/progress.ts   every figure Progress and Today show; pure, clock passed in
app/_screens/         L1 — owns data and layout
app/_sections/        L2 — composes L3, never fetches
components/fretlab/   L3 — pure presentation
```

Two things about `library.ts` that will bite you:

- `DRILLS` is `as const`, so it is a union of literal types and only some members
  have a `pattern` key. Read it through `drillPattern(drill)`, not `drill.pattern`.
- `ROUTINES` steps are typed `drillId: DrillId`, so a mistyped id is a **build
  error** as well as a test failure. Keep it that way.

---

## Before you start Stage 3

Four things are carried forward, logged at the end of the plan rather than
fixed. FL-18 touches mobile IA and will collide with the first two:

1. **`Guided` is a dead second runner** — hardcoded to one routine, records
   nothing, unreachable since FL-11. Merge into `Runner` or delete it with its
   view, route and assertions.
2. **`RoutineDetail` hardcodes `ROUTINES[1]`** — `/routines/current` shows the
   same routine whichever card you opened. Needs an id in its route.
3. **Position tables cover three scales**; the other eight use a sliding window,
   labelled honestly. FL-19 (alternate tunings) reads `OPEN_PC`, which both the
   fretboard and the tuner already derive from.
4. **The tuner is unverified against a real guitar.** Detection is good to
   better than 0.01 cents on synthesised tones, which is a different claim.

---

## Commit style

Say what was broken, why it mattered, and what the fix does — in prose, in the
body. The existing log is the reference; `git log` on this branch reads as the
explanation of the work. Start with `FL-NN: ` and a lowercase imperative
summary. End with the trailer:

```
Co-Authored-By: <your model name> <noreply@anthropic.com>
```

Do not push without asking. As of this handoff the branch is `main` with an
`origin` remote, and there are unpushed commits.
