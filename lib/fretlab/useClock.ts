"use client";

/**
 * The wall clock, as an external store.
 *
 * Screens need the time of day for a greeting and the date for a week chart,
 * and neither may read `Date.now()` during render: it is impure, so two renders
 * of the same state can disagree. `useSyncExternalStore` is how this codebase
 * already handles the same problem for the stored key — the server snapshot is
 * a stable placeholder, the client snapshot is the real value, and React
 * reconciles them without a hydration mismatch.
 *
 * The snapshot is a string rather than a `Date` so that repeated reads inside
 * the same hour are equal by value and do not re-render the tree.
 */
import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === undefined) {
    // A minute is fine: nothing here is finer-grained than an hour boundary.
    timer = window.setInterval(() => {
      for (const each of listeners) each();
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

/**
 * The snapshot, as a string.
 *
 * `useSyncExternalStore` re-reads this on every render and compares by
 * identity, so it has to be equal by value within the hour it describes — a
 * fresh `Date` each time would re-render the tree forever.
 *
 * Exported, with the clock passed in, so a test can pin an hour. Reading the
 * wall clock is the one thing this file exists to keep out of render.
 */
export function stampFrom(at: number): string {
  const now = new Date(at);
  return [now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()].join("-");
}

function getSnapshot(): string {
  return stampFrom(Date.now());
}

/** No clock on the server: the greeting appears once the client has one. */
export function serverStamp(): string {
  return "";
}

export type Clock = {
  /** Null until the client has a clock, so callers can render nothing. */
  date: Date | null;
  dayName: string;
  /** "Good morning" / "Good afternoon" / "Good evening", or "" on the server. */
  greeting: string;
  /**
   * Milliseconds, for the date helpers in `lib/api/progress`, or null on the
   * server. Those used to default to `Date.now()` and so were read during
   * render: the server's week of day labels disagreed with the browser's and
   * React threw a hydration mismatch. They take a clock as an argument now,
   * and this is where a screen gets one.
   */
  now: number | null;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * A clock from a snapshot, or the empty one.
 *
 * The empty clock is what the server gets, and `now: null` is what every
 * caller guards on. It must never hand out a `now` that is neither null nor a
 * finite number: `undefined` slipping through a guard is what produced
 * `RangeError: Invalid time value` six frames inside a date helper.
 */
export function clockFromStamp(stamp: string): Clock {
  if (!stamp) return { date: null, dayName: "", greeting: "", now: null };

  const [year, month, day, hour] = stamp.split("-").map(Number);
  if (![year, month, day, hour].every(Number.isFinite)) {
    return { date: null, dayName: "", greeting: "", now: null };
  }
  const date = new Date(year, month, day, hour);
  const now = date.getTime();
  if (!Number.isFinite(now)) {
    return { date: null, dayName: "", greeting: "", now: null };
  }
  return {
    date,
    dayName: DAYS[date.getDay()],
    greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
    now,
  };
}

export function useClock(): Clock {
  return clockFromStamp(
    useSyncExternalStore(subscribe, getSnapshot, serverStamp),
  );
}
