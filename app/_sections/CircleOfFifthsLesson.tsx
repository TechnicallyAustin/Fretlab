"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 */
import type { KeyName } from "@/lib/fretlab/types";
import { CircleOfFifths } from "@/app/_sections/CircleOfFifths";
import { FIFTHS } from "@/lib/fretlab/theory";

export function CircleOfFifthsLesson({
  selectedKey,
  onSelect,
}: {
  selectedKey: KeyName;
  onSelect: (key: KeyName) => void;
}) {
  const selectedIndex = FIFTHS.indexOf(selectedKey);
  const clockwise = FIFTHS[(selectedIndex + 1) % FIFTHS.length];
  const counterClockwise = FIFTHS[(selectedIndex + 11) % FIFTHS.length];
  return (
    <section className="circle-lesson">
      <header>
        <p className="kicker">Start here · no theory assumed</p>
        <h2>The Circle of Fifths is a map of nearby keys.</h2>
        <p>
          Each step clockwise moves up a perfect fifth, seven half steps. Keys
          beside each other share six of seven notes, so they sound closely
          related.
        </p>
      </header>
      <div className="circle-lesson-grid">
        <div>
          <CircleOfFifths selectedKey={selectedKey} onSelect={onSelect} />
          <p className="circle-caption">
            The outer ring shows major keys. The inner labels show each
            key&apos;s relative minor: the same notes, with a different home
            note.
          </p>
        </div>
        <div className="circle-breakdown">
          <article>
            <span>01 · Find the home key</span>
            <strong>{selectedKey} is the center of this example.</strong>
            <p>
              The selected key is the note that feels finished. Count degrees
              from it: <b>1</b> is home, then 2, 3, 4, 5, 6, and 7.
            </p>
          </article>
          <article>
            <span>02 · Read the positions</span>
            <strong>
              Clockwise: {clockwise} · counter-clockwise: {counterClockwise}
            </strong>
            <p>
              Clockwise adds one sharp and moves to the 5th degree.
              Counter-clockwise moves to the 4th degree and usually adds a flat.
              These are neighboring positions, not random names.
            </p>
          </article>
          <article>
            <span>03 · Use the degrees</span>
            <strong>I · ii · iii · IV · V · vi · vii°</strong>
            <p>
              Roman numerals label the seven chords built from the seven scale
              degrees. Uppercase means major, lowercase means minor, and the
              small circle means diminished.
            </p>
          </article>
        </div>
      </div>
      <div className="circle-steps">
        <div>
          <strong>1</strong>
          <span>Choose a key</span>
          <small>Tap any outer label.</small>
        </div>
        <div>
          <strong>2</strong>
          <span>Notice its neighbors</span>
          <small>They share most notes.</small>
        </div>
        <div>
          <strong>3</strong>
          <span>Build from degrees</span>
          <small>1, 3, and 5 make a major triad.</small>
        </div>
      </div>
    </section>
  );
}
