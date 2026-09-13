"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation.
 */
/**
 * The design kit's fretboard API, drawn by the app's own renderer.
 *
 * The kit ships a neck renderer of its own. This app's is kept instead,
 * because it carries work the kit's has no equivalent for: type sized so it
 * survives being scaled (FD-01, where a "13px" label drew at 8), windowing to
 * the column it is drawn in (FD-05), the fingering rules in `hand.ts` (FD-06),
 * the CAGED position tables (FL-12), alternate tunings and left-handed boards
 * (FL-19), and the keyboard grid (FL-16).
 *
 * So this is an adapter rather than a component: the kit's cards keep their
 * `Marker` prop shape, and what draws underneath is the renderer with the
 * music in it. Every card thumbnail gets that work for free.
 *
 * **The two conventions differ and this is the only place that matters.** The
 * kit numbers strings from 0 at the top row as drawn — the high E. The app
 * numbers them 1 for the high e through 6 for the low E, the way a guitarist
 * does. One is the other plus one.
 */
import type { KeyName, Note, Tuning } from "@/lib/fretlab/types";
import type { NoteGroup } from "@/lib/fretlab/noteRoles";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { roleForDegree } from "@/lib/fretlab/noteRoles";
import { STANDARD_TUNING, keyPc, openPc } from "@/lib/fretlab/theory";

export type MarkerTone = "root" | "third" | "fifth" | "scale" | "ghost";

export interface Marker {
  id?: string;
  /** 0 is the top row as drawn: the high E. */
  stringIndex: number;
  fret: number;
  label?: string;
  tone?: MarkerTone;
}

/** The kit's string index, as a guitarist's string number. */
export function stringOf(marker: Marker): number {
  return marker.stringIndex + 1;
}

function toNotes(markers: readonly Marker[]): Note[] {
  return markers.map((marker) => ({ s: stringOf(marker), f: marker.fret }));
}

/**
 * A ghost marker is context rather than the lesson, which is exactly what the
 * app's `NoteGroup` emphasis already means — so the two layers map across.
 */
function toGroups(markers: readonly Marker[]): NoteGroup[] | undefined {
  const ghosts = markers.filter((marker) => marker.tone === "ghost");
  if (ghosts.length === 0) return undefined;
  const lead = markers.filter((marker) => marker.tone !== "ghost");
  return [
    { id: "lead", label: "", emphasis: "primary", notes: toNotes(lead) },
    { id: "ghost", label: "", emphasis: "secondary", notes: toNotes(ghosts) },
  ];
}

export function FretboardMini({
  markers = [],
  fromFret,
  toFret,
  ariaLabel,
  path,
  showStringLabels,
  rootKey = "G",
}: {
  markers?: Marker[];
  fromFret?: number;
  toFret?: number;
  ariaLabel?: string;
  /** Marker ids in playing order, drawn as a numbered trail. */
  path?: string[];
  /** Accepted for the kit's prop shape; the renderer always labels strings,
      because a board starting at fret 7 read as nonsense without them. */
  showStringLabels?: boolean;
  rootKey?: Parameters<typeof Fretboard>[0]["rootKey"];
}) {
  void showStringLabels;
  const frets = markers.map((marker) => marker.fret);
  // Fall back to the markers' own span, so a card that passes no window still
  // draws the shape rather than the whole neck.
  const low = fromFret ?? (frets.length ? Math.min(...frets) : 0);
  const high = toFret ?? (frets.length ? Math.max(...frets) : 4);
  const groups = toGroups(markers);

  // A path is the app's own play-order rendering: the renderer numbers the
  // notes and draws the trail between them, which is what FL-14 built.
  const ordered = path?.length
    ? markers
        .filter((marker) => marker.id && path.includes(marker.id))
        .map((marker) => ({
          s: stringOf(marker),
          f: marker.fret,
          order: path.indexOf(marker.id as string) + 1,
        }))
        .sort((a, b) => a.order - b.order)
    : null;

  return (
    <Fretboard
      notes={ordered ?? (groups ? undefined : toNotes(markers))}
      groups={ordered ? undefined : groups}
      low={low}
      high={Math.max(high, low + 3)}
      mini
      labelMode={ordered ? "order" : "note"}
      caption={ariaLabel}
      rootKey={rootKey}
    />
  );
}

/**
 * App notes as kit markers.
 *
 * The card components in the kit take `Marker[]`; the app stores `Note[]`.
 * This is the one place that converts, including the string-index flip and
 * the tone, which comes from the note's degree against the key — the same
 * `NoteRole` the board itself paints with, so a card thumbnail and the full
 * board colour the same note the same way.
 */
export function markersFrom(
  notes: readonly Note[],
  rootKey: KeyName,
  tuning: Tuning = STANDARD_TUNING,
): Marker[] {
  return notes.map((note) => {
    const degree = (openPc(tuning, note.s) + note.f - keyPc(rootKey) + 120) % 12;
    // The kit paints four roles; the app names five. A seventh is a scale
    // tone that is not the root, third or fifth, so that is what it becomes
    // here — narrowing, not renaming, and only in the card thumbnails. The
    // full board still draws it as a seventh.
    const role = roleForDegree(degree);
    const tone: MarkerTone =
      role === "outside" ? "ghost" : role === "seventh" ? "scale" : role;
    return {
      id: `s${note.s}f${note.f}`,
      stringIndex: note.s - 1,
      fret: note.f,
      tone,
    };
  });
}
