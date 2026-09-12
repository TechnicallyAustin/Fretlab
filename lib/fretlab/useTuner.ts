"use client";

/**
 * The microphone, as a tuner.
 *
 * `pitch.ts` does the hearing and knows nothing about the browser; this runs
 * the capture loop and owns the part that can go wrong. Permission refused and
 * no microphone are **states**, not errors: they are ordinary things a person's
 * machine does, each has a different way out, and a screen that throws for
 * either is telling the user they broke something when they did not.
 *
 * The analyser is read on a timer rather than a rAF loop. Tuning is not
 * animation — sixteen readings a second is past what anyone can act on — and a
 * timer keeps working when the tab is not compositing.
 */
import type { GuitarString, Reading } from "./pitch";
import {
  IN_TUNE_CENTS,
  STANDARD_TUNING,
  centsBetween,
  detectPitch,
  nearestString,
  readingFor,
} from "./pitch";
import { unlock } from "./audio";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Eight thousand samples is a fifth of a second at 44.1kHz — long enough to
 * hold two periods of the low E with room to spare, which is what the
 * correlation needs to resolve it.
 */
const WINDOW = 8192;

/** Readings per second. Faster than this reads as jitter, not as feedback. */
const INTERVAL = 60;

/**
 * Readings kept for the median. A plucked string wavers as it settles, and the
 * median of five throws out the stray octave or the moment the pick hits
 * without lagging the way an average does.
 */
const SMOOTHING = 5;

export type TunerState =
  /** Not started. The microphone needs a gesture, so this is where it waits. */
  | "idle"
  /** No `getUserMedia` at all: an insecure origin, or an old browser. */
  | "unsupported"
  /** The permission prompt is open. */
  | "requesting"
  /** The person said no. Recoverable, but only from browser settings. */
  | "denied"
  /** Permission given, but the machine has no microphone to give. */
  | "unavailable"
  /** Running. */
  | "listening";

export type TunerReading = {
  frequency: number;
  note: Reading;
  /** The open string this is nearest, so the UI can point at a peg. */
  target: GuitarString;
  /** Distance from that string, in cents. Negative is flat. */
  cents: number;
  inTune: boolean;
};

export type Tuner = {
  state: TunerState;
  /** Null while listening but hearing nothing: play a string. */
  reading: TunerReading | null;
  tuning: readonly GuitarString[];
  start: () => void;
  stop: () => void;
};

export function useTuner(tuning: readonly GuitarString[] = STANDARD_TUNING): Tuner {
  const [state, setState] = useState<TunerState>("idle");
  const [reading, setReading] = useState<TunerReading | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const recentRef = useRef<number[]>([]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    // Releasing the tracks is what turns off the browser's recording
    // indicator. Leaving them open would keep the light on after the screen
    // says it has stopped.
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    recentRef.current = [];
    setReading(null);
    setState("idle");
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    // Inside the click that called this, which is where iOS will resume it.
    const context = unlock();
    if (!context) {
      setState("unsupported");
      return;
    }

    setState("requesting");
    navigator.mediaDevices
      .getUserMedia({
        // Every one of these is designed to make speech intelligible and each
        // of them mangles a sustained tone: gain control rides the decay,
        // noise suppression treats a steady pitch as noise, echo cancellation
        // subtracts it outright.
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      })
      .then((stream) => {
        streamRef.current = stream;
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = WINDOW;
        source.connect(analyser);
        // Deliberately not connected to the destination: routing the
        // microphone to the speakers is a feedback loop.
        sourceRef.current = source;

        const samples = new Float32Array(analyser.fftSize);
        timerRef.current = window.setInterval(() => {
          analyser.getFloatTimeDomainData(samples);
          const frequency = detectPitch(samples, context.sampleRate);

          if (frequency === null) {
            recentRef.current = [];
            setReading(null);
            return;
          }

          const recent = [...recentRef.current, frequency].slice(-SMOOTHING);
          recentRef.current = recent;
          const steady = median(recent);

          const note = readingFor(steady);
          const target = nearestString(steady, tuning);
          if (!note || !target) {
            setReading(null);
            return;
          }
          const cents = centsBetween(steady, target.frequency);
          setReading({
            frequency: steady,
            note,
            target,
            cents,
            inTune: Math.abs(cents) <= IN_TUNE_CENTS,
          });
        }, INTERVAL);

        setState("listening");
      })
      .catch((error: unknown) => {
        const name = error instanceof Error ? error.name : "";
        // A machine with no microphone and a person who said no are different
        // problems with different ways out, so they are different states.
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setState("unavailable");
          return;
        }
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setState("denied");
          return;
        }
        // NotReadableError: something else holds the device. Nothing here can
        // free it, so it reads as unavailable too.
        setState("unavailable");
      });
  }, [tuning]);

  // Leaving the screen must release the microphone, not just stop drawing.
  useEffect(() => stop, [stop]);

  return { state, reading, tuning, start, stop };
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
