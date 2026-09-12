"use client";

/**
 * What the last routine run actually recorded.
 *
 * `Summary` used to show a 92% ring and four invented per-drill percentages
 * for a run that recorded nothing at all. It reports this instead: the steps
 * that were played, how long each took, and whether the server accepted them.
 *
 * Per tab, not per device — a summary belongs to the run you just finished, so
 * `sessionStorage` is the right lifetime. It is written once when the runner
 * finishes and read once by the summary; a direct visit to the summary with
 * nothing stored gets the empty state rather than somebody else's numbers.
 *
 * Note what is absent: there is no accuracy field. The runner is a timer and
 * measures nothing to be accurate about, and a column invented to look
 * complete is the defect this file exists to undo.
 */
import { useSyncExternalStore } from "react";
import type { KeyName } from "./types";

const STORAGE_KEY = "fretlab-last-run";

export type RunStep = {
  drillId: string;
  name: string;
  /** Seconds actually practised, not the minutes the routine planned for. */
  seconds: number;
  /** The drill's tempo, or null where the drill is not played to a click. */
  bpm: number | null;
};

export type LastRun = {
  routineId: string;
  routineName: string;
  musicKey: KeyName;
  finishedAt: string;
  steps: RunStep[];
  /** Why the sessions were not saved, or null when they were. */
  saveError: string | null;
};

export function saveLastRun(run: LastRun): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  } catch {
    // Private windows and blocked site data both land here. The run still
    // happened and the server still has it; only the summary goes empty.
  }
}

export function readLastRun(): LastRun | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  return parseRun(raw);
}

/**
 * Storage is user-writable and outlives a deploy, so the shape is checked
 * rather than trusted: a half-written run renders as no run.
 */
function parseRun(raw: string | null): LastRun | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LastRun;
    if (!parsed || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// The parse is cached against the raw string so repeated snapshot reads are
// equal by reference. `useSyncExternalStore` re-reads on every render and
// would loop forever on a fresh object each time.
let cachedRaw: string | null = null;
let cachedRun: LastRun | null = null;

function getSnapshot(): LastRun | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedRun = parseRun(raw);
  }
  return cachedRun;
}

/** No run on the server, so the summary renders its empty state until hydrated. */
function getServerSnapshot(): LastRun | null {
  return null;
}

/** The run is written once, before navigating here, so nothing can change it. */
function subscribe(): () => void {
  return () => {};
}

/**
 * The last run, as an external store.
 *
 * Reading storage in an effect and calling `setState` would cascade renders,
 * which is the same problem `useStoredKey` and `useClock` solve this way: the
 * server snapshot is a stable placeholder, the client snapshot is the real
 * value, and React reconciles them without a hydration mismatch.
 */
export function useLastRun(): LastRun | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
