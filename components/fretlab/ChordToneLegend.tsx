"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
import { CHORDS } from "@/lib/fretlab/library";

export function ChordToneLegend({ chord }: { chord: (typeof CHORDS)[number] }) {
  const labels = chord.formula.split(" · ");
  return (
    <div className="chord-tone-legend" aria-label="Chord tone legend">
      <span>
        <i className="root-shape" /> Root: {labels[0]}
      </span>
      {labels.slice(1).map((label, index) => (
        <span key={label}>
          <i className={`tone tone-${index + 1}`} /> {label}: chord tone
        </span>
      ))}
    </div>
  );
}
