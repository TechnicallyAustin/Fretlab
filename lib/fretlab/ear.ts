/**
 * Ear training: what a distance and a chord quality sound like.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and any
 * layer may import it. It decides what to ask and marks the answer; the screen
 * plays it through `audio.ts` and draws it, and nothing here touches the
 * browser — which is what lets the question-setting be tested rather than
 * clicked through.
 *
 * **It names things the way the fretboard already names them.** An interval a
 * learner has been reading as "the third" on the board is called the third
 * here too, and carries the same `NoteRole`, so what you hear and what you see
 * share one vocabulary rather than two.
 *
 * Answers are graded the way `Train` grades a tapped note — right first time,
 * or not — so an ear session records the same kind of accuracy as a shape
 * session and lands in the same review queue.
 */
import type { KeyName } from "./types";
import type { NoteRole } from "./noteRoles";
import { roleForDegree } from "./noteRoles";

/** A distance, named the way a musician names it. */
export type Interval = {
  semitones: number;
  name: string;
  /** The short label the fretboard uses for this degree. */
  degree: string;
  role: NoteRole;
};

/**
 * The intervals inside one octave.
 *
 * Ordered by size, which is also the order they are introduced: a learner who
 * can hear a fifth and an octave can already place most of what they play.
 */
export const INTERVALS: Interval[] = [
  { semitones: 1, name: "Minor second", degree: "♭2", role: roleForDegree(1) },
  { semitones: 2, name: "Major second", degree: "2", role: roleForDegree(2) },
  { semitones: 3, name: "Minor third", degree: "♭3", role: roleForDegree(3) },
  { semitones: 4, name: "Major third", degree: "3", role: roleForDegree(4) },
  { semitones: 5, name: "Perfect fourth", degree: "4", role: roleForDegree(5) },
  { semitones: 6, name: "Tritone", degree: "♭5", role: roleForDegree(6) },
  { semitones: 7, name: "Perfect fifth", degree: "5", role: roleForDegree(7) },
  { semitones: 8, name: "Minor sixth", degree: "♭6", role: roleForDegree(8) },
  { semitones: 9, name: "Major sixth", degree: "6", role: roleForDegree(9) },
  { semitones: 10, name: "Minor seventh", degree: "♭7", role: roleForDegree(10) },
  { semitones: 11, name: "Major seventh", degree: "7", role: roleForDegree(11) },
  { semitones: 12, name: "Octave", degree: "8", role: roleForDegree(0) },
];

/** A chord quality, by the shape of its stack rather than by its name. */
export type Quality = {
  id: string;
  name: string;
  intervals: number[];
  /** What makes it recognisable, in one line. */
  tell: string;
};

export const QUALITIES: Quality[] = [
  { id: "major", name: "Major", intervals: [0, 4, 7], tell: "Bright. The third sits high." },
  { id: "minor", name: "Minor", intervals: [0, 3, 7], tell: "Darker. The third drops a fret." },
  { id: "diminished", name: "Diminished", intervals: [0, 3, 6], tell: "Unsettled. The fifth drops too." },
  { id: "augmented", name: "Augmented", intervals: [0, 4, 8], tell: "Suspended, going nowhere. The fifth is raised." },
  { id: "dominant-seven", name: "Dominant 7th", intervals: [0, 4, 7, 10], tell: "Bright, but leaning somewhere." },
  { id: "major-seven", name: "Major 7th", intervals: [0, 4, 7, 11], tell: "Bright and soft. Nothing is leaning." },
  { id: "minor-seven", name: "Minor 7th", intervals: [0, 3, 7, 10], tell: "Dark and settled." },
];

export type EarMode = "intervals" | "qualities";

export type Question = {
  mode: EarMode;
  /** Semitones above the key's root, for the audio to play. */
  intervals: number[];
  /** The id of the right answer. */
  answer: string;
  /** Every option offered, the right one among them. */
  options: { id: string; name: string; detail: string }[];
};

/**
 * Deterministic shuffling.
 *
 * `Math.random` would make a session unrepeatable and a test impossible, and
 * the sequence a learner gets should be reproducible from a seed so a drill
 * can be retried rather than merely re-rolled.
 */
function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * How many choices to offer.
 *
 * Four is enough that a guess is worth 25% rather than 50%, and few enough to
 * read without hunting. A learner asked to pick from twelve intervals at once
 * is being tested on patience.
 */
export const CHOICES = 4;

/**
 * One question.
 *
 * The wrong answers are drawn from neighbours of the right one where there are
 * any — a major third against a minor third is the distinction worth drilling,
 * and a major third against an octave teaches nothing.
 */
export function askQuestion(mode: EarMode, seed: number): Question {
  if (mode === "intervals") {
    const ordered = INTERVALS;
    const index = seed % ordered.length;
    const answer = ordered[index];
    const near = ordered
      .filter((each) => each.semitones !== answer.semitones)
      .sort(
        (a, b) =>
          Math.abs(a.semitones - answer.semitones) -
          Math.abs(b.semitones - answer.semitones),
      )
      .slice(0, CHOICES - 1);
    return {
      mode,
      intervals: [0, answer.semitones],
      answer: String(answer.semitones),
      options: shuffle([answer, ...near], seed).map((each) => ({
        id: String(each.semitones),
        name: each.name,
        detail: each.degree,
      })),
    };
  }

  const index = seed % QUALITIES.length;
  const answer = QUALITIES[index];
  const others = QUALITIES.filter((each) => each.id !== answer.id)
    .sort(
      (a, b) =>
        Math.abs(a.intervals.length - answer.intervals.length) -
        Math.abs(b.intervals.length - answer.intervals.length),
    )
    .slice(0, CHOICES - 1);
  return {
    mode,
    intervals: answer.intervals,
    answer: answer.id,
    options: shuffle([answer, ...others], seed).map((each) => ({
      id: each.id,
      name: each.name,
      detail: each.tell,
    })),
  };
}

/** What the answer was, for the line shown after a guess. */
export function explain(question: Question, key: KeyName): string {
  if (question.mode === "intervals") {
    const interval = INTERVALS.find(
      (each) => String(each.semitones) === question.answer,
    );
    return interval
      ? `${interval.name} — degree ${interval.degree} in ${key}, ${interval.semitones} semitones up.`
      : "";
  }
  const quality = QUALITIES.find((each) => each.id === question.answer);
  return quality ? `${quality.name}. ${quality.tell}` : "";
}
