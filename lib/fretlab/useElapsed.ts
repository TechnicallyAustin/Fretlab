"use client";

/**
 * Seconds since this run started, and a mm:ss label for it.
 *
 * Three screens showed a frozen clock — Train read "0:24" beside two live
 * figures, Runner and Guided both read "02:18" — so the one number a practice
 * screen exists to show was the one number it made up.
 *
 * The wall clock is read only inside the interval callback. Reading it during
 * render is impure, and setting state in an effect body cascades; subscribing
 * to an external source and calling setState from the callback is the pattern
 * that is neither.
 *
 * `restartKey` starts the clock over: pass whatever identifies the current run.
 */
import { useEffect, useRef, useState } from "react";

/**
 * Seconds as "4:05". Exported because it is the only part of this file that
 * can be wrong in a way a reader would see, and a hook cannot be asked.
 */
export function clockLabel(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function useElapsed(restartKey: string | number = "") {
  const startedAt = useRef(0);
  const [seconds, setSeconds] = useState(0);

  // Zero the readout the moment the run changes, rather than a tick later.
  // Adjusting during render is pure here: no clock is read.
  const [renderedFor, setRenderedFor] = useState(restartKey);
  if (renderedFor !== restartKey) {
    setRenderedFor(restartKey);
    setSeconds(0);
  }

  useEffect(() => {
    startedAt.current = Date.now();
    const id = window.setInterval(
      () => setSeconds(Math.round((Date.now() - startedAt.current) / 1000)),
      500,
    );
    return () => window.clearInterval(id);
  }, [restartKey]);

  return {
    seconds,
    label: clockLabel(seconds),
    /** The wall-clock start, for recording a session. Never read in render. */
    startedAt,
  };
}
