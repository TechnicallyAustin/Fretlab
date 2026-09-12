/**
 * Practice tones via the Web Audio API.
 *
 * App Template Contract v1 §5: this is domain logic, not presentation. It sits
 * under lib/ so L2 sections and L3 elements can use it without importing from
 * a page, and so the boundary lint has somewhere legal to point.
 *
 * One context, for the life of the tab. This used to build a fresh
 * `AudioContext` per call and close it on a timer, which is wrong twice over:
 * every mobile browser starts a context suspended until a user gesture resumes
 * it, so on iOS Safari the tones never sounded at all; and a metronome needs a
 * clock that outlives a single note. `unlock()` is the gesture handler, and
 * everything else schedules against the one context it returns.
 */
import type { Accent } from "./metronome";
import type { KeyName } from "./types";
import { keyPc } from "./theory";

type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext };

let shared: AudioContext | null = null;

/**
 * The shared context, or null where there is no Web Audio (the server, or a
 * browser without it). Safe to call repeatedly.
 *
 * Call it first from inside a click handler: iOS Safari only honours
 * `resume()` during a user gesture, and a context created outside one stays
 * suspended however often you ask.
 */
export function unlock(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!shared) shared = new AudioCtor();
  if (shared.state === "suspended") void shared.resume();
  return shared;
}

/** The click sounds. Short, dry and pitched apart so the bar is audible. */
const CLICK: Record<Accent, { frequency: number; peak: number; length: number }> = {
  downbeat: { frequency: 1600, peak: 0.28, length: 0.045 },
  beat: { frequency: 1050, peak: 0.2, length: 0.04 },
  offbeat: { frequency: 780, peak: 0.1, length: 0.028 },
};

/**
 * Schedule one click at an exact time on the audio clock.
 *
 * `time` comes from the scheduler and is always in the future. Playing it from
 * a timer callback instead would put it wherever the main thread happened to
 * be, which is the drift this whole arrangement exists to avoid.
 */
export function playClick(context: AudioContext, time: number, accent: Accent): void {
  const { frequency, peak, length } = CLICK[accent];
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, time);
  // A square wave switched on at full amplitude clicks twice: once for the
  // beat and once for the discontinuity. The 2ms ramp is the fix.
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + length + 0.02);
}

export function playTones(rootKey: KeyName, intervals: number[], sequence = false) {
  const context = unlock();
  if (!context) return;
  const baseMidi = 48 + keyPc(rootKey);
  const spacing = sequence ? 0.24 : 0.035;
  intervals.forEach((interval, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * spacing;
    const duration = sequence ? 0.42 : 1.25;
    oscillator.type = index % 2 ? "sine" : "triangle";
    oscillator.frequency.value =
      440 * Math.pow(2, (baseMidi + interval - 69) / 12);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      sequence ? 0.12 : 0.075,
      start + 0.025,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  });
}
