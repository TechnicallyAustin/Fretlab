"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { PC_KEY, intervalShape, keyPc, majorScale } from "@/lib/fretlab/theory";
import { SCALES } from "@/lib/fretlab/library";
import {
  positionNotes,
  positionWindow,
  positionsFor,
} from "@/lib/fretlab/positions";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { ScaleDegrees } from "@/app/_sections/ScaleDegrees";
import { cssVars } from "@/lib/fretlab/palette";
import { playTones } from "@/lib/fretlab/audio";
import { useState } from "react";

export function ScaleLibraryDetail({
  go,
  selectedKey,
  scaleId,
}: {
  /** Takes an id too: the runner needs to know what it is running. */
  go: (view: View, id?: string) => void;
  selectedKey: KeyName;
  scaleId: string;
}) {
  const scale = SCALES.find((item) => item.id === scaleId) ?? SCALES[0];
  const [tab, setTab] = useState("Fretboard");
  const [positionIndex, setPositionIndex] = useState(0);

  // These were five fixed windows — [0,4], [2,6], [4,8] … — slid up the neck
  // and flooded with every matching note. That is not a position: it is not
  // the shape anyone teaches, it moves with no relation to the key, and
  // nothing made it contain a root. Scales with a written table get their real
  // shapes; the rest keep the sliding window, honestly labelled.
  const positions = positionsFor(scale.id);
  const position = positions[Math.min(positionIndex, positions.length - 1)];
  const window = position
    ? positionWindow(position, selectedKey)
    : { low: positionIndex * 2, high: positionIndex * 2 + 4 };
  const { low, high } = window;
  const notes = position
    ? positionNotes(position, selectedKey)
    : intervalShape(selectedKey, scale.intervals, low, high);

  // The shape after this one, for the connecting drill. Five positions are a
  // cycle, so the one after the last is the first again.
  const next = positions.length
    ? positions[(positionIndex + 1) % positions.length]
    : null;
  const nextWindow = next ? positionWindow(next, selectedKey) : null;
  const keyScale = majorScale(selectedKey);
  const keyChords = keyScale.map(
    (note, index) => `${note}${["", "m", "m", "", "", "m", "dim"][index]}`,
  );
  return (
    <div
      className="screen-content detail-screen scale-library-detail"
      style={cssVars(selectedKey)}
    >
      <AppHeader
        title={`${selectedKey} ${scale.name}`}
        meta="Scale library"
        onBack={() => go("scales")}
      />
      <section className="scale-detail-banner">
        <div>
          <p className="kicker">
            {scale.level} · {scale.mood}
          </p>
          <h2>{scale.formula}</h2>
          <p>
            {scale.intervals.length} notes ·{" "}
            {positions.length
              ? `${positions.length} connected positions`
              : "shown across the neck"}{" "}
            · root notes shown as squares
          </p>
          <button
            className="sample-play detail-audio"
            onClick={() => playTones(selectedKey, scale.intervals, true)}
          >
            ▶ Hear scale
          </button>
        </div>
      </section>
      <SegmentTabs
        labels={["Fretboard", "Degrees", "Harmony map", "Practice"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Fretboard" && (
        <>
          <div className="position-picker">
            {(positions.length ? positions : [1, 2, 3, 4, 5]).map((item, i) => (
              <button
                className={positionIndex === i ? "active" : ""}
                onClick={() => setPositionIndex(i)}
                key={typeof item === "number" ? item : item.id}
              >
                {typeof item === "number" ? `Position ${item}` : item.name}
              </button>
            ))}
          </div>
          <div className="fretboard-stage">
            <div className="section-head">
              <h2>
                {position ? position.name : `Position ${positionIndex + 1}`}
                {position?.shape ? ` · ${position.shape}` : ""}
              </h2>
              <span>
                Frets {low}–{high}
              </span>
            </div>
            <Fretboard
              notes={notes}
              low={window.low <= 1 ? 0 : low}
              high={high}
              scale={scale}
              labelMode="degree"
              rootKey={selectedKey}
            />
          </div>
          <section className="position-overlap">
            <div>
              <span>Previous overlap</span>
              <strong>
                {Math.max(0, low - 2)}–{low}
              </strong>
            </div>
            <i />
            <div>
              <span>Current window</span>
              <strong>
                {low}–{high}
              </strong>
            </div>
            <i />
            <div>
              <span>Next overlap</span>
              <strong>
                {high}–{Math.min(12, high + 2)}
              </strong>
            </div>
          </section>
        </>
      )}
      {tab === "Degrees" && (
        <ScaleDegrees
          rootKey={selectedKey}
          onHear={(semitones) => playTones(selectedKey, [0, semitones], true)}
        />
      )}
      {tab === "Harmony map" && (
        <>
          <article className="tab-copy">
            <h2>A scale is the source; chords are selected stacks</h2>
            <p>
              Build a chord from every {selectedKey} scale degree by taking
              alternating notes. The shape changes, but every chord tone still
              comes from the same key map.
            </p>
            <div className="formula-steps">
              {scale.intervals.map((interval, index) => (
                <span key={interval}>
                  <strong>{index + 1}</strong>
                  <small>{interval} semitones</small>
                </span>
              ))}
            </div>
          </article>
          <section className="scale-to-chords">
            <div className="section-head">
              <h2>{selectedKey} major harmony</h2>
              <span>Tap a chord to hear it</span>
            </div>
            <div>
              {keyChords.map((chord, index) => (
                <button
                  onClick={() =>
                    playTones(
                      PC_KEY[
                        (keyPc(selectedKey) + [0, 2, 4, 5, 7, 9, 11][index]) %
                          12
                      ],
                      index === 1 || index === 2 || index === 5
                        ? [0, 3, 7]
                        : index === 6
                          ? [0, 3, 6]
                          : [0, 4, 7],
                    )
                  }
                  key={chord}
                >
                  <span>
                    {["I", "ii", "iii", "IV", "V", "vi", "vii°"][index]}
                  </span>
                  <strong>{chord}</strong>
                  <small>
                    {
                      [
                        "home",
                        "leaves",
                        "color",
                        "opens",
                        "pulls home",
                        "relative minor",
                        "tension",
                      ][index]
                    }
                  </small>
                  <b>▶</b>
                </button>
              ))}
            </div>
            <p>
              Practice link: target the nearest note from each chord while
              staying inside the scale position above.
            </p>
          </section>
        </>
      )}
      {tab === "Practice" && (
        <article className="chord-practice">
          <div>
            <p className="kicker">Seven-minute scale-to-chord lab</p>
            <h2>
              Connect {position ? position.name : `position ${positionIndex + 1}`}
              {next ? ` to ${next.name}` : " to harmony"}
            </h2>
            {/* The point of a position system is the join between shapes, so
                the drill names the shape you are leaving and the one you are
                arriving at, with the fret they share. */}
            <ol>
              <li>Ascend {position ? position.name : "the shape"} and stop on the top root.</li>
              {next && nextWindow ? (
                <li>
                  Shift to {next.name} at fret {nextWindow.low}, and descend it.
                </li>
              ) : (
                <li>Play I–IV–V and name each chord tone.</li>
              )}
              <li>
                Improvise across both, landing on the nearest chord tone.
              </li>
            </ol>
          </div>
          <button
            className="primary-action"
            onClick={() => go("runner", "two-position")}
          >
            Start practice →
          </button>
        </article>
      )}
    </div>
  );
}
