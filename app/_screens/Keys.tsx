"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { CircleOfFifths } from "@/app/_sections/CircleOfFifths";
import { FIFTHS, majorScale } from "@/lib/fretlab/theory";
import { LibraryLaunchpad } from "@/app/_sections/LibraryLaunchpad";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { cssVars, palette } from "@/lib/fretlab/palette";

export function Keys({
  selectedKey,
  setSelectedKey,
  go,
}: {
  selectedKey: KeyName;
  setSelectedKey: (key: KeyName) => void;
  go: (view: View) => void;
}) {
  const scale = majorScale(selectedKey);
  const qualities = ["", "m", "m", "", "", "m", "dim"];
  const romans = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
  const index = FIFTHS.indexOf(selectedKey);
  const neighbours = [FIFTHS[(index + 11) % 12], FIFTHS[(index + 1) % 12]];
  return (
    <div className="screen-content keys-screen">
      <StatusBar end="Keys" />
      <CircleOfFifths selectedKey={selectedKey} onSelect={setSelectedKey} />
      <section className="section chord-section">
        <div className="section-head">
          <h2>Its seven chords</h2>
          <button onClick={() => go("key-detail")}>Open key →</button>
        </div>
        <div className="chord-chips">
          {scale.map((note, index) => (
            <span key={note}>
              <i
                style={{
                  background: palette(
                    FIFTHS[
                      (FIFTHS.indexOf(selectedKey) +
                        [0, 2, 4, -1, 1, 3, 5][index] +
                        12) %
                        12
                    ],
                  ).bright,
                }}
              />
              <small>{romans[index]}</small>
              {note}
              {qualities[index]}
            </span>
          ))}
        </div>
        <p>
          Keys next to each other on the wheel share six of seven notes. That
          overlap is why moving one step around the circle sounds close, not
          abrupt.
        </p>
      </section>
      <aside className="desktop-key-relations">
        <div className="section-head">
          <h2>Closest harmonic neighbours</h2>
          <span>6 shared notes</span>
        </div>
        <div>
          {neighbours.map((key) => (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              style={cssVars(key)}
            >
              <span className="relation-key">{key}</span>
              <span>
                <strong>{key} major</strong>
                <small>{majorScale(key).join(" · ")}</small>
              </span>
              <b>→</b>
            </button>
          ))}
        </div>
        <p>
          Move clockwise for more forward pull; move counter-clockwise for a
          softer return.
        </p>
      </aside>
      <LibraryLaunchpad go={go} />
    </div>
  );
}
