"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 */
import type { KeyName } from "@/lib/fretlab/types";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { PianoMap } from "@/components/fretlab/PianoMap";
import { majorScale, scaleShape } from "@/lib/fretlab/theory";

export function TheoryLesson({ rootKey }: { rootKey: KeyName }) {
  const scale = majorScale(rootKey);
  const degrees = ["1", "2", "3", "4", "5", "6", "7"];
  const roles = [
    "home",
    "motion",
    "major colour",
    "tension",
    "anchor",
    "warmth",
    "leading tone",
  ];
  return (
    <section className="theory-lesson">
      <header>
        <p className="kicker">Theory you can see and play</p>
        <h2>Why {rootKey} major works</h2>
        <p>
          The scale is not a shape; it is a distance recipe. The guitar gives
          that recipe several overlapping physical paths.
        </p>
      </header>
      <div className="theory-visual-grid">
        <div className="theory-fretboard">
          <div className="section-head">
            <h2>Across the guitar</h2>
            <span>Frets 0–7</span>
          </div>
          <Fretboard
            notes={scaleShape(rootKey, 0, 7)}
            low={0}
            high={7}
            labelMode="degree"
            rootKey={rootKey}
          />
          <p>
            Square roots mark every place the key feels finished. Follow the
            same degree across strings to see why a box is only one slice of the
            neck.
          </p>
        </div>
        <PianoMap rootKey={rootKey} />
      </div>
      <div className="degree-story">
        {scale.map((note, index) => (
          <div
            className={index === 0 || index === 4 || index === 6 ? "focus" : ""}
            key={note}
          >
            <span>{degrees[index]}</span>
            <strong>{note}</strong>
            <small>{roles[index]}</small>
          </div>
        ))}
      </div>
      <section className="interval-explainer">
        <div>
          <span>Whole</span>
          <strong>2 frets</strong>
          <p>
            On one string, a whole step skips one fret—like moving two piano
            keys.
          </p>
        </div>
        <i>→</i>
        <div>
          <span>Half</span>
          <strong>1 fret</strong>
          <p>
            A half step is the next fret—like two neighboring piano keys, white
            or black.
          </p>
        </div>
        <i>→</i>
        <div>
          <span>Octave</span>
          <strong>12 frets</strong>
          <p>
            The note name repeats, higher in pitch. On guitar it also appears on
            nearby strings.
          </p>
        </div>
      </section>
      <div className="guitar-piano-compare">
        <article>
          <span>On piano</span>
          <h3>Pitch moves in one direction</h3>
          <p>
            Each key is one semitone higher than the last, so interval distance
            is visually obvious.
          </p>
        </article>
        <article>
          <span>On guitar</span>
          <h3>Pitch moves across and along</h3>
          <p>
            Moving up a fret raises one semitone; changing strings relocates the
            same notes into new shapes.
          </p>
        </article>
        <article>
          <span>What to practise</span>
          <h3>Name the degree before the fret</h3>
          <p>
            Say “root, third, fifth” as you play. Function transfers between
            keys more reliably than memorized dot patterns.
          </p>
        </article>
      </div>
    </section>
  );
}
