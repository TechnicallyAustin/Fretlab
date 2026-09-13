/**
 * App values in the shapes the kit expects.
 *
 * Small, deliberate, and in one place: the app and the kit disagree about a
 * few spellings, and scattering the conversions through the screens is how
 * those disagreements turn into bugs.
 */
import type { Level } from "./primitives";

/**
 * The library labels a level "Beginner"; the kit types it `"beginner"` and
 * uses it as a class-name suffix. Anything unrecognised is treated as the
 * gentlest level rather than thrown away, since a badge is not worth a crash.
 */
export function levelOf(label: string): Level {
  const lower = label.toLowerCase();
  return lower === "intermediate" || lower === "advanced" ? lower : "beginner";
}
