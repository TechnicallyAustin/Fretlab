"use client";

/**
 * The metronome, wired to the audio clock.
 *
 * Three pieces meet here: `MetronomeScheduler` decides when each click falls,
 * `audio.ts` makes the sound, and this hook runs the coarse timer that carries
 * clicks from one to the other — the standard Web Audio lookahead. The timer
 * fires every 25ms and asks for everything due in the next 100ms, so a late
 * callback costs nothing: those clicks were scheduled ahead of it and play on
 * the audio clock whatever the main thread is doing.
 *
 * The visual pulse runs off the same clock. A scheduled click is held in a
 * queue until `AudioContext.currentTime` reaches it and only then lights a
 * dot, so the dots agree with what you hear — which is the whole complaint
 * against the CSS animation this replaces.
 *
 * The scheduler lives in a ref rather than in state: it is mutated many times
 * a second and none of those mutations should re-render anything. What the UI
 * needs — the tempo, the current beat — is mirrored into state as it changes.
 */
import type { Click, Subdivision } from "./metronome";
import { MetronomeScheduler, clampBpm, tappedTempo } from "./metronome";
import { playClick, unlock } from "./audio";
import { useCallback, useEffect, useRef, useState } from "react";

/** How often to wake up and schedule, in milliseconds. */
const TIMER = 25;

/** How many taps to average a tempo over. */
const TAP_MEMORY = 8;

export type Metronome = {
  running: boolean;
  bpm: number;
  meter: number;
  subdivision: Subdivision;
  /** Beat within the bar, 0-based: what the pulse should light. */
  beat: number;
  /** True while the count-in is playing, so the UI can say so. */
  countingIn: boolean;
  /** True once a beat has actually sounded, so a stopped pulse stays dark. */
  sounding: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  setBpm: (bpm: number) => void;
  /** Move the tempo by a relative amount, from wherever it actually is. */
  nudge: (by: number) => void;
  setMeter: (meter: number) => void;
  setSubdivision: (subdivision: Subdivision) => void;
  /** Call on each tap; sets the tempo once there are enough of them. */
  tap: () => void;
};

export type UseMetronomeOptions = {
  bpm?: number;
  meter?: number;
  subdivision?: Subdivision;
  countInBars?: number;
};

export function useMetronome(options: UseMetronomeOptions = {}): Metronome {
  const {
    bpm: initialBpm = 84,
    meter: initialMeter = 4,
    subdivision: initialSubdivision = 1,
    countInBars = 0,
  } = options;

  // Built once and then mutated many times a second, so it is held as state
  // with a lazy initialiser rather than recreated per render. A ref would do
  // the same job but may not be read during render, and the tempo below is.
  const [scheduler] = useState(
    () =>
      new MetronomeScheduler({
        bpm: initialBpm,
        meter: initialMeter,
        subdivision: initialSubdivision,
        countInBars,
      }),
  );

  const [running, setRunning] = useState(false);
  const [bpm, setBpmState] = useState(() => clampBpm(initialBpm));
  const [meter, setMeterState] = useState(initialMeter);
  const [subdivision, setSubdivisionState] =
    useState<Subdivision>(initialSubdivision);
  const [pulse, setPulse] = useState({
    beat: 0,
    countingIn: false,
    sounding: false,
  });

  const contextRef = useRef<AudioContext | null>(null);
  /** Clicks already scheduled to sound, waiting for the clock to reach them. */
  const pendingRef = useRef<Click[]>([]);
  const tapsRef = useRef<number[]>([]);

  const start = useCallback(() => {
    // Called from inside a click handler, which is the only place iOS Safari
    // will let a suspended context resume.
    const context = unlock();
    if (!context) return;
    contextRef.current = context;
    pendingRef.current = [];
    scheduler.start(context.currentTime);
    setRunning(true);
  }, [scheduler]);

  const stop = useCallback(() => {
    scheduler.stop();
    pendingRef.current = [];
    setRunning(false);
    setPulse({ beat: 0, countingIn: false, sounding: false });
  }, [scheduler]);

  const toggle = useCallback(() => {
    if (scheduler.isRunning) stop();
    else start();
  }, [scheduler, start, stop]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const context = contextRef.current;
      if (!context) return;
      const now = context.currentTime;

      for (const click of scheduler.poll(now)) {
        playClick(context, click.time, click.accent);
        pendingRef.current.push(click);
      }

      // Light the dot when the click it belongs to actually sounds. Only whole
      // beats move the pulse: subdivisions are heard, not counted.
      let arrived: Click | undefined;
      while (pendingRef.current.length && pendingRef.current[0].time <= now) {
        const click = pendingRef.current.shift();
        if (click && click.tick === 0) arrived = click;
      }
      if (arrived) {
        setPulse({
          beat: arrived.beat,
          countingIn: arrived.countIn,
          sounding: true,
        });
      }
    }, TIMER);
    return () => window.clearInterval(timer);
  }, [running, scheduler]);

  // Stop the clock if the screen using it unmounts mid-run.
  useEffect(() => () => scheduler.stop(), [scheduler]);

  const setBpm = useCallback(
    (next: number) => {
      scheduler.setBpm(next);
      setBpmState(scheduler.bpm);
    },
    [scheduler],
  );

  // Reads the tempo off the scheduler rather than off state, so holding a
  // nudge button down cannot compound a stale value.
  const nudge = useCallback(
    (by: number) => setBpm(scheduler.bpm + by),
    [scheduler, setBpm],
  );

  const setMeter = useCallback(
    (next: number) => {
      scheduler.setMeter(next);
      setMeterState(scheduler.meter);
    },
    [scheduler],
  );

  const setSubdivision = useCallback(
    (next: Subdivision) => {
      scheduler.setSubdivision(next);
      setSubdivisionState(scheduler.subdivision);
    },
    [scheduler],
  );

  const tap = useCallback(() => {
    const taps = [...tapsRef.current, Date.now()].slice(-TAP_MEMORY);
    tapsRef.current = taps;
    const tempo = tappedTempo(taps);
    if (tempo !== null) setBpm(tempo);
  }, [setBpm]);

  return {
    running,
    bpm,
    meter,
    subdivision,
    beat: pulse.beat,
    countingIn: pulse.countingIn,
    sounding: pulse.sounding,
    start,
    stop,
    toggle,
    setBpm,
    nudge,
    setMeter,
    setSubdivision,
    tap,
  };
}
