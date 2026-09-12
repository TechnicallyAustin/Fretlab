"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { playTones } from "@/lib/fretlab/audio";
import { scaleShape, targetNotes } from "@/lib/fretlab/theory";
import { roleForDegree, degreeAt, type NoteGroup } from "@/lib/fretlab/noteRoles";
import { useMetronome } from "@/lib/fretlab/useMetronome";
import { useState } from "react";

export function DesktopPracticeStudio({
  go,
  sessionKey,
}: {
  go: (view: View) => void;
  sessionKey: KeyName;
}) {
  const [mode, setMode] = useState<"Notes" | "Degrees" | "Roots">("Roots");
  // The beat used to come from a `setInterval` that was silent and drifted:
  // `setInterval` guarantees no worse than "not before", so the click and the
  // dot wandered apart over a practice session. Both now come off the audio
  // clock, which is the only one in the browser that does not drift.
  const metronome = useMetronome({ bpm: 84, meter: 4 });
  const { beat, bpm, meter, running } = metronome;
  // A stopped metronome always reads as beat one, derived rather than stored.
  const currentBeat = running ? beat : 0;
  const notes =
    mode === "Roots"
      ? targetNotes(sessionKey, 0, 12)
      : scaleShape(sessionKey, 0, 12);

  // Two layers, so the chord skeleton inside the scale is visible rather than
  // implied: 1-3-5 read first, the remaining scale tones sit behind them.
  const groups: NoteGroup[] | undefined =
    mode === "Roots"
      ? undefined
      : [
          {
            id: "triad",
            label: `${sessionKey} triad (1\u20133\u20135)`,
            emphasis: "primary",
            notes: notes.filter((note) => {
              const role = roleForDegree(degreeAt(note.s, note.f, sessionKey));
              return role === "root" || role === "third" || role === "fifth";
            }),
          },
          {
            id: "scale",
            label: "Rest of the scale",
            emphasis: "secondary",
            notes: notes.filter((note) => {
              const role = roleForDegree(degreeAt(note.s, note.f, sessionKey));
              return role !== "root" && role !== "third" && role !== "fifth";
            }),
          },
        ];
  const guide =
    mode === "Roots"
      ? {
          title: `Find every ${sessionKey}`,
          copy: "Squares mark the tonal centre. Say the string, then play each root from low E to high e.",
          target: `Goal · find all ${notes.length} roots in 20 seconds`,
        }
      : mode === "Degrees"
        ? {
            title: "Understand each note’s job",
            copy: "Filled shapes are the chord: 1 is home, 3 sets the major colour, 5 is the anchor. Hollow circles are the scale around them.",
            target: "Goal · play 1–3–5 in three different areas",
          }
        : {
            title: "Learn the actual pitch names",
            copy: "Every note is the key\u2019s colour. The shape tells you its job, the label tells you its name.",
            target: "Goal · name each note before you play it",
          };
  return (
    <section className="desktop-studio" aria-label="Practice studio">
      <div className="studio-board">
        <div className="studio-heading">
          <div>
            <p className="kicker">Practice studio · {sessionKey} major</p>
            <h2>{guide.title}</h2>
            <p>{guide.copy}</p>
          </div>
          <div
            className="studio-modes"
            role="group"
            aria-label="Choose practice studio lesson"
          >
            {(["Roots", "Degrees", "Notes"] as const).map((item) => (
              <button
                className={mode === item ? "active" : ""}
                onClick={() => setMode(item)}
                key={item}
              >
                {item === "Roots"
                  ? "Find roots"
                  : item === "Degrees"
                    ? "See function"
                    : "Name notes"}
              </button>
            ))}
          </div>
        </div>
        {/* "Choose a view" and "follow the board" describe controls that are
            already on screen. Only the goal is worth a strip. */}
        <div className="studio-task-strip">
          <strong>{guide.target}</strong>
        </div>
        <Fretboard
          notes={groups ? undefined : notes}
          groups={groups}
          low={0}
          high={12}
          labelMode={mode === "Degrees" ? "degree" : "note"}
          rootKey={sessionKey}
          caption={
            mode === "Roots"
              ? `Every ${sessionKey} on the neck`
              : `${sessionKey} major, triad highlighted`
          }
          legend
        />
        <div className="studio-legend">
          <button
            onClick={() =>
              playTones(
                sessionKey,
                mode === "Roots" ? [0, 12] : [0, 2, 4, 5, 7, 9, 11],
                true,
              )
            }
          >
            ▶ Hear this view
          </button>
        </div>
      </div>
      <aside className="tempo-widget">
        <div className="tempo-widget-head">
          <div>
            <span>Step 3 · add time</span>
            <strong>{meter}/4 meter</strong>
          </div>
          <div>
            {([3, 4] as const).map((value) => (
              <button
                className={meter === value ? "active" : ""}
                onClick={() => metronome.setMeter(value)}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="tempo-orbit">
          <div className="beat-orbit">
            {Array.from({ length: meter }, (_, index) => (
              <i
                className={running && currentBeat === index ? "active" : ""}
                key={index}
              />
            ))}
          </div>
          <strong aria-live="polite">{bpm}</strong>
          <span>bpm</span>
        </div>
        <div className="beat-steps" aria-label={`Beat ${currentBeat + 1} of ${meter}`}>
          {Array.from({ length: meter }, (_, index) => (
            <i
              className={running && currentBeat === index ? "active" : ""}
              key={index}
            />
          ))}
        </div>
        <p className="tempo-help">
          Start only after you can complete the goal slowly. One note per click.
        </p>
        <input
          className="tempo-slider"
          type="range"
          min="40"
          max="180"
          step="1"
          value={bpm}
          onChange={(event) => metronome.setBpm(Number(event.target.value))}
          aria-label="Tempo"
        />
        <div className="tempo-controls">
          <button onClick={() => metronome.nudge(-4)} aria-label="Decrease tempo">
            −4
          </button>
          <button className="tempo-play" onClick={metronome.toggle}>
            {running ? "Pause" : "Start click"}
          </button>
          <button onClick={() => metronome.nudge(4)} aria-label="Increase tempo">
            +4
          </button>
          <button onClick={metronome.tap} aria-label="Tap tempo">
            Tap
          </button>
        </div>
        <button className="studio-train" onClick={() => go("train")}>
          Test recall without labels <span>→</span>
        </button>
      </aside>
    </section>
  );
}
