"use client";

/**
 * The global key, persisted per device.
 *
 * `useSyncExternalStore` rather than an effect: the server snapshot is the
 * default key, the client snapshot is whatever localStorage holds, and React
 * reconciles them without a second render pass or a hydration mismatch. It also
 * means two open tabs stay on the same key.
 */
import { useCallback, useSyncExternalStore } from "react";
import { FIFTHS } from "./theory";
import type { KeyName } from "./types";

const STORAGE_KEY = "fretlab-key";
const DEFAULT_KEY: KeyName = "G";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): KeyName {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as KeyName | null;
    return stored && FIFTHS.includes(stored) ? stored : DEFAULT_KEY;
  } catch {
    // Private windows and blocked site data both land here.
    return DEFAULT_KEY;
  }
}

function getServerSnapshot(): KeyName {
  return DEFAULT_KEY;
}

export function useStoredKey(): [KeyName, (key: KeyName) => void] {
  const selectedKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setSelectedKey = useCallback((next: KeyName) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage is unavailable; the key still applies for this session.
    }
    for (const listener of listeners) listener();
  }, []);

  return [selectedKey, setSelectedKey];
}
