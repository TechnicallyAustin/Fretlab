"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { TheoryLesson } from "@/app/_sections/TheoryLesson";
import { ScaleDegrees } from "@/app/_sections/ScaleDegrees";
import { playTones } from "@/lib/fretlab/audio";
import { scaleShape } from "@/lib/fretlab/theory";
import { useState } from "react";

export function ScaleDetail({
  go,
  selectedKey,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
}) {
  const [tab, setTab] = useState("Shapes");
  const [position, setPosition] = useState(2);
  const windows = [
    [0, 3],
    [2, 5],
    [4, 7],
    [6, 9],
    [8, 12],
  ];
  const [low, high] = windows[position - 1];
  return (
    <div className="screen-content detail-screen">
      <AppHeader
        title={`Position ${["I", "II", "III", "IV", "V"][position - 1]}`}
        meta={`${selectedKey} major`}
        onBack={() => go("key-detail")}
      />
      <p className="detail-lede">
        A connected piece of the same {selectedKey} major scale. Use the root
        notes to orient the shape.
      </p>
      <SegmentTabs
        labels={["Shapes", "Degrees", "Sound", "Theory"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Shapes" && (
        <>
          <div className="position-picker">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                className={position === n ? "active" : ""}
                onClick={() => setPosition(n)}
                key={n}
              >
                {["I", "II", "III", "IV", "V"][n - 1]}
              </button>
            ))}
          </div>
          <Fretboard
            notes={scaleShape(selectedKey, low, high)}
            low={low}
            high={high}
            labelMode="degree"
            rootKey={selectedKey}
            caption={`${selectedKey} major, position ${["I", "II", "III", "IV", "V"][position - 1]}`}
            legend
          />
          <section className="steps-section">
            <div className="section-head">
              <h2>How the steps fall</h2>
            </div>
            <div className="step-pattern">
              {["W", "W", "H", "W", "W", "W", "H"].map((step, i) => (
                <span
                  className={step === "H" ? "half" : ""}
                  style={{ flex: step === "W" ? 2 : 1 }}
                  key={i}
                >
                  {step}
                </span>
              ))}
            </div>
            <p>
              Wide, wide, narrow, wide, wide, wide, narrow. Those two narrow
              steps are what make it sound major. Move one and you are in a
              different scale entirely.
            </p>
          </section>
        </>
      )}
      {tab === "Degrees" && (
        <ScaleDegrees
          rootKey={selectedKey}
          onHear={(semitones) => playTones(selectedKey, [0, semitones], true)}
        />
      )}
      {tab === "Sound" && (
        <article className="sound-lesson">
          <div>
            <p className="kicker">Train the ear</p>
            <h2>Hear distance from the root</h2>
            <p>
              Resolve phrases to {selectedKey}. The second wants to move, the
              fourth leans downward, the fifth feels stable, and the seventh
              strongly pulls home.
            </p>
          </div>
          <div className="degree-tension">
            {[
              "1 home",
              "2 open",
              "3 bright",
              "4 pull",
              "5 anchor",
              "6 warm",
              "7 leading",
            ].map((item, index) => (
              <span
                className={index === 0 || index === 4 ? "strong" : ""}
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </article>
      )}
      {tab === "Theory" && <TheoryLesson rootKey={selectedKey} />}
    </div>
  );
}
