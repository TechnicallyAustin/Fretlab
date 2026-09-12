"use client";

/** Shared guitar setup, persisted per device and safe during server rendering. */
import { useCallback, useSyncExternalStore } from "react";
import { DROP_D_TUNING, STANDARD_TUNING } from "./theory";
import type { Tuning } from "./types";

const STORAGE_KEY = "fretlab-tuning";
const HANDEDNESS_KEY = "fretlab-handedness";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}
function getTuning(): Tuning {
  try { return window.localStorage.getItem(STORAGE_KEY) === DROP_D_TUNING.id ? DROP_D_TUNING : STANDARD_TUNING; } catch { return STANDARD_TUNING; }
}
function getHandedness(): boolean {
  try { return window.localStorage.getItem(HANDEDNESS_KEY) === "left"; } catch { return false; }
}
function getServerTuning() { return STANDARD_TUNING; }
function getServerHandedness() { return false; }

export function useStoredTuning(): [Tuning, (tuning: Tuning) => void, boolean, (leftHanded: boolean) => void] {
  const tuning = useSyncExternalStore(subscribe, getTuning, getServerTuning);
  const leftHanded = useSyncExternalStore(subscribe, getHandedness, getServerHandedness);
  const setTuning = useCallback((next: Tuning) => { try { window.localStorage.setItem(STORAGE_KEY, next.id); } catch {} for (const listener of listeners) listener(); }, []);
  const setLeftHanded = useCallback((next: boolean) => { try { window.localStorage.setItem(HANDEDNESS_KEY, next ? "left" : "right"); } catch {} for (const listener of listeners) listener(); }, []);
  return [tuning, setTuning, leftHanded, setLeftHanded];
}
