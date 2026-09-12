/**
 * What a note *does* in the current key, and how that reads on the board.
 *
 * The old fretboard coloured every dot by its pitch class, so a seven-note
 * scale arrived as seven unrelated hues and the same shape changed colour in
 * every key. Colour carried no information a learner could use.
 *
 * Here the key keeps one hue (see palette.ts) and a note's *function* is
 * carried by form plus a lightness step inside that hue. Four meanings instead
 * of twelve, identical in every key, and legible without colour vision because
 * the shape alone separates them.
 */
import type { KeyName, Tuning } from "./types";
import { keyHue } from "./palette";
import { keyPc } from "./theory";
import { openPc, STANDARD_TUNING } from "./theory";

export type NoteRole = "root" | "third" | "fifth" | "seventh" | "scale" | "outside";

/** Semitones above the root -> the job that note is doing. */
export function roleForDegree(degree: number): NoteRole {
  switch (((degree % 12) + 12) % 12) {
    case 0:
      return "root";
    case 3:
    case 4:
      return "third";
    case 7:
      return "fifth";
    case 10:
    case 11:
      return "seventh";
    case 2:
    case 5:
    case 9:
      return "scale";
    default:
      // Chromatic passing tones: in the scale's gaps.
      return "outside";
  }
}

export function degreeAt(string: number, fret: number, rootKey: KeyName, tuning: Tuning = STANDARD_TUNING): number {
  return ((openPc(tuning, string) + fret - keyPc(rootKey)) % 12 + 12) % 12;
}

export function roleAt(string: number, fret: number, rootKey: KeyName): NoteRole {
  return roleForDegree(degreeAt(string, fret, rootKey));
}

/**
 * How each role is drawn.
 *
 * `shape` is the part that survives greyscale and colour blindness; `lightness`
 * and `chroma` place the note in the key's own hue so the board still reads as
 * one colour system.
 *
 *   root    filled square, brightest      the home note
 *   third   filled circle                 major/minor quality
 *   fifth   ring inside a filled circle   the anchor
 *   seventh filled circle, dimmer         colour tone
 *   scale   hollow circle                 passing scale tone
 */
export type RoleStyle = {
  shape: "square" | "circle" | "donut";
  filled: boolean;
  lightness: number;
  chroma: number;
  /** Short label for the legend. */
  legend: string;
};

export const ROLE_STYLE: Record<NoteRole, RoleStyle> = {
  root: { shape: "square", filled: true, lightness: 0.78, chroma: 0.17, legend: "Root" },
  third: { shape: "circle", filled: true, lightness: 0.7, chroma: 0.15, legend: "3rd" },
  fifth: { shape: "donut", filled: true, lightness: 0.71, chroma: 0.14, legend: "5th" },
  seventh: { shape: "circle", filled: true, lightness: 0.58, chroma: 0.1, legend: "7th" },
  scale: { shape: "circle", filled: false, lightness: 0.7, chroma: 0.05, legend: "Scale tone" },
  outside: { shape: "circle", filled: false, lightness: 0.55, chroma: 0.02, legend: "Passing" },
};

/** The note's colour: always the key's hue, stepped by role. */
export function roleColor(role: NoteRole, rootKey: KeyName, dimmed = false): string {
  const style = ROLE_STYLE[role];
  const hue = keyHue(rootKey);
  const lightness = dimmed ? style.lightness - 0.12 : style.lightness;
  const chroma = dimmed ? style.chroma * 0.35 : style.chroma;
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue})`;
}

/** The roles worth explaining under a board, in reading order. */
export const LEGEND_ROLES: NoteRole[] = ["root", "third", "fifth", "scale"];

/**
 * A named layer of notes, so a board can show a chord sitting inside a scale
 * and keep them visually separate. `emphasis` decides which layer reads first.
 */
export type NoteGroup = {
  id: string;
  label: string;
  /** `finger` is carried through for box drills; map drills omit it. */
  notes: { s: number; f: number; finger?: number }[];
  emphasis?: "primary" | "secondary";
};
