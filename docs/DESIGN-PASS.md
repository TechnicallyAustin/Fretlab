# Design pass — audit and plan

## Status

| | Task | |
|---|---|---|
| FD-00 | Land the working tree | `DONE` |
| FD-01 | Fretboard legibility | `DONE` — step 2 open as FD-05 |
| FD-02 | Contribution graph | `DONE` |
| FD-03 | Delete `Guided` | `DONE` |
| FD-04 | Board density | `CLOSED` — premise was wrong, nothing to do |
| FD-05 | A full neck that fits a phone | `PARTIAL` — opens on the notes; still scrolls |

Tracked alongside `docs/REMEDIATION-PLAN.md`; the same working loop in
`docs/HANDOFF.md` applies to both.


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

**Status:** `DONE` · **Severity:** Blocker

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

**Status:** `DONE` · **Severity:** Blocker · **Reported:** "This fretboard is too
small to see."

**Files:** `components/fretlab/Fretboard.tsx` (geometry + type sizes),
`app/globals.css` (`.fretboard svg`)

**Measured, at `HEAD`, in the 390px app frame (354px content column):**

| Board | viewBox | Renders at | Scale | Note label on screen |
|---|---|---|---|---|
| **Full neck 0–12** | 711u | 520px | **0.73** | **8.0px** |
| Drill box, 4 frets | 246u | 354px | 1.44 | 15.8px |
| Chord shape, 5 frets | 279u | 354px | 1.27 | 14.0px |

**8 pixels.** That is the reported defect, and it is one board: the full neck.
Box and chord boards are fine. On desktop, where the column is ~1100px, the full
neck scales *up* to 18.6px and is also fine. The failure is specific — a
13-fret board on a narrow viewport — which is why it survived a manual pass.

**Root cause: the readability floor is enforced in the wrong coordinate space.**
Three sizes are clamped to a minimum:

```ts
const fretNumberSize = Math.max(mini ? 11 : 13, Math.round(gap * 0.44));
const stringNameSize = Math.max(mini ? 11 : 13, Math.round(gap * 0.42));
const labelSize      = Math.max(mini ? 10 : 12, Math.round(dotRadius * 0.95));
```

Those are **viewBox units, not pixels.** The SVG is then scaled to fit its
container and the floor scales with it. The code believes it guarantees 12–13px;
it guarantees 12–13 *units*, which at scale 0.73 are 8–9 screen pixels. A floor
that does not survive scaling is not a floor.

`--board-min` is `frets × 40` = 520px for a 13-fret board — far below its 711u
natural width, so the board is free to shrink to 0.73. `--board-natural` is
computed at `HEAD` and **never used**: the CSS is `width: 100%`.

**The fix is to make the scale never drop below 1.** If the SVG is never
rendered narrower than its natural width, a 13-unit glyph is 13 pixels by
construction, and the clamps above become true:

```
--board-min: <natural viewBox width>px   /* not frets × 40 */
width: 100%                              /* scale up freely, never down */
```

Then `scale = max(container, natural) / natural ≥ 1`, always.

That alone trades the illegibility for a horizontal scroll: 711px of neck in a
354px window. Which is the second half of the change — **stop putting 13 frets on
a phone.** At legible size only about six frets fit a 354px column
(`30 + n × 54 ≤ 354`), so the full-neck views need a reduced default window on
narrow viewports with paging along the neck, not a shrunken whole.

**Also fix, lower severity:** the uncommitted work wires `--board-natural` up as
`width: min(100%, var(--board-natural))` with the multiplier tightened to 1.15.
That caps a 4-fret box at 335px inside a ~1100px desktop column — 70% of the
width unused. The stated reason is wrong:

```
// A four-fret box must not stretch across a wide card: that pulls the
// frets apart until the shape stops looking like the shape.
```

It cannot. The `viewBox` is fixed and `preserveAspectRatio="xMidYMid meet"`, so
widening scales frets, dots and labels together — nothing is pulled apart. The
real risk of a wide box is a board *taller* than the viewport, so bound the
**height** (a board should not exceed ~45vh) and let width follow.

