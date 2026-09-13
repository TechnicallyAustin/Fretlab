/**
 * A held note, for playing over.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and any
 * layer may import it. Pure sample generation, like `pluck.ts`, which is what
 * lets `tests/drone.test.mjs` check its pitch with the app's own detector.
 *
 * A plucked string is the wrong voice here: it decays, and a drone's whole job
 * is not to. This is a small additive stack — the fundamental, an octave, a
 * fifth and a little fifth-above-that — through a slow amplitude drift so it
 * breathes rather than sitting there as a dead tone.
 *
 * **The buffer holds a whole number of cycles of every partial**, so looping it
 * is seamless. Cut mid-cycle and the loop point is a discontinuity, which is
 * heard as a click once a second forever — the kind of defect that is obvious
 * in a room and invisible in a waveform you never look at.
 */

/** Partials above the fundamental, and how loud each is. All are whole
 *  multiples, so one period of the fundamental contains whole periods of each. */
const PARTIALS: { multiple: number; gain: number }[] = [
  { multiple: 1, gain: 1 },
  { multiple: 2, gain: 0.42 },
  { multiple: 3, gain: 0.2 },
  { multiple: 4, gain: 0.11 },
  { multiple: 6, gain: 0.05 },
];

/** Cycles per second of the amplitude drift. Slow enough to be breath. */
const DRIFT_HZ = 0.18;
const DRIFT_DEPTH = 0.12;

export type DroneOptions = {
  /** Roughly how long a buffer to build. Rounded so the loop is seamless. */
  seconds?: number;
};

/**
 * A loopable drone at a given pitch.
 *
 * The returned length is rounded to a whole number of fundamental periods —
 * and of the drift — so the end meets the start exactly.
 */
export function droneBuffer(
  frequency: number,
  sampleRate: number,
  { seconds = 4 }: DroneOptions = {},
): Float32Array {
  if (!Number.isFinite(frequency) || frequency <= 0 || sampleRate <= 0) {
    return new Float32Array(0);
  }

  const period = sampleRate / frequency;
  // A whole number of fundamental cycles, and a whole number of drift cycles,
  // so both meet the start again at the loop point.
  const driftPeriod = sampleRate / DRIFT_HZ;
  const driftCycles = Math.max(1, Math.round((sampleRate * seconds) / driftPeriod));
  const target = driftCycles * driftPeriod;
  const cycles = Math.max(1, Math.round(target / period));
  const length = Math.round(cycles * period);
  if (length < 2) return new Float32Array(0);

  const output = new Float32Array(length);
  // The exact frequency the rounded buffer actually loops at. Rounding the
  // length detunes it slightly; reporting the truth is `droneFrequency`.
  const actual = (cycles * sampleRate) / length;

  let peak = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    let value = 0;
    for (const { multiple, gain } of PARTIALS) {
      value += gain * Math.sin(2 * Math.PI * actual * multiple * t);
    }
    // One whole drift cycle across the buffer, so it too meets its start.
    const drift =
      1 - DRIFT_DEPTH + DRIFT_DEPTH * Math.cos((2 * Math.PI * driftCycles * i) / length);
    output[i] = value * drift;
    peak = Math.max(peak, Math.abs(output[i]));
  }

  // Normalise, so adding a partial does not make the drone louder.
  if (peak > 0) {
    for (let i = 0; i < length; i += 1) output[i] = (output[i] / peak) * 0.8;
  }
  return output;
}

/**
 * The pitch a buffer of this length actually loops at.
 *
 * Rounding the length to whole samples moves the frequency by a fraction of a
 * cent; this says where it landed rather than where it was asked for.
 */
export function droneFrequency(frequency: number, sampleRate: number, seconds = 4): number {
  const buffer = droneBuffer(frequency, sampleRate, { seconds });
  if (buffer.length === 0) return 0;
  const period = sampleRate / frequency;
  const cycles = Math.round(buffer.length / period);
  return (cycles * sampleRate) / buffer.length;
}
