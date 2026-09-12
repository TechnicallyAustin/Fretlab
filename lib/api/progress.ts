/**
 * Derives the numbers the Progress and DrillHistory screens show from real
 * practice sessions.
 *
 * Pure functions over the §4 wire shape: no fetching, no React, so they are
 * testable on their own and the screens stay thin.
 *
 * **`now` is a required argument, never a `Date.now()` default.** Every
 * function here answers a question about the user's local calendar — which day
 * is today, how long the streak is, which months the graph spans — and the
 * server has neither the user's clock nor their timezone. When these defaulted
 * to `Date.now()` they were read during render, so the server produced one
 * week of day labels and the browser produced another, and React threw a
 * hydration mismatch on the Today screen. Taking the clock as an argument
 * makes that impossible to write by accident: a caller has to get one from
 * `useClock`, which returns null until the client has one.
 */
import type { PracticeSessionWire } from "./client";

export type RangeLabel = "7 days" | "14 days" | "30 days";

export const RANGE_DAYS: Record<RangeLabel, number> = {
  "7 days": 7,
  "14 days": 14,
  "30 days": 30,
};

const DAY_MS = 86_400_000;

/**
 * Local calendar day, so "today" means the user's today.
 *
 * Zero-padded, because `accuracySeries` sorts these keys as strings to put the
 * chart in date order. Unpadded they sorted `2026-10-1` before `2026-8-9` and
 * the 11th before the 9th, so the accuracy line was drawn out of order across
 * a month boundary and whenever two days differed in digit count. Every other
 * use here is an equality check, which padding leaves alone.
 */