**Acceptance.** A test that computes rendered scale per board configuration at
360px, 390px and 1280px and asserts no glyph lands below 13px on screen. The
existing `Math.max(13, …)` clamps do not test this and cannot.

**Done when.** The root dot on a full neck is identifiable at arm's length on a
phone.

---

## FD-02 — The contribution graph reads as a row, not a week

**Status:** `DONE` · **Severity:** Major · **Reported:** "should have M, TU, W,
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

**Status:** `DONE` · **Severity:** Major · **Carried from Stage 2**

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

**Status:** `CLOSED — premise was wrong` · **Severity:** Minor

**What I claimed.** That "compact" had been read as "smaller" in three places:
`.contribution-days` at 12px, board labels below 13px once scaled, and
`DrillDetail` rendering **three** fretboards on one screen with `ChordDetail`
rendering two.

**The first two were real and are fixed** by FD-00 and FD-01.

**The third was my error.** I counted `<Fretboard` occurrences per *file*, not
what renders together. They are on different tabs:

| Screen | Boards in file | Visible at once |
|---|---|---|
| `DrillDetail` | 3 | **2** — the shape board, plus one per tab |
| `ChordDetail` | 2 | **1** — one per tab |

So the acceptance I wrote — "no screen renders more than two boards at once" —
was already met before I wrote it. There is no density defect here, and
rebuilding these screens to fix one would have been change for its own sake.

The related worry, that an overflowing board clips silently, is also already
handled: `.fretboard` carries a visible thin scrollbar, added with the comment
*"A board that has to scroll says so, rather than silently clipping."*

**Nothing to do.** Left in the document rather than deleted, because a claim
that was investigated and withdrawn is worth more to the next reader than a
gap.

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

---

## FD-05 — A full neck that fits a phone

**Status:** `PARTIAL` · **Severity:** Major · **Was:** FD-01 step 2

**Problem.** FD-01 fixed legibility by never scaling a board below its own
width. The full 0–12 board is 860 units and a phone column is 354, so it is now
legible **and scrolls 2.4 screens**. That is the right trade — a legible board
you scroll beats an 8px one you do not — but it is not the finished answer.

At legible size about five frets fit a 354px column:

| Frets | Natural width | Fits 354px? |
|---|---|---|
| 0–4 | 332u | yes |
| 0–6 | 464u | no |
| 0–12 | 860u | no, by 2.4× |

Four callers render a 0–12 board: `DesktopPracticeStudio`, `DrillDetail`,
`ChordDetail`, `TheoryHubContent`.

**Three options, in order of preference.**

1. **Stack the neck across two rows on narrow viewports** — frets 0–6 above,
   7–12 below. Everything stays visible, legible, and needs no interaction. Most
   work: the SVG geometry has to wrap.
2. **A fret-window control** — "0–5 / 5–10 / 7–12", built on the CAGED regions
   FL-12 already names, so the control teaches that the neck has regions instead
   of merely paging it. Moderate work; needs a viewport hook, and the codebase
   has that pattern four times over (`useStoredKey`, `useClock`, `lastRun`,
   `GuitarSetup`).
3. **Scroll to what matters** — leave the scroll but start it on the drill's own
   window rather than at the nut. Cheapest; least teaching value.

**Do not** solve it by shrinking type. That is the defect FD-01 just removed.

**Acceptance.** Extend `tests/board-legibility.test.mjs`: at 324px and 354px, no
board's natural width exceeds the container. That assertion fails today, which
is the honest statement of what is left.

**Done when.** A beginner can see the whole neck on a phone without scrolling,
at readable size.

