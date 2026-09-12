# Design pass — audit and plan

Audit of the app as it stands on 12 September 2026, at working-tree state (not
`HEAD` — see FD-00). Written to be executed the same way as
`docs/REMEDIATION-PLAN.md`: one task at a time, in ID order, each ending green
and in its own commit. `docs/HANDOFF.md` still governs how to work.

## The standard

Every task below is judged against four things, in this order. Where they
conflict, earlier wins.

1. **Musically accurate.** A wrong shape is a wrong lesson. This is settled
   ground — Stages 1 and 2 bought it and it is guarded by tests. No design
   change may cost it.
2. **Beginner friendly.** The reader does not yet know what a position is, or
   which dot is the root. Anything that needs prior knowledge to decode needs a
   label, a shape, or a caption.
3. **Highly usable.** Legible at the size it actually renders, reachable in two
   taps, and honest when it has nothing to show.
4. **Compact and functional.** Density is a feature; decoration is not. Compact
   means *more signal per pixel*, never *smaller type*.

> The fourth is the one that bites. Both live defects below come from something
> being made smaller to be made compact, which is the opposite trade.

---

## FD-00 — Land the working tree before anything else

**Status:** `TODO` · **Severity:** Blocker

**Problem.** The tree carries **43 modified files and 3 untracked paths**,
uncommitted, and **`npm test` is red**:

```
✖ text is readable: rem type stays at or above the 13px caption floor
  found text below 13px: 12        (.contribution-days, app/globals.css)
```

That is a half-finished revision of the two things this pass is about — the
contribution graph and board sizing — sitting on top of a `HEAD` that has
neither. Nobody can audit, review or revert it in that state, and the next
agent to run the suite will meet someone else's failure.

It also breaks the plan's own guardrail: *one task, one commit; the tree is
clean between tasks.*

**Required change.** Whoever wrote it finishes it: fix the 12px rule to 13px
(it is `.contribution-days`), get `npm run typecheck && npm run lint && npm test`
green, and commit. If the work is not finishable now, `git stash` it and start
from a clean `HEAD`. Do not build on top of it.

**Acceptance.** `git status` clean, full suite green.

---

## FD-01 — The fretboard is illegible at the size it renders

**Status:** `TODO` · **Severity:** Blocker · **Reported:** "This fretboard is too
small to see."

**Files:** `components/fretlab/Fretboard.tsx:154-162,209-217`, `app/globals.css`
(`.fretboard svg`)

**Problem.** Two separate faults, on two different viewports, with one root
cause between them.

**The root cause: the readability floor is enforced in the wrong coordinate
space.** Three sizes are clamped to a 13px minimum —

```ts
const fretNumberSize = Math.max(13, Math.round(gap * 0.44));
const stringNameSize = Math.max(13, Math.round(gap * 0.42));
const labelSize      = Math.max(13, Math.round(dotRadius * 0.95));
```

— but those are **viewBox units**, not pixels. The SVG is then scaled to fit its
container, and the floor scales with it. The code believes it guarantees 13px; it
guarantees 13 *units*, which become whatever the scale factor makes them.

**Fault A — scaling down destroys legibility.** The full 0–12 board is 860 units
wide. In the 390px phone frame the content column is 354px, and `--board-min`
(780px) forces a horizontal scroll:

| Board | Natural | Renders at | Scale | Label on screen |
|---|---|---|---|---|
| Full neck 0–12, phone frame | 860u | 780px | 0.91 | **11.8px** |
| Full neck 0–12, 680px card | 860u | 680px | 0.79 | **10.3px** |

Both are below the app's own 13px floor, and the second is below it by a
quarter. You also see 45% of the neck at a time through a 354px window.

**Fault B — scaling up is capped far too tightly.** `--board-natural` caps width
at `width × 1.15`, so on desktop, where `.screen-content` gives the main column
roughly 1100px:

| Board | Available | Renders at | Wasted |
|---|---|---|---|
| Drill box, 4 frets | ~1100px | **335px** | 70% |
| Chord shape, 5 frets | ~1100px | **382px** | 65% |
| Mini, 4 frets | ~1100px | **215px** | 80% |

**The justification for that cap is incorrect.** The code says:

```
// A four-fret box must not stretch across a wide card: that pulls the
// frets apart until the shape stops looking like the shape.
```

It cannot. The SVG has a fixed `viewBox` and `preserveAspectRatio="xMidYMid meet"`
with `height: auto`, so widening it scales *everything* uniformly — frets, dots
and labels together. Nothing is pulled apart. The cap prevents a distortion that
the geometry already makes impossible, and costs 70% of the width to do it.

**Required change.**

- Size type in **screen pixels, not viewBox units.** Either compute the scale and
  divide the font sizes by it, or move labels out of the SVG. A floor that does
  not survive scaling is not a floor.
- Replace the `× 1.15` width cap with a **height** bound. Uniform scaling means
  the only real risk of a wide box is a board taller than the viewport; bound
  that directly (a board should not exceed roughly 340px tall, or ~45vh) and let
  width follow.
