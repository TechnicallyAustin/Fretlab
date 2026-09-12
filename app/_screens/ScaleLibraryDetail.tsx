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
import { Ring } from "@/components/fretlab/Ring";
import { SCALES } from "@/lib/fretlab/library";
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
  go: (view: View) => void;
  selectedKey: KeyName;
  scaleId: string;
}) {
  const scale = SCALES.find((item) => item.id === scaleId) ?? SCALES[0];
  const [tab, setTab] = useState("Fretboard");
  const [position, setPosition] = useState(1);
  const windows = [
    [0, 4],
    [2, 6],
    [4, 8],
    [6, 10],
    [8, 12],
  ];
  const [low, high] = windows[position - 1];
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
            {scale.intervals.length} notes · five connected positions · root
            notes shown as squares
          </p>
          <button
            className="sample-play detail-audio"
            onClick={() => playTones(selectedKey, scale.intervals, true)}
          >
            ▶ Hear scale
          </button>
        </div>
        <Ring value={72} size={110} label="72 percent learned" />
      </section>
      <SegmentTabs
        labels={["Fretboard", "Degrees", "Harmony map", "Practice"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Fretboard" && (
        <>
          <div className="position-picker">
            {[1, 2, 3, 4, 5].map((item) => (
              <button
                className={position === item ? "active" : ""}
                onClick={() => setPosition(item)}
                key={item}
              >
                Position {item}
              </button>
            ))}
          </div>
          <div className="fretboard-stage">
            <div className="section-head">
              <h2>Position {position}</h2>
              <span>
                Frets {low}–{high}
              </span>
            </div>
            <Fretboard
              notes={intervalShape(selectedKey, scale.intervals, low, high)}
              low={low}
              high={high}
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
            <h2>Connect position {position} to harmony</h2>
            <ol>
              <li>Ascend the scale at 72 bpm.</li>
              <li>Play I–IV–V and name each chord tone.</li>
              <li>
                Improvise, landing on the active chord&apos;s nearest tone.
              </li>
            </ol>
          </div>
          <button className="primary-action" onClick={() => go("runner")}>
            Start practice →
          </button>
        </article>
      )}
    </div>
  );
}