> **Option 3 taken, options 1 and 2 still open.** An overflowing board now
> opens centred on its own notes rather than at the nut, so a drill at frets
> 7–10 no longer opens on an empty stretch of board with the lesson off the
> right-hand edge. Clamped to both ends, and a board that fits is never
> scrolled at all.
>
> This is the cheapest of the three and it does not close the task: the neck
> still needs scrolling to see whole. It was chosen over stacking the neck
> across two rows because that means teaching the SVG geometry to wrap —
> every y-coordinate, the nut, the inlays, the string lines and the keyboard
> navigation — in a 600-line component with tests pinned to its current
> layout. That is a refactor with its own risk of regressions, and it should
> be its own task rather than a rider on a fingering fix.
>
> The scroll target is a pure function, so it is tested: the notes land inside
> the visible column, the board never scrolls past its own edges, and a board
> with room to spare stays where it is.

---

# Execution plan

Five tasks, in this order, each ending green and in its own commit. FD-00 gates
everything; FD-01 and FD-02 are independent of each other after it; FD-03 and
FD-04 are cleanup and can slip without blocking anything.

Estimated: FD-00 under an hour, FD-01 the bulk of the work, the rest short.

| # | Task | Blocks | Risk | Touches |
|---|---|---|---|---|
| FD-00 | Land the working tree | everything | **High** — 43 files of someone else's work | whole tree |
| FD-01 | Fretboard legibility | — | Medium — geometry + a new test | `Fretboard.tsx`, `globals.css` |
| FD-02 | Contribution graph | — | Low | `Today.tsx`, `globals.css`, `progress.ts` |
| FD-03 | Delete `Guided` | — | Low | routes, types, tests |
| FD-04 | Board density | FD-01 | Low — editorial | `DrillDetail.tsx` |

---

## FD-00 — Land the working tree

**This is a decision before it is a task, and it is not mine to make.** The tree
holds 43 modified files and 3 untracked paths from another agent, and the suite
is red. There are three ways out and they differ in what gets thrown away:

| Option | What happens | When it is right |
|---|---|---|
| **A — Finish it** (recommended) | Fix the one 12px rule, commit the lot as-is | The work is wanted. It is: it contains the `RoutineDetail` routeId fix and the contribution grid rebuild. |
| **B — Split it** | Commit the graph and `RoutineDetail` separately, revert the fretboard cap | Cleaner history, but 43 files is a lot to triage by hand |
| **C — Stash it** | `git stash`, start from `HEAD` | Only if the work is unwanted |

**Recommended: A.** The uncommitted work is mostly good — it fixes
`RoutineDetail`'s hardcoded routine and rebuilds the contribution graph in the
right shape. Its one clear regression, the fretboard width cap, is superseded by
FD-01 anyway, so splitting it out buys nothing.

**Steps**

1. `app/globals.css` → `.contribution-days` → `font-size: .75rem` becomes
   `.8125rem` (12px → 13px). This is the only thing making the suite red.
2. `npm run typecheck && npm run lint && npm test` — expect green, 173 tests.
3. Commit everything as one commit, described as what it is: the tail of Stage 3
   plus a post-audit revision. Do not claim it fixes the fretboard.

**Acceptance.** `git status` clean; full suite green.

---

## FD-01 — Fretboard legibility

Two changes. The first is the fix; the second is what stops the fix from
becoming a scrollbar.

### Step 1 — Make the scale never drop below 1

In `Fretboard.tsx`, `--board-min` currently approximates the natural width with
`frets × 40`. Replace it with the real one, which is already computed:

```ts
// `width` is the viewBox width in units. Rendering narrower than this scales
// the type below its own floor, so it is the floor.
["--board-min" as string]: `${width}px`,
```

In `globals.css`, keep `width: 100%` so the board still scales *up*, and drop
the `min(100%, var(--board-natural))` cap the working tree adds. Replace the cap
with a height bound, which is the constraint that actually exists:

```css
.fretboard svg {
  width: 100%;
  min-width: var(--board-min, 0);
  max-height: 45vh;      /* a wide box may not become a tall one */
  height: auto;
}
```

After this, `scale ≥ 1` for every board, so the `Math.max(13, …)` clamps mean
what they say.

### Step 2 — Stop putting 13 frets on a phone

At legible size roughly six frets fit a 354px column. The four callers that render a 0–12 board —
`DesktopPracticeStudio`, `DrillDetail`, `ChordDetail` and `TheoryHubContent` —
should pass a narrower window on narrow viewports and let the learner move along
the neck.

