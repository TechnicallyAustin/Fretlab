"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { FIFTHS, intervalShape } from "@/lib/fretlab/theory";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { SCALES } from "@/lib/fretlab/library";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { cssVars } from "@/lib/fretlab/palette";
import { playTones } from "@/lib/fretlab/audio";
import { useState } from "react";

export function ScaleLibrary({
  go,
  selectedKey,
  onOpen,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
  onOpen: (id: string) => void;
}) {
  const [family, setFamily] = useState("All");
  const [level, setLevel] = useState("All levels");
  const visible = SCALES.filter(
    (scale) =>
      (family === "All" || scale.family === family) &&
      (level === "All levels" || scale.level === level),
  );
  return (
    <div className="screen-content library-screen scale-library-screen">
      <AppHeader
        title="Scale library"
        meta={`Key of ${selectedKey}`}
        onBack={() => go("keys")}
      />
      <section className="library-photo-hero scale-photo">
        <div>
          <p className="kicker">One neck, many sounds</p>
          <h2>Compare scale families without losing your place.</h2>
          <p>
            Every pattern is generated from the selected key and opens into
            connected fretboard positions.
          </p>
        </div>
        <span>
          {SCALES.length} scales · {selectedKey} active
        </span>
      </section>
      <div className="library-controls">
        <SegmentTabs
          labels={["All", "Major", "Minor", "Pentatonic", "Modes"]}
          active={family}
          onChange={setFamily}
        />
        <div className="chip-scroll">
          {["All levels", "Beginner", "Intermediate", "Advanced"].map(
            (item) => (
              <button
                className={level === item ? "active" : ""}
                onClick={() => setLevel(item)}
                key={item}
              >
                {item}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="scale-library-grid">
        {visible.map((scale, index) => (
          <article
            className="scale-library-card"
            key={scale.id}
            style={cssVars(FIFTHS[(FIFTHS.indexOf(selectedKey) + index) % 12])}
          >
            <button
              className="library-card-open"
              onClick={() => onOpen(scale.id)}
            >
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>
                  {selectedKey} {scale.name}
                </strong>
                <small>{scale.mood}</small>
              </div>
              <Fretboard
                notes={intervalShape(selectedKey, scale.intervals, 1, 7)}
                low={1}
                high={7}
                mini
                rootKey={selectedKey}
              />
            </button>
            <footer>
              <span className="experience-badge">{scale.level}</span>
              <b>{scale.formula}</b>
              <button
                className="sample-play"
                onClick={() => playTones(selectedKey, scale.intervals, true)}
              >
                ▶ Hear
              </button>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
