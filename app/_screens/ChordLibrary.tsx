"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { CHORDS } from "@/lib/fretlab/library";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { chordIntervals } from "@/lib/fretlab/theory";
import { cssVars } from "@/lib/fretlab/palette";
import { playTones } from "@/lib/fretlab/audio";
import { useState } from "react";

export function ChordLibrary({
  go,
  onOpen,
}: {
  go: (view: View) => void;
  onOpen: (id: string) => void;
}) {
  const [quality, setQuality] = useState("All");
  const [root, setRoot] = useState("All");
  const [level, setLevel] = useState("All levels");
  const visible = CHORDS.filter(
    (chord) =>
      (quality === "All" || chord.quality === quality) &&
      (root === "All" || chord.root === root) &&
      (level === "All levels" || chord.level === level),
  );
  return (
    <div className="screen-content library-screen chord-library-screen">
      <AppHeader
        title="Chord library"
        meta={`${visible.length} shapes`}
        onBack={() => go("keys")}
      />
      <section className="library-photo-hero chord-photo">
        <div>
          <p className="kicker">Shape meets harmony</p>
          <h2>Every chord is a small map of the key.</h2>
          <p>
            Choose a shape to see its exact notes, intervals, fingering, movable
            positions and practice path.
          </p>
        </div>
        <span>{CHORDS.length} essential shapes</span>
      </section>
      <div className="library-controls">
        <SegmentTabs
          labels={["All", "Major", "Minor", "Seventh", "Suspended"]}
          active={quality}
          onChange={setQuality}
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
        <div className="chip-scroll">
          {["All", "G", "C", "D", "A", "E", "F", "B"].map((key) => (
            <button
              className={root === key ? "active" : ""}
              onClick={() => setRoot(key)}
              key={key}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      <div className="chord-library-grid">
        {visible.map((chord) => (
          <article
            className="chord-library-card"
            key={chord.id}
            style={cssVars(chord.root)}
          >
            <button
              className="library-card-open"
              onClick={() => onOpen(chord.id)}
            >
              <div>
                <span className="chord-symbol">{chord.symbol}</span>
                <span>
                  <strong>{chord.name}</strong>
                  <small>{chord.notes}</small>
                </span>
                <b>→</b>
              </div>
              <Fretboard
                notes={chord.fingering}
                low={0}
                high={4}
                mini
                rootKey={chord.root}
              />
            </button>
            <footer>
              <span className="experience-badge">{chord.level}</span>
              <span>{chord.formula}</span>
              <button
                className="sample-play"
                onClick={() => playTones(chord.root, chordIntervals(chord))}
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
