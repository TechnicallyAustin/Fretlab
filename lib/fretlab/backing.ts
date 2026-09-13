/**
 * Something to play over.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and any
 * layer may import it. It decides *what* sounds and *when*; `useBacking.ts`
 * drives it off the metronome's clock and `audio.ts` makes the sound.
 *
 * "Free play over a drone" has been a routine step since FL-10 and there was
 * nothing to play over. This is that, plus the two progressions almost all
 * beginner practice actually happens on.
 *
 * Chords are given as degrees of the key rather than as named chords, so a
 * progression is one definition rather than twelve, and it transposes by
 * construction.
 */

/** A chord in a progression: which degree of the key, and its quality. */
export type BackingChord = {
  /** 0-based scale degree. 0 is the tonic, 4 is the fifth. */
  degree: number;
  quality: "major" | "minor" | "diminished" | "dominant-seven" | "minor-seven";
  /** Bars this chord is held for. */
  bars: number;
  /** "I", "ii", "V7" — what a learner should be counting. */
  label: string;
};

export type Progression = {
  id: string;
  name: string;
  /** What it is for, in the terms a beginner would recognise. */
  about: string;
  chords: BackingChord[];
};

/** Semitones above the key's root for each scale degree of a major key. */
const DEGREE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/** Stacked thirds, by quality. */
const QUALITY_INTERVALS: Record<BackingChord["quality"], number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  "dominant-seven": [0, 4, 7, 10],
  "minor-seven": [0, 3, 7, 10],
};

export const PROGRESSIONS: Progression[] = [
  {
    id: "drone",
    name: "Drone",
    about: "The root, held. Everything you play is measured against it.",
    chords: [{ degree: 0, quality: "major", bars: 4, label: "I" }],
  },
  {
    id: "one-four-five",
    name: "I – IV – V",
    about: "The three chords behind thousands of songs.",
    chords: [
      { degree: 0, quality: "major", bars: 2, label: "I" },
      { degree: 3, quality: "major", bars: 1, label: "IV" },
      { degree: 4, quality: "major", bars: 1, label: "V" },
    ],
  },
  {
    id: "two-five-one",
    name: "ii – V – I",
    about: "The cadence most jazz and a lot of pop resolves through.",
    chords: [
      { degree: 1, quality: "minor-seven", bars: 1, label: "ii7" },
      { degree: 4, quality: "dominant-seven", bars: 1, label: "V7" },
      { degree: 0, quality: "major", bars: 2, label: "I" },
    ],
  },
  {
    id: "twelve-bar",
    name: "12-bar blues",
    about: "The form. Count the bars and you will hear the change coming.",
    chords: [
      { degree: 0, quality: "dominant-seven", bars: 4, label: "I7" },
      { degree: 3, quality: "dominant-seven", bars: 2, label: "IV7" },
      { degree: 0, quality: "dominant-seven", bars: 2, label: "I7" },
      { degree: 4, quality: "dominant-seven", bars: 1, label: "V7" },
      { degree: 3, quality: "dominant-seven", bars: 1, label: "IV7" },
      { degree: 0, quality: "dominant-seven", bars: 1, label: "I7" },
      { degree: 4, quality: "dominant-seven", bars: 1, label: "V7" },
    ],
  },
];

export function progressionById(id: string): Progression | undefined {
  return PROGRESSIONS.find((each) => each.id === id);
}

/** Bars before a progression repeats. */
export function lengthInBars(progression: Progression): number {
  return progression.chords.reduce((sum, chord) => sum + chord.bars, 0);
}

/**
 * The chord sounding on a given bar, counting from the start and wrapping.
 *
 * Bars rather than beats: a backing chord changes on a downbeat, and taking
 * the bar number straight from the metronome's own position is what keeps the
 * loop in time with the click rather than merely near it.
 */
export function chordAtBar(progression: Progression, bar: number): BackingChord {
  const total = lengthInBars(progression);
  let position = ((bar % total) + total) % total;
  for (const chord of progression.chords) {
    if (position < chord.bars) return chord;
    position -= chord.bars;
  }
  // Unreachable while `total` is the sum of the bars, which it is.
  return progression.chords[0];
}

/**
 * The semitones above the key's root that a chord sounds.
 *
 * Built by stacking the quality's intervals on the degree's own root, so a ii7
 * in G is the same shape as a ii7 in any other key without a second table.
 */
export function chordIntervals(chord: BackingChord): number[] {
  const root = DEGREE_SEMITONES[chord.degree % DEGREE_SEMITONES.length];
  return QUALITY_INTERVALS[chord.quality].map((interval) => root + interval);
}
