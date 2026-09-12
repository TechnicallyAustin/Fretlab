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

function getSnapshot(): string {
  const now = new Date();
  return [now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()].join("-");
}

/** No clock on the server: the greeting appears once the client has one. */
function getServerSnapshot(): string {
  return "";
}

export type Clock = {
  /** Null until the client has a clock, so callers can render nothing. */
  date: Date | null;
  dayName: string;
  /** "Good morning" / "Good afternoon" / "Good evening", or "" on the server. */
  greeting: string;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function useClock(): Clock {
  const stamp = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!stamp) return { date: null, dayName: "", greeting: "" };

  const [year, month, day, hour] = stamp.split("-").map(Number);
  const date = new Date(year, month, day, hour);
  return {
    date,
    dayName: DAYS[date.getDay()],
    greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
  };
}
