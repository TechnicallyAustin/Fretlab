"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { intervalShape } from "@/lib/fretlab/theory";
import { SCALES } from "@/lib/fretlab/library";
import {
  Hero,
  PillGroup,
  ScaleCard,
  SegmentedControl,
  levelOf,
  markersFrom,
} from "@/components/ui";
import { playTones } from "@/lib/fretlab/audio";
import { useState } from "react";
import { useGuitarSetup } from "@/lib/fretlab/GuitarSetup";

export function ScaleLibrary({
  go,
  selectedKey,
  onOpen,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
  onOpen: (id: string) => void;
}) {
  const { tuning } = useGuitarSetup();
  const [family, setFamily] = useState("All");
  const [level, setLevel] = useState("All levels");
  const visible = SCALES.filter(
    (scale) =>
      (family === "All" || scale.family === family) &&
      (level === "All levels" || scale.level === level),
  );
  return (
    <div className="fl-root screen-content library-screen scale-library-screen">
      <AppHeader
        title="Scale library"
        meta={`Key of ${selectedKey}`}
        onBack={() => go("library")}
      />
      <Hero
        eyebrow="One neck, many sounds"
        title="Compare scale families without losing your place."
        sub="Every pattern is generated from the selected key and opens into connected fretboard positions."
        meta={`${SCALES.length} scales \u00b7 ${selectedKey} active`}
      />
      <div className="library-controls">
        <SegmentedControl
          label="Scale family"
          options={["All", "Major", "Minor", "Pentatonic", "Modes"]}
          value={family}
          onChange={setFamily}
        />
        <PillGroup
          label="Level"
          options={["All levels", "Beginner", "Intermediate", "Advanced"]}
          value={level}
          onChange={setLevel}
        />
      </div>
      <div className="fl-grid fl-grid--3">
        {visible.map((scale, index) => (
          <ScaleCard
            key={scale.id}
            index={String(index + 1).padStart(2, "0")}
            name={`${selectedKey} ${scale.name}`}
            mood={scale.mood}
            level={levelOf(scale.level)}
            formula={scale.formula}
            markers={markersFrom(
              intervalShape(selectedKey, scale.intervals, 1, 7, tuning),
              selectedKey,
              tuning,
            )}
            onHear={() => playTones(selectedKey, scale.intervals, true)}
            onOpen={() => onOpen(scale.id)}
          />
        ))}
      </div>
    </div>
  );
}
