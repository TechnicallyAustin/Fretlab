"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ThemeMode = "system" | "light" | "dark";
const STORAGE_KEY = "fretlab-theme";
const listeners = new Set<() => void>();
function subscribe(listener: () => void) { listeners.add(listener); window.addEventListener("storage", listener); return () => { listeners.delete(listener); window.removeEventListener("storage", listener); }; }
function getSnapshot(): ThemeMode { try { const value = window.localStorage.getItem(STORAGE_KEY); return value === "light" || value === "dark" ? value : "system"; } catch { return "system"; } }
function getServerSnapshot(): ThemeMode { return "system"; }
export function useStoredTheme(): [ThemeMode, (mode: ThemeMode) => void] {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setMode = useCallback((next: ThemeMode) => { try { window.localStorage.setItem(STORAGE_KEY, next); } catch {} for (const listener of listeners) listener(); }, []);
  return [mode, setMode];
}
