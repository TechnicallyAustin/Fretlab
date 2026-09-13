"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { CHORDS } from "@/lib/fretlab/library";
import {
  ChordCard,
  Hero,
  PillGroup,
  SegmentedControl,
  levelOf,
  markersFrom,
} from "@/components/ui";
import { chordIntervals } from "@/lib/fretlab/theory";
import { keyHue } from "@/lib/fretlab/palette";
import { playTones } from "@/lib/fretlab/audio";
import { useState } from "react";
import { useGuitarSetup } from "@/lib/fretlab/GuitarSetup";

export function ChordLibrary({
  go,
  onOpen,
}: {
  go: (view: View) => void;
  onOpen: (id: string) => void;
}) {
  const { tuning } = useGuitarSetup();
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
    <div className="fl-root screen-content library-screen chord-library-screen">
      <AppHeader
        title="Chord library"
        meta={`${visible.length} shapes`}
        onBack={() => go("library")}
      />
      <Hero
        eyebrow="Shape meets harmony"
        title="Every chord is a small map of the key."
        sub="Choose a shape to see its exact notes, intervals, fingering, movable positions and practice path."
        meta={`${CHORDS.length} essential shapes`}
      />
      <div className="library-controls">
        <SegmentedControl
          label="Quality"
          options={["All", "Major", "Minor", "Seventh", "Suspended"]}
          value={quality}
          onChange={setQuality}
        />
        <PillGroup
          label="Level"
          options={["All levels", "Beginner", "Intermediate", "Advanced"]}
          value={level}
          onChange={setLevel}
        />
        <PillGroup
          label="Root"
          circle
          options={["All", "G", "C", "D", "A", "E", "F", "B"]}
          value={root}
          onChange={setRoot}
        />
      </div>
      <div className="fl-grid fl-grid--3">
        {visible.map((chord) => {
          // Drop D retunes the sixth string, so a shape that uses it is no
          // longer that shape. The board drops the string rather than drawing
          // a note that would not sound.
          const shape =
            tuning.id === "drop-d"
              ? chord.fingering.filter((note) => note.s !== 6)
              : chord.fingering;
          return (
            <ChordCard
              key={chord.id}
              name={chord.name}
              root={chord.root}
              notes={chord.notes.split(" · ")}
              intervals={chord.formula}
              level={levelOf(chord.level)}
              markers={markersFrom(shape, chord.root, tuning)}
              hue={keyHue(chord.root)}
              onHear={() => playTones(chord.root, chordIntervals(chord))}
              onOpen={() => onOpen(chord.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
