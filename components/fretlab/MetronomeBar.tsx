"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
/**
 * The metronome's transport and its visual pulse.
 *
 * The pulse used to be four dots on a CSS `animation-delay`, which meant it
 * showed a beat whether or not one was sounding. Here the lit dot is `beat`,
 * handed down from the audio clock, so the readout cannot disagree with the
 * click. A stopped metronome lights nothing rather than freezing mid-pulse.
 */
import type { Metronome } from "@/lib/fretlab/useMetronome";
import type { Subdivision } from "@/lib/fretlab/metronome";
import { SUBDIVISION_LABELS } from "@/lib/fretlab/metronome";

/** How far the −/+ buttons move the tempo. The labels derive from it, so the
    button cannot end up describing a step it does not take. */
const STEP = 4;

const NOTE_VALUES: { value: Subdivision; glyph: string }[] = [
  { value: 1, glyph: "♩" },
  { value: 2, glyph: "♫" },
  { value: 3, glyph: "♫₃" },
  { value: 4, glyph: "♬" },
];

export function MetronomeBar({
  metronome,
  subdivisions = true,
}: {
  metronome: Metronome;
  /** Hide the note-value row where there is no room for it. */
  subdivisions?: boolean;
}) {
  const { beat, bpm, countingIn, meter, running, sounding } = metronome;
  return (
    <div className="metronome-bar">
      <div
        className={`metronome ${running ? "clocked" : "idle"}`}
        role="img"
        aria-label={
          running
            ? `${bpm} beats per minute, beat ${beat + 1} of ${meter}`
            : "Metronome stopped"
        }
      >
        {Array.from({ length: meter }, (_, index) => (
          <i
            className={sounding && beat === index ? "active" : ""}
            key={index}
          />
        ))}
      </div>

      {countingIn ? <p className="metronome-countin">Count-in…</p> : null}

      <div className="transport">
        <button
          onClick={() => metronome.nudge(-STEP)}
          aria-label={`Slower by ${STEP} bpm`}
        >
          −{STEP}
          <small>bpm</small>
        </button>
        <button className="pause" onClick={metronome.toggle}>
          {running ? "Pause" : "Start click"}
          <small>{bpm} bpm</small>
        </button>
        <button
          onClick={() => metronome.nudge(STEP)}
          aria-label={`Faster by ${STEP} bpm`}
        >
          +{STEP}
          <small>bpm</small>
        </button>
      </div>

      <div className="metronome-options">
        <button onClick={metronome.tap}>Tap tempo</button>
        {subdivisions
          ? NOTE_VALUES.map(({ value, glyph }) => (
              <button
                className={metronome.subdivision === value ? "active" : ""}
                onClick={() => metronome.setSubdivision(value)}
                aria-label={SUBDIVISION_LABELS[value]}
                aria-pressed={metronome.subdivision === value}
                key={value}
              >
                {glyph}
              </button>
            ))
          : null}
      </div>
    </div>
  );
}
