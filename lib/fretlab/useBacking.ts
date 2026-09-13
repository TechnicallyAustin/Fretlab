"use client";

/**
 * The backing track, on the metronome's clock.
 *
 * It rides `MetronomeScheduler` rather than keeping its own time. The
 * scheduler already reports the bar each click falls in, so the chord change
 * happens on a downbeat *by construction* — two independent timers would drift
 * apart over a practice session, which is the exact defect FL-09 removed when
 * it found a second, silent metronome in the practice studio.
 *
 * The drone is a looping buffer rather than a chord per bar: it is one held
 * note and restarting it every bar would be audible.
 */
import type { KeyName, Tuning } from "./types";
import type { Progression } from "./backing";
import { chordAtBar, chordIntervals, progressionById } from "./backing";
import { MetronomeScheduler, clampBpm } from "./metronome";
import { droneBuffer } from "./drone";
import { pluckBuffer } from "./pluck";
import { STANDARD_TUNING, keyPc } from "./theory";
import { unlock } from "./audio";
import { useCallback, useEffect, useRef, useState } from "react";

const TIMER = 25;

/** Where a backing chord sits. Low enough to stay under a lead line. */
const CHORD_BASE_MIDI = 48;

export type Backing = {
  running: boolean;
  progressionId: string;
  bpm: number;
  /** What is sounding now, for the UI to show. Null before the first bar. */
  label: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  setProgression: (id: string) => void;
  setBpm: (bpm: number) => void;
};

export function useBacking(
  key: KeyName,
  { bpm: initialBpm = 84, tuning = STANDARD_TUNING }: { bpm?: number; tuning?: Tuning } = {},
): Backing {
  const [running, setRunning] = useState(false);
  const [progressionId, setProgressionId] = useState("drone");
  const [bpm, setBpmState] = useState(() => clampBpm(initialBpm));
  const [label, setLabel] = useState<string | null>(null);

  const [scheduler] = useState(
    () => new MetronomeScheduler({ bpm: clampBpm(initialBpm), meter: 4 }),
  );
  const contextRef = useRef<AudioContext | null>(null);
  const droneRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  /** Bars already given a chord, so a bar is not struck twice. */
  const lastBarRef = useRef<number | null>(null);

  const stopDrone = useCallback(() => {
    try {
      droneRef.current?.stop();
    } catch {
      // Already stopped; nothing to do.
    }
    droneRef.current?.disconnect();
    droneRef.current = null;
  }, []);

  const stop = useCallback(() => {
    scheduler.stop();
    stopDrone();
    gainRef.current?.disconnect();
    gainRef.current = null;
    lastBarRef.current = null;
    setLabel(null);
    setRunning(false);
  }, [scheduler, stopDrone]);

  const start = useCallback(() => {
    const context = unlock();
    if (!context) return;
    contextRef.current = context;
    const gain = context.createGain();
    // Under a lead line, not over it.
    gain.gain.value = 0.32;
    gain.connect(context.destination);
    gainRef.current = gain;
    lastBarRef.current = null;
    scheduler.start(context.currentTime);
    setRunning(true);
  }, [scheduler]);

  const toggle = useCallback(() => {
    if (scheduler.isRunning) stop();
    else start();
  }, [scheduler, start, stop]);

  useEffect(() => {
    if (!running) return;
    const progression: Progression | undefined = progressionById(progressionId);
    if (!progression) return;

    const timer = window.setInterval(() => {
      const context = contextRef.current;
      const gain = gainRef.current;
      if (!context || !gain) return;

      for (const click of scheduler.poll(context.currentTime)) {
        // A chord changes on a downbeat, and only once per bar.
        if (click.beat !== 0 || click.tick !== 0 || click.countIn) continue;
        if (lastBarRef.current === click.bar) continue;
        lastBarRef.current = click.bar;

        const chord = chordAtBar(progression, click.bar);
        setLabel(chord.label);

        if (progression.id === "drone") {
          // One held note, started once and left alone. Restarting it every
          // bar would be audible, which is the opposite of a drone.
          if (droneRef.current) continue;
          const root = CHORD_BASE_MIDI + keyPc(key);
          const samples = droneBuffer(
            440 * Math.pow(2, (root - 69) / 12),
            context.sampleRate,
          );
          const buffer = context.createBuffer(1, samples.length, context.sampleRate);
          buffer.getChannelData(0).set(samples);
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          source.connect(gain);
          source.start(click.time);
          droneRef.current = source;
          continue;
        }

        stopDrone();
        chordIntervals(chord).forEach((interval, index) => {
          const midi = CHORD_BASE_MIDI + keyPc(key) + interval;
          const samples = pluckBuffer(
            440 * Math.pow(2, (midi - 69) / 12),
            context.sampleRate,
            { seconds: 2.4, strength: 0.6, seed: midi * 2654435761 },
          );
          const buffer = context.createBuffer(1, samples.length, context.sampleRate);
          buffer.getChannelData(0).set(samples);
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.connect(gain);
          // Strummed, not struck: the same reason playShape spaces its strings.
          source.start(click.time + index * 0.014);
        });
      }
    }, TIMER);

    return () => window.clearInterval(timer);
  }, [running, progressionId, key, scheduler, stopDrone, tuning]);

  // Leaving the screen has to stop the sound, not just stop drawing.
  useEffect(() => stop, [stop]);

  return {
    running,
    progressionId,
    bpm,
    label,
    start,
    stop,
    toggle,
    setProgression: useCallback(
      (id: string) => {
        stopDrone();
        lastBarRef.current = null;
        setProgressionId(id);
      },
      [stopDrone],
    ),
    setBpm: useCallback(
      (next: number) => {
        scheduler.setBpm(next);
        setBpmState(scheduler.bpm);
      },
      [scheduler],
    ),
  };
}
