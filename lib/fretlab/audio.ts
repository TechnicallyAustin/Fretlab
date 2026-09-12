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
import type { KeyName, Note, Tuning } from "./types";
import { STANDARD_TUNING, keyPc } from "./theory";
import { STRUM_DELAY, pluckBuffer } from "./pluck";

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

/**
 * Play a set of intervals above a key's root, for the screens that show a
 * scale or an interval rather than a fingered shape.
 *
 * Where a shape *is* on screen, use `playShape`: it knows which string each
 * note is on, so an open C and a barre C sound like the different things they
 * are. This is the fallback for a sequence of degrees, which has no strings.
 *
 * It shares the plucked voice, so the two never sound like different
 * instruments, and the base is the third octave — where a guitar actually puts
 * these notes, rather than an arbitrary MIDI 48.
 */
export function playTones(rootKey: KeyName, intervals: number[], sequence = false) {
  const context = unlock();
  if (!context) return;
  const baseMidi = 48 + keyPc(rootKey);
  const spacing = sequence ? 0.26 : STRUM_DELAY;

  intervals.forEach((interval, index) => {
    const samples = pluckBuffer(
      frequencyOf(baseMidi + interval),
      context.sampleRate,
      {
        seconds: sequence ? 0.9 : 2.2,
        seed: (baseMidi + interval) * 2654435761,
      },
    );
    playBuffer(context, samples, context.currentTime + index * spacing, 0.45);
  });
}



/** Equal temperament, A4 = 440, so this agrees with the tuner. */
function frequencyOf(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Play a buffer of samples at a given time, through the shared context.
 *
 * The buffer is generated rather than fetched, so there is nothing to load and
 * no sample pack to ship — and it can be tested, which a fetched sample cannot.
 */
function playBuffer(
  context: AudioContext,
  samples: Float32Array,
  at: number,
  gain: number,
): void {
  const buffer = context.createBuffer(1, samples.length, context.sampleRate);
  // getChannelData rather than copyToChannel: the latter's type demands a
  // Float32Array backed by a plain ArrayBuffer, and this one is generated.
  buffer.getChannelData(0).set(samples);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const level = context.createGain();
  level.gain.value = gain;
  source.connect(level).connect(context.destination);
  source.start(at);
}

export type PlayShapeOptions = {
  /** Play one string at a time instead of strumming. */
  sequence?: boolean;
  /** Seconds between strings in a strum. */
  strum?: number;
};

/**
 * Play the shape that is on screen, at the pitches it would actually sound.
 *
 * This is the point of FL-22. `playTones` synthesises from an abstract
 * interval over a fixed MIDI 48 base, so an open C and a barre C at the eighth
 * fret sounded identical, and neither was in the octave a guitar puts them in.
 * Here a note is a string and a fret, the string's open pitch comes from the
 * tuning map — so Drop D sounds like Drop D — and the fret is added to it.
 *
 * Strings sound low to high a few milliseconds apart, because a chord whose
 * notes all start at the same instant does not sound like a hand.
 */
export function playShape(
  notes: readonly Note[],
  tuning: Tuning = STANDARD_TUNING,
  { sequence = false, strum = STRUM_DELAY }: PlayShapeOptions = {},
): void {
  const context = unlock();
  if (!context || notes.length === 0) return;

  // Low string first, which is the direction a downstroke travels.
  const ordered = [...notes].sort((a, b) => b.s - a.s);
  const spacing = sequence ? 0.26 : strum;

  ordered.forEach((note, index) => {
    const open = tuning.openMidi[note.s];
    if (open === undefined) return;
    const frequency = frequencyOf(open + note.f);
    const samples = pluckBuffer(frequency, context.sampleRate, {
      seconds: sequence ? 0.9 : 2.2,
      // A deterministic seed per string, so the same chord sounds the same
      // twice and no two strings share an identical noise burst.
      seed: note.s * 2654435761 + note.f,
    });
    playBuffer(context, samples, context.currentTime + index * spacing, 0.5);
  });
}
