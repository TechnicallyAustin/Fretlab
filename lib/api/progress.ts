/**
 * Derives the numbers the Progress and DrillHistory screens show from real
 * practice sessions.
 *
 * Pure functions over the §4 wire shape: no fetching, no React, so they are
 * testable on their own and the screens stay thin.
 */
import type { PracticeSessionWire } from "./client";

export type RangeLabel = "7 days" | "14 days" | "30 days";

export const RANGE_DAYS: Record<RangeLabel, number> = {
  "7 days": 7,
  "14 days": 14,
  "30 days": 30,
};

const DAY_MS = 86_400_000;

/** Local calendar day, so "today" means the user's today. */
function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfToday(now: number): number {
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
  now = Date.now(),
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
  now = Date.now(),
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
  weeks = 26,
  now = Date.now(),
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
export function dayLabel(iso: string, now = Date.now()): string {
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
export function insights(sessions: readonly PracticeSessionWire[]): Insight[] {
  const stats = summarise(sessions);
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
