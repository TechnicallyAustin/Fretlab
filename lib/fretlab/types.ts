/**
 * Shared FretLab domain types.
 *
 * App Template Contract v1 §5: this is domain logic, not presentation. It sits
 * under lib/ so L2 sections and L3 elements can use it without importing from
 * a page, and so the boundary lint has somewhere legal to point.
 */

export type KeyName =
  | "C"
  | "G"
  | "D"
  | "A"
  | "E"
  | "B"
  | "F#"
  | "Db"
  | "Ab"
  | "Eb"
  | "Bb"
  | "F";
export type View =
  | "today"
  | "drills"
  | "train"
  | "keys"
  | "library"
  | "theory"
  | "chords"
  | "chord-detail"
  | "scales"
  | "scale-library-detail"
  | "songs"
  | "song-detail"
  | "progress"
  | "tuner"
  | "routines"
  | "runner"
  | "summary"
  | "grouped"
  | "drill-detail"
  | "key-detail"
  | "scale-detail"
  | "routine-detail"
  | "signin"
  | "onboarding";

export type Note = { s: number; f: number };
export type Tuning = {
  id: string;
  name: string;
  /** MIDI pitches for strings 1 through 6; index 0 is unused. */
  openMidi: readonly [number, number, number, number, number, number, number];
};