function dayKey(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth())}-${pad(date.getDate())}`;
}

/**
 * Rejects a clock that is not one, with a message that says what to do.
 *
 * Every date-relative helper here funnels through `startOfToday`, so this is
 * the one place a bad clock can be caught. Without it an `undefined` slid all
 * the way down to `new Date(undefined).toISOString()` and threw "Invalid time
 * value" from inside a React render — an error naming neither the argument,
 * the caller, nor the fix.
 *
 * A caller that has no clock yet must not call these at all: `useClock()`
 * returns null until the client has one, and the screen waits for it.
 */
function assertClock(now: number): void {
  if (typeof now !== "number" || !Number.isFinite(now)) {
    throw new TypeError(
      `Expected a millisecond clock, received ${String(now)}. ` +
        "Screens take one from useClock(), which is null until the client " +
        "has a clock — render the waiting state rather than calling with it.",
    );
  }
}

function startOfToday(now: number): number {
  assertClock(now);
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * One point per day, oldest first. Days with no practice are skipped rather
 * than drawn as zero, which would read as a bad session instead of a rest day.
 */
export function accuracySeries(
  sessions: readonly PracticeSessionWire[],
  range: RangeLabel,
  now: number,
): number[] {
  const cutoff = startOfToday(now) - (RANGE_DAYS[range] - 1) * DAY_MS;
  const byDay = new Map<string, number[]>();

  for (const session of sessions) {
    if (session.accuracy === null) continue;
    const time = new Date(session.created_at).getTime();
    if (Number.isNaN(time) || time < cutoff) continue;
    const key = dayKey(session.created_at);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(session.accuracy);
    else byDay.set(key, [session.accuracy]);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, values]) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length));
}

export type ProgressSummary = {
  accuracy: number | null;
  reps: number;
  streakDays: number;
  activeDays: number;
  sessionCount: number;
};

export function summarise(
  sessions: readonly PracticeSessionWire[],
  now: number,
): ProgressSummary {
  const accuracies = sessions.map((s) => s.accuracy).filter((a): a is number => a !== null);
  const reps = sessions.reduce((sum, session) => sum + (session.reps ?? 0), 0);

  const days = new Set(sessions.map((session) => dayKey(session.created_at)));

  // A streak counts back from today, or from yesterday if today is still empty,
  // so opening the app in the morning does not read as a broken streak.
  let streakDays = 0;
  const today = startOfToday(now);
  const startOffset = days.has(dayKey(new Date(today).toISOString())) ? 0 : 1;
  for (let offset = startOffset; ; offset += 1) {
    const key = dayKey(new Date(today - offset * DAY_MS).toISOString());
    if (!days.has(key)) break;
    streakDays += 1;
  }

  return {
    accuracy: accuracies.length
      ? Math.round(accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length)
      : null,
    reps,
    streakDays,
    activeDays: days.size,
    sessionCount: sessions.length,
  };
}

/**
 * Activity levels for the commit-style graph: 26 weeks of days, oldest first,
 * each 0 to 4 by minutes practised that day.
 */
export function consistencyLevels(
  sessions: readonly PracticeSessionWire[],
  weeks: number,
  now: number,
): number[] {
  const totalDays = weeks * 7;
  const minutesByDay = new Map<string, number>();

  for (const session of sessions) {
    const key = dayKey(session.created_at);
    const minutes = (session.duration_seconds ?? 0) / 60;
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + minutes);
  }

  const today = startOfToday(now);
  return Array.from({ length: totalDays }, (_, index) => {
    const offset = totalDays - 1 - index;
    const key = dayKey(new Date(today - offset * DAY_MS).toISOString());
    const minutes = minutesByDay.get(key) ?? 0;
    if (minutes <= 0) return 0;
    if (minutes < 6) return 1;
    if (minutes < 12) return 2;
    if (minutes < 20) return 3;
    return 4;
  });
}

function practiceIntensity(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 6) return 1;
  if (minutes < 12) return 2;
  if (minutes < 20) return 3;
  return 4;
}

/**
 * Five weekday rows across N calendar weeks, oldest week first. Weekends are
 * intentionally omitted: this compact home-card view is a weekday habit aid,
 * while the full Progress graph still preserves all seven days.
 */
export function workweekContributionLevels(
  sessions: readonly PracticeSessionWire[],
  weeks: number,
  now: number,
): number[] {
  const today = startOfToday(now);
  const monday = today - ((new Date(today).getDay() + 6) % 7) * DAY_MS;
  const minutesByDay = new Map<string, number>();

  for (const session of sessions) {
    const key = dayKey(session.created_at);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + (session.duration_seconds ?? 0) / 60);
  }

  return Array.from({ length: weeks * 5 }, (_, index) => {
    const weekIndex = Math.floor(index / 5);
    const weekdayIndex = index % 5;
    const weekOffset = weeks - 1 - weekIndex;
    const at = monday - weekOffset * 7 * DAY_MS + weekdayIndex * DAY_MS;
    return practiceIntensity(minutesByDay.get(dayKey(new Date(at).toISOString())) ?? 0);
  });
}

/** Practice intensity for the current Monday-Friday week, oldest first. */
export function weekdayContributionLevels(
  sessions: readonly PracticeSessionWire[],
  now: number,
): number[] {
  const today = startOfToday(now);
  const day = new Date(today).getDay();
  const monday = today - ((day + 6) % 7) * DAY_MS;
  const minutesByDay = new Map<string, number>();
  for (const session of sessions) {
    const key = dayKey(session.created_at);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + (session.duration_seconds ?? 0) / 60);
  }
  return Array.from({ length: 5 }, (_, index) => {
    const key = dayKey(new Date(monday + index * DAY_MS).toISOString());
    const minutes = minutesByDay.get(key) ?? 0;
    return practiceIntensity(minutes);
  });
}

/** The last N sessions for one drill, newest first, shaped for the history bars. */
export function recentForDrill(
  sessions: readonly PracticeSessionWire[],
  drillId: string,
  count = 4,
): PracticeSessionWire[] {
  return sessions
    .filter((session) => session.drill_id === drillId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, count);
}

/** "Today", "Tue", "Sun" — the short label the history bars use. */
export function dayLabel(iso: string, now: number): string {
  const date = new Date(iso);
  if (dayKey(iso) === dayKey(new Date(startOfToday(now)).toISOString())) return "Today";
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export type Insight = { label: string; value: string; detail: string; percent: number };

/**
 * The three insight tiles.
 *
 * Everything here is derived from what a practice session actually records.
 * Per-string and per-fret breakdowns are deliberately absent: FretLab does not
 * store which notes were missed, so claiming that detail would be invention.
 */
export function insights(
  sessions: readonly PracticeSessionWire[],
  now: number,
): Insight[] {
  const stats = summarise(sessions, now);
  const tempos = sessions.map((s) => s.bpm).filter((b): b is number => b !== null);
  const bestTempo = tempos.length ? Math.max(...tempos) : null;

  const byDrill = new Map<string, number>();
  for (const session of sessions) {
    byDrill.set(session.drill_id, (byDrill.get(session.drill_id) ?? 0) + 1);
  }
  const [topDrill, topCount] = [...byDrill.entries()].sort(([, a], [, b]) => b - a)[0] ?? [null, 0];

  const accuracy = stats.accuracy ?? 0;
  const milestone = accuracy >= 90 ? 95 : 90;

  return [
    {
      label: "Best clean tempo",
      value: bestTempo === null ? "Not logged" : `${bestTempo} bpm`,
      detail: tempos.length === 1 ? "From one session" : `Across ${tempos.length} sessions`,
      percent: bestTempo === null ? 0 : Math.min(100, Math.round((bestTempo / 160) * 100)),
    },
    {
      label: "Most practised",
      value: topDrill ? topDrill.replace(/-/g, " ") : "Nothing yet",
      detail: topCount ? `${topCount} ${topCount === 1 ? "session" : "sessions"}` : "Run a drill to start",
      percent: stats.sessionCount ? Math.round((topCount / stats.sessionCount) * 100) : 0,
    },
    {
      label: "Next milestone",
      value: `${milestone}% accuracy`,
      detail:
        stats.accuracy === null
          ? "Log a session to start tracking"
          : accuracy >= milestone
            ? "Reached"
            : `${milestone - accuracy} points away`,
      percent: Math.min(100, accuracy),
    },
  ];
}

/**
 * Minutes practised on each of the last seven days, oldest first.
 *
 * The Today screen drew a week chart from a literal array, so a brand-new
 * account was shown someone else's week. These are the user's own minutes, and
 * a day with no practice is a real zero rather than a skipped point: on a bar
 * chart a gap reads as a rest day, which is the truth.
 */
export function weekMinutes(
  sessions: readonly PracticeSessionWire[],
  now: number,
): { label: string; minutes: number; isToday: boolean }[] {
  const LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const byDay = new Map<string, number>();
  for (const session of sessions) {
    const key = dayKey(session.created_at);
    byDay.set(key, (byDay.get(key) ?? 0) + (session.duration_seconds ?? 0) / 60);
  }
  const today = startOfToday(now);
  return Array.from({ length: 7 }, (_, index) => {
    const at = new Date(today - (6 - index) * DAY_MS);
    return {
      label: LABELS[at.getDay()],
      minutes: Math.round(byDay.get(dayKey(at.toISOString())) ?? 0),
      isToday: index === 6,
    };
  });
}

/**
 * The most recent accuracy recorded for each drill.
 *
 * The drill library used to carry a `progress` percentage per drill, baked into
 * the content, so a brand-new account saw "72% complete" on a drill it had
 * never opened. A drill a player has not practised has no progress, and a
 * missing entry here says exactly that.
 */
export function lastAccuracyByDrill(
  sessions: readonly PracticeSessionWire[],
): Map<string, number> {
  const newest = new Map<string, { at: number; accuracy: number }>();
  for (const session of sessions) {
    if (session.accuracy === null || !session.drill_id) continue;
    const at = new Date(session.created_at).getTime();
    if (Number.isNaN(at)) continue;
    const current = newest.get(session.drill_id);
    if (!current || at > current.at) {
      newest.set(session.drill_id, { at, accuracy: session.accuracy });
    }
  }
  return new Map([...newest].map(([id, entry]) => [id, entry.accuracy]));
}

/**
 * The month names spanned by the consistency graph, oldest first.
 *
 * These were six hardcoded strings — "Mar" through "Aug" — against a window
 * that always ends today, so the axis was wrong on every day of the year bar a
 * handful.
 */
export function consistencyMonths(weeks: number, now: number): string[] {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = startOfToday(now);
  const seen: string[] = [];
  for (let day = (weeks * 7) - 1; day >= 0; day -= 1) {
    const name = MONTHS[new Date(today - day * DAY_MS).getMonth()];
    if (seen.at(-1) !== name) seen.push(name);
  }
  return seen;
}

export type RoutineProgress = {
  /** Distinct days this routine's drills were practised, in the window. */
  completed: number;
  /** "Today" / "Tue", or null when it has never been practised. */
  last: string | null;
};

/**
 * How much of a routine has actually been practised.
 *
 * `ROUTINES` used to carry `completed: 3` and `last: "Yesterday"` as literals,
 * so a brand-new account saw three filled dots and a practice history it did
 * not have — the same class of invention FL-07 removed everywhere else, missed
 * because the numbers came from library data rather than from JSX.
 *
 * A routine has no id in the session table, so this counts sessions against
 * the drills the routine is made of. That is an approximation and is labelled
 * as one in the UI: it says the drills were practised, not that the routine
 * was completed end to end. Recording a routine properly is FL-11's job.
 */
export function routineProgress(
  sessions: readonly PracticeSessionWire[],
  drillIds: readonly string[],
  now: number,
): RoutineProgress {
  const ids = new Set(drillIds);
  const mine = sessions.filter((session) => ids.has(session.drill_id));
  if (mine.length === 0) return { completed: 0, last: null };
  const days = new Set(mine.map((session) => dayKey(session.created_at)));
  const newest = mine.reduce((latest, session) =>
    session.created_at > latest.created_at ? session : latest,
  );
  return { completed: days.size, last: dayLabel(newest.created_at, now) };
}
