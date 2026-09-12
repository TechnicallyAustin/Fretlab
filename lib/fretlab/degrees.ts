/**
 * What each degree of the major scale actually does.
 *
 * The scale screens previously showed a shape and little else: a learner could
 * see seven dots without learning why the 4th feels like leaving home or why
 * the 7th cannot be left hanging. This is that missing context, in one place so
 * the scale screens, the key map and the theory lessons all say the same thing.
 */
import type { KeyName } from "./types";
import { majorScale } from "./theory";

export type DegreeInfo = {
  /** 1-7. */
  number: number;
  /** Semitones above the tonic. */
  semitones: number;
  roman: string;
  name: string;
  solfege: string;
  interval: string;
  /** The job it does in the key. */
  function: "Tonic" | "Pre-dominant" | "Dominant";
  /** How it sounds, in a sentence a player can act on. */
  character: string;
  /** The diatonic chord built on this degree. */
  chordSuffix: string;
  chordQuality: string;
  /** What to do with it while practising. */
  use: string;
};

export const MAJOR_DEGREES: DegreeInfo[] = [
  {
    number: 1,
    semitones: 0,
    roman: "I",
    name: "Tonic",
    solfege: "Do",
    interval: "Root",
    function: "Tonic",
    character: "Home. Everything else is heard in relation to this note.",
    chordSuffix: "maj7",
    chordQuality: "Major",
    use: "Land here to end a phrase. Find it on every string before you play anything else.",
  },
  {
    number: 2,
    semitones: 2,
    roman: "ii",
    name: "Supertonic",
    solfege: "Re",
    interval: "Major 2nd",
    function: "Pre-dominant",
    character: "Restless but mild. It leans toward the 5th rather than resolving.",
    chordSuffix: "m7",
    chordQuality: "Minor",
    use: "Use it as a stepping stone between the root and the 3rd.",
  },
  {
    number: 3,
    semitones: 4,
    roman: "iii",
    name: "Mediant",
    solfege: "Mi",
    interval: "Major 3rd",
    function: "Tonic",
    character: "The note that makes the key sound major. Flatten it and the key turns minor.",
    chordSuffix: "m7",
    chordQuality: "Minor",
    use: "Target it to make a line sound bright. It is the quality note of the chord.",
  },
  {
    number: 4,
    semitones: 5,
    roman: "IV",
    name: "Subdominant",
    solfege: "Fa",
    interval: "Perfect 4th",
    function: "Pre-dominant",
    character: "The step away from home. It opens the harmony up.",
    chordSuffix: "maj7",
    chordQuality: "Major",
    use: "Move to it when you want lift, then walk down to the 3rd.",
  },
  {
    number: 5,
    semitones: 7,
    roman: "V",
    name: "Dominant",
    solfege: "Sol",
    interval: "Perfect 5th",
    function: "Dominant",
    character: "The strongest pull back to the root. The anchor of the chord.",
    chordSuffix: "7",
    chordQuality: "Dominant",
    use: "Use it to set up a return home. Root and 5th together outline the key.",
  },
  {
    number: 6,
    semitones: 9,
    roman: "vi",
    name: "Submediant",
    solfege: "La",
    interval: "Major 6th",
    function: "Tonic",
    character: "The relative minor centre. Same notes, darker gravity.",
    chordSuffix: "m7",
    chordQuality: "Minor",
    use: "Start a phrase here to make the same scale sound minor.",
  },
  {
    number: 7,
    semitones: 11,
    roman: "vii°",
    name: "Leading tone",
    solfege: "Ti",
    interval: "Major 7th",
    function: "Dominant",
    character: "A half step below home, and it wants to get there. Do not leave it hanging.",
    chordSuffix: "m7♭5",
    chordQuality: "Half-diminished",
    use: "Resolve it upward to the root. It is the sharpest tension in the key.",
  },
];

/** The degree table with the actual note names filled in for a key. */
export function degreesInKey(key: KeyName): (DegreeInfo & { note: string; chord: string })[] {
  const notes = majorScale(key);
  return MAJOR_DEGREES.map((degree, index) => ({
    ...degree,
    note: notes[index],
    chord: `${notes[index]}${degree.chordSuffix}`,
  }));
}

/** Relative minor of a major key is built on its 6th degree. */
export function relativeMinor(key: KeyName): string {
  return majorScale(key)[5];
}

export const FUNCTION_BLURB: Record<DegreeInfo["function"], string> = {
  Tonic: "At rest. Safe to land on.",
  "Pre-dominant": "In motion. Leads onward.",
  Dominant: "Under tension. Wants to resolve home.",
};
