/**
 * A plucked string, by Karplus–Strong.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and any
 * layer may import it. It synthesises a sample buffer and touches no browser
 * API, which is what lets `tests/pluck.test.mjs` check the result against the
 * app's own pitch detector rather than against an ear.
 *
 * The method is the oldest trick in physical modelling and still the cheapest
 * convincing one: fill a delay line one period long with noise, then read it
 * round and round, averaging each sample with its neighbour as it goes. The
 * averaging is a one-pole lowpass, so each pass loses a little more of the
 * high end than the low — which is exactly what a real string does, and why
 * the result sounds plucked rather than beeped.
 *
 * What it replaces: a sine and triangle oscillator pair from a fixed MIDI 48
 * base, which sounded like neither a guitar nor the shape on screen.
 */

/** Delay-line feedback. Below 1, so the note decays instead of ringing forever. */
const DECAY = 0.996;

/**
 * How much of the neighbouring sample the lowpass takes. A half is the
 * classic; a touch less keeps the high strings from going dull too fast.
 */
const DAMPING = 0.5;

export type PluckOptions = {
  /** Seconds of audio to generate. */
  seconds?: number;
  /** 0–1. A harder pluck starts brighter and louder. */
  strength?: number;
  /** Deterministic noise, so a test gets the same string twice. */
  seed?: number;
};

/**
 * One plucked note, as mono samples in −1..1.
 *
 * The delay line is fractional. An integer one detunes badly up the neck: at
 * 44.1kHz the high E wants 133.8 samples, and rounding to 134 lands 9 cents
 * flat, which is worse than the tuner this app ships would accept from a
 * player. The read position is interpolated between two samples instead, and
 * the length is corrected for the half-sample the lowpass itself delays.
 */
export function pluckBuffer(
  frequency: number,
  sampleRate: number,
  { seconds = 2.4, strength = 0.85, seed = 1 }: PluckOptions = {},
): Float32Array {
  const length = Math.max(1, Math.round(sampleRate * seconds));
  const output = new Float32Array(length);
  if (!Number.isFinite(frequency) || frequency <= 0 || sampleRate <= 0) return output;

  // The loop has to delay by exactly one period, and it is made of three
  // parts: an integer delay line, the lowpass (half a sample), and an allpass
  // carrying whatever fraction is left.
  //
  // Linear interpolation was tried for the fraction and is not good enough
  // here. Its delay falls short as frequency rises, so the error grew up the
  // neck — 5 cents around the low strings but 15 cents by the twelfth fret of
  // the B string, which is audible and worse than this app's own definition
  // of in tune. An allpass holds its group delay across the range instead.
  const total = sampleRate / frequency;
  let size = Math.floor(total - DAMPING);
  let fraction = total - DAMPING - size;
  // An allpass is ill-conditioned as its delay approaches zero; borrow a whole
  // sample from the line and let the filter carry more than one.
  if (fraction < 0.1) {
    size -= 1;
    fraction += 1;
  }
  if (size < 2) return output;

  const line = new Float32Array(size);

  // A small deterministic generator: Math.random would give a different
  // string on every call and nothing could assert the result.
  let state = seed >>> 0 || 1;
  const noise = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state / 0x100000000) * 2 - 1;
  };
  for (let i = 0; i < size; i += 1) line[i] = noise() * strength;

  const coefficient = (1 - fraction) / (1 + fraction);
  let index = 0;
  let lowpassPrevious = 0;
  let allpassInput = 0;
  let allpassOutput = 0;

  for (let i = 0; i < length; i += 1) {
    const delayed = line[index];

    // Average with the previous sample: a one-pole lowpass, so each pass round
    // the loop loses more high end than low. That is what a real string does,
    // and why this sounds plucked rather than buzzed.
    const lowpassed = (delayed + lowpassPrevious) * DAMPING;
    lowpassPrevious = delayed;

    allpassOutput =
      coefficient * lowpassed + allpassInput - coefficient * allpassOutput;
    allpassInput = lowpassed;

    output[i] = allpassOutput;
    line[index] = allpassOutput * DECAY;
    index = (index + 1) % size;
  }

  // A note that starts at full amplitude clicks. Four milliseconds of fade in
  // is inaudible as a fade and removes it.
  const attack = Math.min(Math.round(sampleRate * 0.004), length);
  for (let i = 0; i < attack; i += 1) output[i] *= i / attack;

  return output;
}

/**
 * Seconds between strings in a strum.
 *
 * A chord whose notes all begin at the same instant does not sound like a
 * hand: it sounds like a synthesiser playing a chord. Twelve milliseconds is
 * about a medium downstroke.
 */
export const STRUM_DELAY = 0.012;
