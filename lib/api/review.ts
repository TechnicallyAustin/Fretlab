/**
 * What to practise next, decided from what was actually scored.
 *
 * Pure functions over the §4 wire shape, like `progress.ts`, so the screens
 * stay thin and this is testable without a database. `now` is a required
 * argument for the same reason it is there: every date here is a question
 * about the user's local calendar, and the server has neither their clock nor
 * their timezone.
 *
 * **The schedule is derived, not stored.** There is no review table: an item's
 * interval, ease and due date are recomputed by replaying its own recorded
 * sessions in order. That keeps it honest — every figure on this screen is a
 * consequence of sessions the player really did — and it means the scheduler
 * can change without a migration or a backfill.
 *
 * **It only schedules what the app can grade.** `Train` records an accuracy;
 * `Runner` deliberately records null, because it is a timer and measures
 * nothing to be accurate about. Spaced repetition needs a grade, so a timed
 * session counts as practice but not as review, and the UI says so rather than
 * inventing a score for it.
 */
import type { PracticeSessionWire } from "./client";

const DAY_MS = 86_400_000;

/** SM-2's starting ease. Multiplies the interval on each success. */
const START_EASE = 2.5;
/** SM-2's floor. Below this an item repeats too often to be worth scheduling. */
const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

/**
 * Failures before an item is called a leech.
 *
 * Anki uses eight. Four is right here because a FretLab item is a whole drill
 * in a key rather than one flashcard: failing it four times means the approach
 * is wrong, not that the card is hard, and the useful response is to say so
 * rather than to keep scheduling it.
 */
export const LEECH_LAPSES = 4;

/** Separates the two halves of an item's identity. Not a legal id character. */
const ITEM_SEPARATOR = " :: ";

export type ReviewItem = {
  /** The drill, and the key it was practised in — knowing G is not knowing C. */
  drillId: string;
  musicKey: string;
  /** Days until the next review, counted from the last one. */
  intervalDays: number;
  ease: number;
  /** Successful reviews in a row. Reset by a failure. */
  streak: number;
  lapses: number;
  /** Failed often enough that repeating it is not the answer. */
  leech: boolean;
  lastReviewedAt: string;
  lastAccuracy: number;
  dueAt: number;
};

/**
 * SM-2 grades an answer 0-5, so a percentage has to be mapped onto it. The
 * boundary that matters is three: below it the item has failed and its
 * interval collapses to a day.
 *
 * Seventy per cent is that boundary. On a neck-location drill that is roughly
 * "found most of them, hunted for the rest", which is not yet knowing it.
 */
export function gradeFor(accuracy: number): number {
  if (accuracy >= 95) return 5;
  if (accuracy >= 85) return 4;
  if (accuracy >= 70) return 3;
  if (accuracy >= 50) return 2;
  if (accuracy >= 30) return 1;
  return 0;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

function startOfDay(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function assertClock(now: number): void {
  if (typeof now !== "number" || !Number.isFinite(now)) {
    throw new TypeError(
      `Expected a millisecond clock, received ${String(now)}. ` +
        "Screens take one from useClock(), which is null until the client has one.",
    );
  }
}

/**
 * Every scheduled item, soonest due first.
 *
 * Sessions with no accuracy are skipped rather than counted as a pass: a timed
 * run is practice, not a test, and grading it would invent the number this
 * codebase exists not to invent.
 */
export function reviewSchedule(
  sessions: readonly PracticeSessionWire[],
  now: number,
): ReviewItem[] {
  assertClock(now);

  const graded = sessions
    .filter((session) => session.accuracy !== null && Boolean(session.drill_id))
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

  const byItem = new Map<string, ReviewItem>();

  for (const session of graded) {
    const accuracy = session.accuracy as number;
    const key = `${session.drill_id}${ITEM_SEPARATOR}${session.music_key}`;
    const grade = gradeFor(accuracy);
    const previous = byItem.get(key);

    const ease = previous?.ease ?? START_EASE;
    const streak = previous?.streak ?? 0;
    const interval = previous?.intervalDays ?? 0;
    const lapses = previous?.lapses ?? 0;

    let nextEase = ease;
    let nextStreak: number;
    let nextInterval: number;
    let nextLapses = lapses;

    if (grade < 3) {
      // A failure puts the item back to tomorrow and costs it ease, which is
      // what stops a repeatedly missed shape drifting out to a month.
      nextStreak = 0;
      nextInterval = 1;
      nextLapses = lapses + 1;
      nextEase = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
    } else {
      nextStreak = streak + 1;
      nextInterval =
        nextStreak === 1 ? 1 : nextStreak === 2 ? 6 : Math.round(interval * ease);
      nextEase = clamp(
        ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02),
        MIN_EASE,
        MAX_EASE,
      );
    }

    const reviewedAt = new Date(session.created_at).getTime();
    byItem.set(key, {
      drillId: session.drill_id,
      musicKey: session.music_key,
      intervalDays: nextInterval,
      ease: nextEase,
      streak: nextStreak,
      lapses: nextLapses,
      leech: nextLapses >= LEECH_LAPSES,
      lastReviewedAt: session.created_at,
      lastAccuracy: accuracy,
      dueAt: Number.isNaN(reviewedAt) ? now : reviewedAt + nextInterval * DAY_MS,
    });
  }

  return [...byItem.values()].sort((a, b) => a.dueAt - b.dueAt);
}

/**
 * The items to practise today: due now, or overdue.
 *
 * Due is measured to the end of the day rather than to this instant, so
 * something scheduled for today is offered all day rather than appearing at
 * whatever hour it happened to be practised last time.
 */
export function dueToday(
  schedule: readonly ReviewItem[],
  now: number,
): ReviewItem[] {
  assertClock(now);
  const endOfDay = startOfDay(now) + DAY_MS - 1;
  return schedule.filter((item) => item.dueAt <= endOfDay);
}

/** How overdue an item is, in whole days. Zero if it is due today. */
export function daysOverdue(item: ReviewItem, now: number): number {
  assertClock(now);
  return Math.max(0, Math.floor((startOfDay(now) - startOfDay(item.dueAt)) / DAY_MS));
}
