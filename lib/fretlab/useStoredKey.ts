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

/**
 * The stored key, or the default.
 *
 * Exported so it can be tested. The hook around it is three lines of
 * `useSyncExternalStore`; everything that can actually be wrong — an unknown
 * key from an older build, storage that throws rather than returning null —
 * is in here.
 */
export function readStoredKey(): KeyName {
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

/** Persist the key. Storage that refuses is not an error the player caused. */
export function writeStoredKey(key: KeyName): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // Private windows and blocked site data both land here. The key still
    // applies for this session.
  }
}

export function useStoredKey(): [KeyName, (key: KeyName) => void] {
  const selectedKey = useSyncExternalStore(subscribe, readStoredKey, getServerSnapshot);

  const setSelectedKey = useCallback((next: KeyName) => {
    writeStoredKey(next);
    for (const listener of listeners) listener();
  }, []);

  return [selectedKey, setSelectedKey];
}
