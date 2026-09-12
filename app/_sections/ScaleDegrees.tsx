"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 *
 * The degree-by-degree breakdown of a key: what each note is called, what it
 * does, how it sounds, and the chord built on it.
 */
import { useState } from "react";
import type { KeyName } from "@/lib/fretlab/types";
import { FUNCTION_BLURB, degreesInKey } from "@/lib/fretlab/degrees";
import { roleForDegree, ROLE_STYLE } from "@/lib/fretlab/noteRoles";

export function ScaleDegrees({
  rootKey,
  onHear,
}: {
  rootKey: KeyName;
  onHear?: (semitones: number) => void;
}) {
  const degrees = degreesInKey(rootKey);
  const [open, setOpen] = useState<number | null>(1);

  return (
    <section className="scale-degrees">
      <div className="section-head">
        <h2>The seven degrees of {rootKey} major</h2>
        <span>Tap a degree for what it does</span>
      </div>

      <ol className="degree-list">
        {degrees.map((degree) => {
          const role = roleForDegree(degree.semitones);
          const expanded = open === degree.number;
          return (
            <li key={degree.number} data-function={degree.function}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : degree.number)}
              >
                <span className="degree-number" data-role={role}>
                  {degree.number}
                </span>
                <span className="degree-note">{degree.note}</span>
                <span className="degree-name">
                  <strong>{degree.name}</strong>
                  <small>{degree.interval} · {degree.solfege}</small>
                </span>
                <span className="degree-chord">{degree.chord}</span>
                <b aria-hidden="true">{expanded ? "−" : "+"}</b>
              </button>

              {expanded && (
                <div className="degree-detail">
                  <p className="degree-character">{degree.character}</p>
                  <dl>
                    <div>
                      <dt>Job in the key</dt>
                      <dd>
                        {degree.function}
                        <small>{FUNCTION_BLURB[degree.function]}</small>
                      </dd>
                    </div>
                    <div>
                      <dt>Chord here</dt>
                      <dd>
                        {degree.chord}
                        <small>{degree.chordQuality} · {degree.roman}</small>
                      </dd>
                    </div>
                    <div>
                      <dt>On the board</dt>
                      <dd>
                        {ROLE_STYLE[role].legend}
                        <small>
                          {role === "root"
                            ? "Square"
                            : role === "fifth"
                              ? "Ring inside a circle"
                              : ROLE_STYLE[role].filled
                                ? "Filled circle"
                                : "Hollow circle"}
                        </small>
                      </dd>
                    </div>
                  </dl>
                  <p className="degree-use">{degree.use}</p>
                  {onHear && (
                    <button
                      type="button"
                      className="text-action"
                      onClick={() => onHear(degree.semitones)}
                    >
                      ▶ Hear {degree.note} against {rootKey}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
