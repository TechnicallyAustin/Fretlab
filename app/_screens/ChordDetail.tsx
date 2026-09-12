"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { CHORDS } from "@/lib/fretlab/library";
import { ChordPlayingLesson } from "@/components/fretlab/ChordPlayingLesson";
import { ChordToneLegend } from "@/components/fretlab/ChordToneLegend";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { PianoMap } from "@/components/fretlab/PianoMap";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { chordIntervals, chordVoicing, intervalShape } from "@/lib/fretlab/theory";
import { fingerChordShape } from "@/lib/fretlab/fingering";
import { cssVars } from "@/lib/fretlab/palette";
import { playTones } from "@/lib/fretlab/audio";
import { useState } from "react";

export function ChordDetail({
  go,
  chordId,
}: {
  go: (view: View) => void;
  chordId: string;
}) {
  const chord = CHORDS.find((item) => item.id === chordId) ?? CHORDS[0];
  const [tab, setTab] = useState("Shape");
  const [voicing, setVoicing] = useState<"Open" | "Barre" | "Triad">("Open");
  const intervals = chordIntervals(chord);
  const range = voicing === "Open" ? [0, 4] : voicing === "Barre" ? [1, 7] : [4, 12];
  const displayNotes =
    voicing === "Open"
      ? chord.fingering
      : chordVoicing(chord, voicing);
  return (
    <div
      className="screen-content detail-screen chord-detail-screen"
      style={cssVars(chord.root)}
    >
      <AppHeader
        title={chord.name}
        meta="Chord library"
        onBack={() => go("chords")}
      />
      <section className="chord-detail-hero">
        <div>
          <span className="chord-big-symbol">{chord.symbol}</span>
          <div>
            <p className="kicker">
              {chord.quality} chord · {chord.level}
            </p>
            <h2>{chord.notes}</h2>
            <p>{chord.tip}</p>
            <button
              className="sample-play detail-audio"
              onClick={() => playTones(chord.root, intervals)}
            >
              ▶ Hear chord
            </button>
          </div>
        </div>
        <div
          className="chord-hero-photo"
          aria-label="Close-up guitar strings"
        />
      </section>
      <SegmentTabs
        labels={["Shape", "Notes", "Practice"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Shape" && (
        <>
          <div className="voicing-picker">
            {(["Open", "Barre", "Triad"] as const).map((item) => (
              <button
                className={voicing === item ? "active" : ""}
                onClick={() => setVoicing(item)}
                key={item}
              >
                <strong>{item}</strong>
                <span>
                  {item === "Open"
                    ? "Foundational"
                    : item === "Barre"
                      ? "Movable"
                      : "Strings 1–3"}
                </span>
              </button>
            ))}
          </div>
          <div className="fretboard-stage">
            <div className="section-head">
              <h2>{voicing} voicing</h2>
              <span>Root notes are square</span>
            </div>
            <Fretboard
              notes={fingerChordShape(displayNotes)}
              low={range[0]}
              high={range[1]}
              labelMode="finger"
              rootKey={chord.root}
              caption={`${chord.name} \u00b7 ${voicing.toLowerCase()} shape`}
            />
            <ChordToneLegend chord={chord} />
          </div>
          <ChordPlayingLesson chord={chord} />
          <section className="chord-facts">
            <article>
              <span>Formula</span>
              <strong>{chord.formula}</strong>
              <p>
                The interval recipe stays the same wherever this chord moves.
              </p>
            </article>
            <article>
              <span>Chord tones</span>
              <strong>{chord.notes}</strong>
              <p>
                Find these notes inside nearby scale shapes to build solos
                around the chord.
              </p>
            </article>
            <article>
              <span>Best next move</span>
              <strong>{chord.root === "G" ? "C or D" : "Return to G"}</strong>
              <p>Practice one-bar changes without breaking the pulse.</p>
            </article>
          </section>
        </>
      )}
      {tab === "Notes" && (
        <section className="chord-note-theory">
          <header>
            <h2>See the chord inside the scale</h2>
            <p>
              {chord.name} uses {chord.formula.replaceAll(" · ", ", ")}. The
              root gives the chord its name, the third defines major or minor,
              and the fifth stabilizes the sound.
            </p>
          </header>
          <div className="theory-visual-grid">
            <div className="theory-fretboard">
              <div className="section-head">
                <h2>Across the guitar</h2>
                <span>Every available voicing</span>
              </div>
              <Fretboard
                notes={intervalShape(chord.root, intervals, 0, 12)}
                low={0}
                high={12}
                labelMode="degree"
                rootKey={chord.root}
                caption={`Every ${chord.symbol} tone on the neck`}
                legend
              />
              <p>
                The same three or four chord tones repeat across strings. A
                voicing simply chooses one reachable set.
              </p>
            </div>
            <PianoMap rootKey={chord.root} intervals={intervals} />
          </div>
        </section>
      )}
      {tab === "Practice" && (
        <article className="chord-practice">
          <div>
            <p className="kicker">Four-minute chord lab</p>
            <h2>Make every note speak</h2>
            <ol>
              <li>Play each string separately and fix muted notes.</li>
              <li>Strum four quarter notes at 72 bpm.</li>
              <li>Change away and return without looking.</li>
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
