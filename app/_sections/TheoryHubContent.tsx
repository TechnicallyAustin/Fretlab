"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { FIFTHS, intervalShape } from "@/lib/fretlab/theory";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { PianoMap } from "@/components/fretlab/PianoMap";
import { cssVars } from "@/lib/fretlab/palette";
import { playTones } from "@/lib/fretlab/audio";
import { useState } from "react";

export function TheoryHubContent({
  go,
  selectedKey,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
}) {
  const modules = [
    {
      id: "fretboard",
      number: "01",
      title: "Fretboard foundations",
      level: "Beginner",
      time: "8 min",
      copy: "See why notes repeat and learn the octave landmarks.",
    },
    {
      id: "intervals",
      number: "02",
      title: "Intervals",
      level: "Beginner",
      time: "10 min",
      copy: "Measure musical distance in frets and by ear.",
    },
    {
      id: "chords",
      number: "03",
      title: "Chord construction",
      level: "Intermediate",
      time: "12 min",
      copy: "Stack thirds to build triads and seventh chords.",
    },
    {
      id: "harmony",
      number: "04",
      title: "Keys & harmony",
      level: "Intermediate",
      time: "14 min",
      copy: "Connect scale degrees, chords and progressions.",
    },
    {
      id: "rhythm",
      number: "05",
      title: "Rhythm & phrasing",
      level: "Advanced",
      time: "11 min",
      copy: "Turn subdivisions into musical guitar phrases.",
    },
  ];
  const [active, setActive] = useState("fretboard");
  const selected = modules.find((item) => item.id === active) ?? modules[0];
  const lessonIntervals =
    active === "intervals"
      ? [0, 3, 4, 7, 12]
      : active === "chords"
        ? [0, 4, 7, 11]
        : active === "harmony"
          ? [0, 2, 4, 5, 7, 9, 11]
          : active === "rhythm"
            ? [0, 7, 12]
            : [0, 12];
  return (
    <div
      className="screen-content theory-hub-screen"
      style={cssVars(selectedKey)}
    >
      <AppHeader
        title="Theory"
        meta={`Key of ${selectedKey}`}
        onBack={() => go("keys")}
      />
      <section className="theory-hub-hero">
        <div>
          <p className="kicker">See it. Hear it. Play it.</p>
          <h2>Music theory, anchored to the guitar.</h2>
          <p>
            Start with the fretboard, compare it with one piano octave, then
            bring every idea back under your fingers.
          </p>
          <div>
            <span>5 guided modules</span>
            <span>55 minutes</span>
            <span>3 levels</span>
          </div>
        </div>
        <button onClick={() => playTones(selectedKey, [0, 4, 7, 12], true)}>
          <span>▶</span> Hear {selectedKey} resolve
        </button>
      </section>
      <div className="theory-course-grid">
        {modules.map((item, index) => (
          <button
            className={active === item.id ? "active" : ""}
            onClick={() => setActive(item.id)}
            key={item.id}
            style={cssVars(
              FIFTHS[(FIFTHS.indexOf(selectedKey) + index * 2) % 12],
            )}
          >
            <span>{item.number}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
              <small>
                {item.level} · {item.time}
              </small>
            </div>
            <i>→</i>
          </button>
        ))}
      </div>
      <section className="theory-lab">
        <header>
          <div>
            <p className="kicker">Active lesson · {selected.level}</p>
            <h2>{selected.title}</h2>
            <p>
              {selected.copy} Every colored note keeps the same pitch identity
              across the entire app.
            </p>
          </div>
          <button
            className="sample-play"
            onClick={() => playTones(selectedKey, lessonIntervals, true)}
          >
            ▶ Hear example
          </button>
        </header>
        {active === "rhythm" ? (
          <div className="rhythm-theory">
            <div className="rhythm-count">
              {["1", "&", "2", "&", "3", "&", "4", "&"].map((beat, index) => (
                <span
                  className={index % 2 === 0 ? "downbeat" : ""}
                  key={`${beat}${index}`}
                >
                  <i />
                  {beat}
                </span>
              ))}
            </div>
            <div className="rhythm-cards">
              <article>
                <span>Quarter notes</span>
                <strong>One event per beat</strong>
                <p>
                  Use steady down-strokes first. The foot and hand should agree.
                </p>
              </article>
              <article>
                <span>Eighth notes</span>
                <strong>Down · up subdivisions</strong>
                <p>The “&” lives exactly halfway between numbered beats.</p>
              </article>
              <article>
                <span>Phrasing</span>
                <strong>Leave intentional space</strong>
                <p>A rest shapes the line as strongly as a played note.</p>
              </article>
            </div>
          </div>
        ) : active === "fretboard" ? (
          <>
            <div className="theory-visual-grid">
              <div className="theory-fretboard">
                <div className="section-head">
                  <h2>Octave landmarks</h2>
                  <span>Same pitch, new register</span>
                </div>
                <Fretboard
                  notes={intervalShape(selectedKey, [0], 0, 12)}
                  low={0}
                  high={12}
                  labelMode="note"
                  rootKey={selectedKey}
                />
                <p>
                  Move twelve frets on one string for an octave. Across strings,
                  the common shortcut is two strings over and two frets higher,
                  adjusted around the B string.
                </p>
              </div>
              <PianoMap rootKey={selectedKey} intervals={[0]} />
            </div>
          </>
        ) : (
          <>
            <div className="theory-visual-grid">
              <div className="theory-fretboard">
                <div className="section-head">
                  <h2>{selected.title} on guitar</h2>
                  <span>Degrees from {selectedKey}</span>
                </div>
                <Fretboard
                  notes={intervalShape(selectedKey, lessonIntervals, 0, 9)}
                  low={0}
                  high={9}
                  labelMode="degree"
                  rootKey={selectedKey}
                />
                <p>
                  Read horizontally for distance on one string and vertically
                  for playable shapes. The pitch colors stay fixed while degree
                  labels change with the key.
                </p>
              </div>
              <PianoMap
                rootKey={selectedKey}
                intervals={lessonIntervals.map((interval) => interval % 12)}
              />
            </div>
            <div className="theory-concept-row">
              {lessonIntervals.slice(0, 4).map((interval, index) => (
                <article key={`${interval}${index}`}>
                  <span>{index === 0 ? "Root" : `${interval} semitones`}</span>
                  <strong>
                    {["Home", "Color", "Structure", "Resolution"][index]}
                  </strong>
                  <p>
                    {index === 0
                      ? "The tonal center everything is measured from."
                      : `Move ${interval} fret${interval === 1 ? "" : "s"} on one string to hear this distance exactly.`}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
