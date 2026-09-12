/**
 * Which finger goes where.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and any
 * layer may import it. It is its own module because two of them need it —
 * `fingering.ts` for generated boxes and `positions.ts` for the CAGED tables —
 * and `fingering` already imports `positions`, so the rule could not live in
 * either without making that circular.
 *
 * Having it in one place is the point. It was written twice, and both copies
 * had the same bug.
 */
/**
 * Which finger frets a note, given where the hand is sitting.
 *
 * The hand's first finger sits at the lowest *frettable* fret of the window,
 * which is not the same as the lowest fret of the window: a shape reaching the
 * nut has a window starting at fret 0, and no finger occupies fret 0.
 *
 * Both places that numbered fingers got this wrong in the same way. They
 * counted from the window's low, so an open-position shape came out a finger
 * too high — fret 1 asked for the middle finger and fret 3 for the little one,
 * leaving the index unused and the hand stretched for no reason. Open strings
 * came out worse: fret 0 was given finger 1, which tells a beginner to fret
 * the nut.
 */
export function fingerFor(fret: number, windowLow: number): number {
  // An open string is played with no finger at all.
  if (fret === 0) return 0;
  // Fret 0 is the nut, so the index finger's home is fret 1 at the lowest.
  const handPosition = Math.max(1, windowLow);
  return Math.min(4, Math.max(1, fret - handPosition + 1));
}
