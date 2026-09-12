# FretLab

A guitar practice app. Next on Cloudflare Workers (vinext), D1 via Drizzle.

## If you are here to work on the remediation

There is an audit-driven remediation in progress. **Read `docs/HANDOFF.md`
first** — the working loop, how to verify, and the conventions this codebase
enforces through lint and tests. Then `docs/REMEDIATION-PLAN.md`, which is both
the specification and the progress tracker: read its Status section, then the
one task you are about to do.

Stages 1–3 are complete.

There is a second, shorter list in `docs/DESIGN-PASS.md`: defects found by
*using* the app rather than reading it. Its tasks take priority over Stage 4,
because they are faults in work already shipped. FD-05 is the one still open.

> A September 12 note here claimed that audit had corrected fretboard sizing and
> the weekday activity layout. It had not. The board was still drawing its note
> labels at 8 screen pixels, and the activity graph was still a single row of
> five cells. Both are fixed now, in FD-01 and FD-02. The lesson is the one the
> handoff already makes: **verify against the tree, not against the last commit
> message.**

Update whichever plan you are working from as you go. Between them they are the
only record of the current state.

## Verifying

```
npm run typecheck && npm run lint && npm test
```

`npm run test:unit` skips the build and is what to use while iterating.
`npm run test:integration` needs a live server (`npm run setup && npm run dev`)
and skips silently without one, so a green `npm test` does not mean it ran.

## Three rules that are easy to break

1. **No invented numbers.** If a figure is not derived from stored data, it does
   not render. Guarded, but the guard only reads JSX — check library data too.
2. **Never read the clock during render.** Date helpers take `now` as a required
   argument; screens get it from `useClock()` and guard with
   `typeof now !== "number"`.
3. **Do not weaken a test to make it pass.** If an assertion fails, either the
   change is wrong or the assertion encoded a bug. If it is the latter, say so
   in the commit message.

`docs/HANDOFF.md` has the rest, including why each of these exists.
