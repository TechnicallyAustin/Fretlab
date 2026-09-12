/**
 * Practice tones via the Web Audio API.
 *
 * App Template Contract v1 §5: this is domain logic, not presentation. It sits
 * under lib/ so L2 sections and L3 elements can use it without importing from
 * a page, and so the boundary lint has somewhere legal to point.
 */
import type { KeyName } from "./types";
import { keyPc } from "./theory";

export function playTones(rootKey: KeyName, intervals: number[], sequence = false) {
  if (typeof window === "undefined") return;
  const AudioCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtor) return;
  const context = new AudioCtor();
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
  window.setTimeout(
    () => void context.close(),
    (intervals.length * spacing + 1.5) * 1000,
  );
}
