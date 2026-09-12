"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { PianoMap } from "@/components/fretlab/PianoMap";
import { ScaleDegrees } from "@/app/_sections/ScaleDegrees";
import { playTones } from "@/lib/fretlab/audio";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { TheoryLesson } from "@/app/_sections/TheoryLesson";
import { majorScale, scaleShape } from "@/lib/fretlab/theory";
import { useState } from "react";
import { useGuitarSetup } from "@/lib/fretlab/GuitarSetup";

export function KeyDetail({
  go,
  selectedKey,
}: {
  go: (view: View, id?: string) => void;
  selectedKey: KeyName;
}) {
  const { tuning } = useGuitarSetup();
  const [tab, setTab] = useState("Scales");
  const scale = majorScale(selectedKey);
  const roles = [
    "home",
    "passing",
    "bright",
    "pull",
    "anchor",
    "soft",
    "leaning",
  ];
  return (
    <div className="screen-content key-detail-screen">
      <StatusBar end="Keys" />
      <div className="key-detail-hero">
        <span className="key-badge">{selectedKey}</span>
        <div>
          <h1>{selectedKey} major</h1>
          <p>
            {selectedKey === "G"
              ? "One sharp"
              : `${scale.filter((n) => n.includes("#") || n.includes("b")).length} accidentals`}{" "}
            · relative minor {scale[5]}
          </p>
        </div>
      </div>
      <SegmentTabs
        labels={["Scales", "Chords", "Theory"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Scales" && (
        <>
          <section className="section">
            <div className="section-head">
              <h2>The seven notes, and what each one does</h2>
            </div>
            <div className="degree-strip">
              {scale.map((note, i) => (
                <div className={i === 0 || i === 4 ? "strong" : ""} key={note}>
                  <strong>{note}</strong>
                  <small>{roles[i]}</small>
                </div>
              ))}
            </div>
          </section>
          <ScaleDegrees
            rootKey={selectedKey}
            onHear={(semitones) => playTones(selectedKey, [0, semitones], true)}
          />
          <section className="section shape-section">
            <div className="section-head">
              <h2>Five shapes, one scale</h2>
              <button onClick={() => go("scale-library-detail", "major")}>Open major scale →</button>
            </div>
            <div className="shape-row">
              {[
                [0, 3],
                [2, 5],
                [4, 7],
                [6, 9],
                [8, 12],
              ].map(([low, high], i) => (
                <button
                  className={i === 1 ? "active" : ""}
                  onClick={() => go("scale-library-detail", "major")}
                  key={i}
                >
                  <Fretboard
                    notes={scaleShape(selectedKey, low, high, tuning)}
                    low={low}
                    high={high}
                    mini
                    rootKey={selectedKey}
                  />
                  <span>{["I", "II", "III", "IV", "V"][i]}</span>
                </button>
              ))}
            </div>
            <p>
              Those five shapes are the same seven notes seen from five places
              on the neck. Learn where they overlap and the neck stops being
              twelve separate frets.
            </p>
          </section>
        </>
      )}
      {tab === "Chords" && (
        <section className="harmony-lesson">
          <header>
            <h2>Seven chords come from seven scale degrees</h2>
            <p>
              Stack every other note of the scale. The available thirds
              determine whether each chord is major, minor or diminished.
            </p>
          </header>
          <div>
            {scale.map((note, i) => (
              <article key={note}>
                <span>{["I", "ii", "iii", "IV", "V", "vi", "vii°"][i]}</span>
                <strong>
                  {note}
                  {["", "m", "m", "", "", "m", "dim"][i]}
                </strong>
                <small>
                  {
                    [
                      "home",
                      "departure",
                      "colour",
                      "open",
                      "tension",
                      "relative minor",
                      "leading",
                    ][i]
                  }
                </small>
              </article>
            ))}
          </div>
          <PianoMap rootKey={selectedKey} />
        </section>
      )}
      {tab === "Theory" && <TheoryLesson rootKey={selectedKey} />}
    </div>
  );
}