Prefer a **fret-window control** over horizontal scroll: a scrollbar hides the
fact that there is more neck, whereas "frets 0–5 / 5–10 / 7–12" tells a beginner
the neck has regions, which is a thing worth teaching. The CAGED positions from
FL-12 already name those regions — use them rather than inventing ranges.

If that is too large for this pass, ship Step 1 alone: a legible board that
scrolls beats an illegible one that does not. Say so in the commit, and leave
Step 2 as its own task.

### Acceptance

A new test, because no existing one can catch this:

```js
test("no board renders type below 13px at any supported width", () => {
  for (const viewport of [360, 390, 1280]) {
    for (const board of BOARD_CONFIGS) {        // full neck, box, chord, mini
      const scale = renderedScale(board, viewport);
      assert.ok(scale >= 1 || board.labelUnits * scale >= 13,
        `${board.name} at ${viewport}px renders ${(board.labelUnits*scale).toFixed(1)}px`);
    }
  }
});
```

Export the geometry from `Fretboard.tsx` (or move it to a `boardGeometry.ts` in
`lib/fretlab/`) so the test can compute it without rendering. That extraction is
worth doing anyway — the geometry is pure arithmetic sitting inside a component.

**Verify by reintroducing the defect:** set `--board-min` back to `frets × 40`
and watch the new test fail at 360 and 390. Per `docs/HANDOFF.md`, a test that
has never failed is not known to test anything.

---

## FD-02 — Contribution graph

Most of this is already written in the uncommitted work and lands with FD-00.
What remains:

1. **Labels once, on the left.** Already done — `.contribution-days` is a
   left-hand column of five rows. Confirm after FD-00.
2. **13px minimum** — fixed as part of FD-00.
3. **Heading must match the data.** The section says "This week" over a grid of
   five weeks. Rename to "Practice" or "Last five weeks".
4. **Say that it is a workweek.** Five weekdays is a defensible editorial choice
   for a practice app — weekends are not failures — but it should be stated near
   the legend, not inferred from five unlabelled rows.

**Acceptance.** Extend `Today uses a contribution graph and fretboards keep
stable viewports`: assert each day label appears exactly once (not once per
column), that the column count equals the week count, and that no label is below
13px.

---

## FD-03 — Delete `Guided`

Unreachable since FL-11: zero screens link to it, and it still owns a `View`
member, a route, a page binding and test assertions.

1. Move the "up next" list into `Runner` — it is the one thing `Guided` does
   that `Runner` does not.
2. Delete `app/_screens/Guided.tsx` and `app/routines/guided/`.
3. Remove it from the `View` union (`types.ts`), `VIEW_PATHS` and
   `primaryViewFor` (`routes.ts`), and `DesktopTopbar`'s label map — where the
   key is unquoted (`guided: "Guided routine"`), so grep for both spellings.
4. Remove it from the route test's view list and from
   `ships every handoff screen`.

**Acceptance.** `grep -rn 'guided' app/ lib/ tests/` returns nothing; the route
test's view list is one shorter and still passes.

---

## FD-04 — Board density

Depends on FD-01, because "which board gets the width" is only answerable once
width is allocated properly.

`DrillDetail` renders three fretboards; `ChordDetail` two. Decide which single
board is the lesson on each screen, give it the space, and demote the rest to a
toggle or delete them.

**Acceptance.** No screen renders more than two boards at once, and every board
rendered clears FD-01's floor.

**This one is an editorial call, not a technical one** — it needs a view on what
the drill screen is *for* before code changes.

---

## Verification, every task

```
npm run typecheck && npm run lint && npm test
```

`npm run test:unit` while iterating. `npm test` before committing — the build is
what makes the server-render assertions real. The integration suite needs a live
server and skips silently without one; it also flakes under parallel load
against the shared local D1, so re-run a lone failure before believing it.

## Rollback

Every task is one commit, so `git revert <sha>` undoes any of them cleanly. The
exception is FD-00, which is a large commit of mixed work — if it has to come
out, it comes out whole.
