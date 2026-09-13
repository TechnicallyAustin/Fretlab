# Handoff — after the September 2026 audit

Read this, then `docs/AUDIT-2026-09.md`, then the plan you are working from.
`docs/HANDOFF.md` still describes how to work here and has not been superseded;
this adds what changed and what to do next.

## Where things stand

| | |
|---|---|
| `docs/REMEDIATION-PLAN.md` | Stages 1–3 complete. **Stage 4 is 2 of 5** — FL-24, FL-25, FL-26 remain. |
| `docs/DESIGN-PASS.md` | Complete, FD-00 to FD-07. |
| `docs/AUDIT-2026-09.md` | **New.** Ten findings, priority-ordered at the end. |
| Branch | `main`, pushed to `origin`. Tree clean. |
| Suite | 221 tests, 208 passing, **13 skipped**. |

**All ten findings were worked on 13 September; see the status table at the top
of the audit.** §10 is open and needs a real guitar. §7 is improved, not closed.
Stage 4's FL-24, FL-25 and FL-26 are next.

The note below stood while §1 was open and is kept because the reasoning still
applies to any future feature that adds practice without adding scoring:

> **Do the audit's top three before Stage 4.** FL-24 (ear training) and FL-25
(drones) both add ways to practise, and the audit's first finding is that the
app cannot score most of what it already offers. Adding more unscored practice
widens the gap rather than closing it.

## The three lists, and which to add to

There are now three documents and it matters which one a finding goes in:

- **`REMEDIATION-PLAN.md`** — the original audit's specification and tracker.
  Add to it only if you are working a numbered FL task.
- **`DESIGN-PASS.md`** — defects found by *using* the app. Three of its entries
  were faults in work the plan had already marked `DONE`.
- **`AUDIT-2026-09.md`** — this audit's findings. They are numbered `§1`–`§10`
  rather than given task ids, because most are not one task.

If you find something new, put it where its *evidence* came from: reading,
using, or measuring. The split exists because those three have consistently
found different kinds of defect.

## What this audit measured, so you can re-measure it

Every number in the audit came from a command, not a recollection. The useful
ones to re-run:

```bash
# Which modules no test imports (the §2 finding)
for f in lib/fretlab/*.ts lib/api/*.ts; do
  grep -rqF "$(basename "$f")" tests/ || echo "$f"
done

# Dead CSS classes (§5) — allow for template-built names like state-notice-${tone}
# See the audit for the script; a literal grep gives false positives.

# Skipped tests hiding behind a green run (§4)
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail|skipped)"
```

> **Check the tree, not the last commit message.** The note in `CLAUDE.md` from
> the previous audit claimed the board sizing and the weekday layout were
> fixed. Neither was: the board was still drawing labels at 8 screen pixels.
> Both claims were plausible and both were wrong.

## Conventions worth knowing that the first handoff does not cover

These were all learned the hard way during the work this audit follows.

### One rule, one place

The single most productive finding of the last two months: **fingering was
computed in four places and three were wrong.** Contrast ramps were defined
twice and both were wrong the same way. The inverse of a rule counts as a copy —
`fingersUsed` derived a fret as `boxLow + finger - 1`, which is the numbering
rule written backwards, and it diverged the moment the rule changed.

When you find duplicated arithmetic, unify it before fixing either copy.

### Test the ratio, not the clamp

The board clamped its type to a 13px minimum and drew it at 8 pixels. The clamp
was in **viewBox units** and the SVG was then scaled. Every assertion about the
clamp passed.

A value is only safe if the test measures it in the units the user sees. Where a
defect lives in the *relationship* between two coordinate spaces, extract the
arithmetic to `lib/` so a test can reach both sides — that is why
`boardGeometry.ts` and `hand.ts` exist as separate modules.

### Guards must be seen to fail

Break the code, watch the test fail, restore. Every guard added since Stage 2
was verified that way, and two of them turned out to be testing nothing until
they were.

### An assertion can encode the bug

Four assertions were rewritten during this work, not weakened:

- two in `fingering.test.mjs` enforced the global `BOX_SPAN` that FL-12 removes;
- one pinned `--board-natural`, the width cap FD-01 deletes;
- one pinned `${low}` in a caption that must now describe the *visible* window.

If an assertion fails because the code got better, say so in the commit message.
That is the guardrail's explicit escape hatch and it has been used four times.

### The clock is a required argument

Never `Date.now()` during render. Date helpers take `now: number`; screens get it
from `useClock()` and guard with `typeof now !== "number"` — **not** `=== null`,
which misses the `undefined` a stale module hands back.

## Where the bodies are

- `lib/fretlab/library.ts` is 1,084 lines and holds all content. `DRILLS` is
  `as const`, so read optional fields through accessors (`drillPattern`), not
  directly.
- `components/fretlab/Fretboard.tsx` is 664 lines and does a great deal:
  geometry, windowing, keyboard grid, five label modes, layers, left-handed
  mirroring. Its pure arithmetic now lives in `lib/fretlab/boardGeometry.ts`;
  move more out rather than adding in.
- `app/globals.css` is 8,586 lines. Adding to it is easy and finding things is
  not. Check for an existing class first; there are already two ramps and two
  `.fret-window`-ish names that collided.

## If you are starting now

The audit's priority list, restated as work:

1. **Make more drills scorable** (audit §1). `Train`'s tap-the-targets scoring
   works for any drill with a shape. This unblocks Progress, FL-23's review
   queue, and most of Stage 4's value.
2. **Test the hooks** (§2). Start with `useClock` and `useStoredKey` — both have
   external-store semantics that are easy to get subtly wrong and have already
   caused two browser crashes.
3. **Report skips** (§4). Make `npm test` fail, or at least shout, when the
   integration suite skips.
4. **Route-level error boundary** (§7).
5. Then Stage 4: FL-24, FL-25, FL-26.