- **Stop forcing a 13-fret board through a 354px window.** A full neck at legible
  type does not fit a phone. Either show fewer frets by default on narrow
  viewports and let the learner page along the neck, or split the board across
  two rows. Horizontal scroll is the third-best option and is what is shipping.

**Acceptance.** A test that computes the rendered scale for each board
configuration at three viewport widths (360, 390, 1280) and asserts no glyph
lands below 13px on screen. The existing `Math.max(13, …)` clamps do not test
this and cannot.

**Done when.** The root dot on a full neck is identifiable at arm's length on a
phone, and a four-fret box on desktop uses the width it has.

---

## FD-02 — The contribution graph reads as a row, not a week

**Status:** `TODO` · **Severity:** Major · **Reported:** "should have M, TU, W,
Tr F on the side not on the top"

**Files:** `app/_screens/Today.tsx:118-146`, `app/globals.css`
(`.contribution-*`), `lib/api/progress.ts`

**Problem.** At `HEAD` the graph is five cells in a single row, each with its own
label beneath it:

```jsx
{contributionLevels.map((level, index) =>
  <div className="contribution-day">
    <span className={`level-${level}`} />
    <small>{["Mon","Tue","Wed","Thu","Fri"][index]}</small>
  </div>)}
```

That is one week of five days with the days labelled per column — so it carries
five data points, has no second axis, and cannot show a trend. Calling it a
contribution graph sets an expectation (GitHub's) that it then does not meet.

The uncommitted work rebuilds it as a 5-week × 5-weekday grid with the labels in
a left-hand column, which is the right shape. It is unfinished: the labels are
12px, which is what makes the suite red (FD-00).

**Required change.** Finish the grid, and finish it properly.

- Weekdays are **rows**, labelled once on the left. Weeks are columns.
- Labels at 13px minimum, like everything else.
- Five weekdays is a defensible editorial choice — this is a practice app and
  weekends are not failures — but it must be *stated*, not implied. The heading
  says "This week"; it is showing five.
- The heading and the legend should agree with the data: if the grid is five
  weeks, do not head it "This week".

**Acceptance.** Extend the existing `Today uses a contribution graph and
fretboards keep stable viewports` test: assert day labels appear exactly once
each (not once per column), that the grid has as many columns as weeks, and that
no label is below 13px.

**Done when.** A month of practice is visible as a shape, and the labels sit
beside the rows they name.

---

## FD-03 — Delete `Guided`

**Status:** `TODO` · **Severity:** Major · **Carried from Stage 2**

**Problem.** `Guided` is a second runner: hardcoded to `ROUTINES[1]`, records
nothing, and **unreachable** — no screen links to it since FL-11 pointed
`RoutineDetail`'s primary action at the real runner. It still owns a view in the
union, a route, a page binding and assertions that keep it alive.

Dead code that tests assert the existence of is worse than dead code: it reads
as load-bearing.

**Required change.** Delete the screen, its route, its `View` member and its
bindings. Move anything it does better than `Runner` (the "up next" list is
worth keeping) into `Runner` first.

**Acceptance.** `"guided"` appears nowhere in `lib/fretlab/`, `app/` or `tests/`.
The route test's view list shrinks by one and still passes.

**Done when.** There is one runner.

> `RoutineDetail`'s hardcoded `ROUTINES[1]`, the other half of this item, **is
> fixed** in the uncommitted work — it takes a `routineId` and has a
> `app/routines/[routineId]/` binding. Confirm it lands with FD-00.

---

## FD-04 — Make density earn its name

**Status:** `TODO` · **Severity:** Minor

**Problem.** "Compact" has been read as "smaller" in at least three places, which
trades usability for pixels rather than buying it:

- `.contribution-days` at 12px (FD-02)
- board labels below 13px once scaled (FD-01)
- `DrillDetail` renders **three** fretboards on one screen; `ChordDetail` renders
  two. Each is capped small by FD-01's rule, so the screen is dense with boards
  that are individually too small to read — the worst of both.

**Required change.** Density comes from removing what does not carry signal, not
from shrinking what does. On `DrillDetail`, decide which single board is the
lesson and give it the width; demote the others to a toggle or remove them.

**Acceptance.** No screen renders more than two boards at once, and every board
that renders is above the FD-01 legibility floor.

**Done when.** A beginner can tell, at a glance, which board to look at.

---

## Not defects — confirmed working

Checked during this audit and deliberately left alone:

- Musical accuracy holds. 173 tests, and the position, pattern, pitch and theory
  suites all pass on the working tree. The one failure is CSS.
- `RoutineDetail` now takes a routine id (uncommitted).
- Alternate tunings and left-handed boards propagate through the board, the
  generated music and the tuner (FL-19).
- Theme modes, stand mode and the rem type scale are in (FL-17, FL-20).

## Still open from the Stage 2 log

- Position tables cover 3 of 11 scales; the other 8 use a sliding window,
  labelled honestly. Not a defect, but the gap grows as scales get used.
- The integration suite contends on the shared local D1 under `npm test`.
- The tuner is unverified against a real guitar.
