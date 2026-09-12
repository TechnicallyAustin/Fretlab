"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "fretlab-onboarding-complete";
const listeners = new Set<() => void>();
function subscribe(listener: () => void) { listeners.add(listener); window.addEventListener("storage", listener); return () => { listeners.delete(listener); window.removeEventListener("storage", listener); }; }
function getSnapshot() { try { return window.localStorage.getItem(STORAGE_KEY) === "yes"; } catch { return false; } }
function getServerSnapshot() { return true; }
export function useOnboarding(): [boolean, () => void] {
  const complete = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const finish = useCallback(() => { try { window.localStorage.setItem(STORAGE_KEY, "yes"); } catch {} for (const listener of listeners) listener(); }, []);
  return [complete, finish];
}
