"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */

import type { KeyName, View } from "@/lib/fretlab/types";
import { DRILLS, drillNotes } from "@/lib/fretlab/library";
import { DrillHistory } from "@/app/_sections/DrillHistory";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { PianoMap } from "@/components/fretlab/PianoMap";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { majorScale } from "@/lib/fretlab/theory";
import type { NoteGroup } from "@/lib/fretlab/noteRoles";
import { drillShape, withPlayOrder, fingersUsed } from "@/lib/fretlab/fingering";
import { playTones } from "@/lib/fretlab/audio";
import { usePracticeSessions } from "@/lib/api/hooks";
import { dayLabel } from "@/lib/api/progress";
import { useState } from "react";

export function DrillDetail({
  go,
  sessionKey,
  drillId,
}: {
  /** Takes an id too: the runner needs to know what it is running. */
  go: (view: View, id?: string) => void;
  sessionKey: KeyName;
  drillId: string;
}) {
  const [tab, setTab] = useState("Lesson");
  const drill = DRILLS.find((item) => item.id === drillId) ?? DRILLS[0];

  // §5: L1 owns the data. DrillHistory is an L2 section, so it receives the
  // rows rather than fetching them.
  const history = usePracticeSessions({ limit: 50, drillId: drill.id });
  const drillSessions = (history.data ?? []).filter(
    (session) => session.drill_id === drill.id,
  );

  const entries = drillSessions.slice(0, 4).map((session) => ({
    id: session.id,
    day: dayLabel(session.created_at),
    bpm: session.bpm,
    accuracy: session.accuracy,
    time:
      session.duration_seconds === null
        ? "—"
        : `${Math.floor(session.duration_seconds / 60)}:${String(session.duration_seconds % 60).padStart(2, "0")}`,
  }));

  // Two layers so the drill's own window is visible *inside* the whole neck,
  // rather than the learner having to guess which dots belong to the drill.
  const shape = drillShape(drill, sessionKey);
  const ordered = withPlayOrder(shape.notes);
  const fingers = fingersUsed(shape.notes, shape.low);
  const fullNeck = drillShape(drill, sessionKey, true);
  const shapeIds = new Set(shape.notes.map((note) => `${note.s}:${note.f}`));
  const neckGroups: NoteGroup[] = [
    {
      id: "drill",
      label:
        shape.kind === "box"
          ? `The shape \u00b7 frets ${shape.low}\u2013${shape.high}`
          : `This drill \u00b7 frets ${shape.low}\u2013${shape.high}`,
      emphasis: "primary",
      notes: shape.notes,
    },
    {
      id: "neck",
      label: "Same notes elsewhere",
      emphasis: "secondary",
      notes: fullNeck.notes.filter((note) => !shapeIds.has(`${note.s}:${note.f}`)),
    },
  ];

  const tempos = drillSessions.map((s) => s.bpm).filter((b): b is number => b !== null);
  const accuracies = drillSessions
    .map((s) => s.accuracy)
    .filter((a): a is number => a !== null);

  const historyStats = {
    bestTempo: tempos.length ? Math.max(...tempos) : null,
    averageAccuracy: accuracies.length
      ? Math.round(accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length)
      : null,
    totalReps: drillSessions.reduce((sum, session) => sum + (session.reps ?? 0), 0),
    sessionCount: drillSessions.length,
  };
  const [tempo, setTempo] = useState<number>(drill.bpm || 72);
  const [phase, setPhase] = useState(0);
  const phases = ["Understand", "Play slow", "Build time"];
  const scale = majorScale(sessionKey);
  const harmony = [
    scale[0],
    `${scale[1]}m`,
    `${scale[2]}m`,
    scale[3],
    scale[4],
    `${scale[5]}m`,
    `${scale[6]}dim`,
  ];
  return (
    <div
      className={`screen-content detail-screen drill-detail-screen tab-${tab.toLowerCase().replace(" ", "-")}`}
    >
      <StatusBar end={`${sessionKey} drill`} />
      <div className="detail-back">
        <button onClick={() => go("drills")}>Back to drills</button>
        <span className="key-chip">Everything here: {sessionKey} major</span>
      </div>
      <div className="drill-lesson-header">
        <div className="detail-title">
          <div className="drill-card-tags">
            <span>{drill.category}</span>
            <span>{drill.level}</span>
            <span>{drill.minutes} min</span>
          </div>
          <h1>{drill.name}</h1>
          <p>{drill.reason}</p>
        </div>
        <div className="drill-outcome">
          <span>Finish line</span>
          <strong>{drill.goal}</strong>
          <small>{drill.cue}</small>
        </div>
      </div>
      <section className="practice-surface">
        <header>
          <div>
            <p className="kicker">Play the numbers in order</p>
            <h2>
              {shape.kind === "box"
                ? `${drill.name} · position ${shape.low}`
                : `${drill.name} · across the neck`}
            </h2>
          </div>
        </header>

        <Fretboard
          notes={ordered}
          low={shape.windowLow}
          high={shape.windowHigh}
          labelMode="order"
          rootKey={sessionKey}
        />

        {fingers.length > 0 && (
          <p className="practice-fingers">
            {fingers
              .map(
                ({ finger, fret }) =>
                  `${["Index", "Middle", "Ring", "Little"][finger - 1]} on fret ${fret}`,
              )
              .join(" \u00b7 ")}
            {ordered.some((note) => note.f === 0) ? " \u00b7 open strings ring" : ""}
          </p>
        )}

        <div className="practice-controls">
          {/* This button named a drill and started an unrelated one. The
              runner takes a drill id as readily as a routine id. */}
          <button
            className="practice-start"
            onClick={() => go("runner", drill.id)}
          >
            ▶ Start {drill.minutes}-minute drill
          </button>
          <div className="practice-tempo">
            <button onClick={() => setTempo(Math.max(40, tempo - 4))} aria-label="Slower">
              −
            </button>
            <b>
              {tempo}
              <small>bpm</small>
            </b>
            <button onClick={() => setTempo(Math.min(200, tempo + 4))} aria-label="Faster">
              +
            </button>
          </div>
          <button
            className="practice-hear"
            onClick={() => playTones(sessionKey, [...drill.intervals], true)}
          >
            ▶ Hear it
          </button>
        </div>

        <p className="practice-goal">
          <span>Goal</span>
          {drill.goal}
        </p>
      </section>

      <SegmentTabs
        labels={["Lesson", "Theory link", "History"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Lesson" && (
        <>
          <div className="lesson-progress">
            {phases.map((item, index) => (
              <button
                className={
                  index === phase ? "active" : index < phase ? "done" : ""
                }
                onClick={() => setPhase(index)}
                key={item}
              >
                <span>{index < phase ? "✓" : index + 1}</span>
                <strong>{item}</strong>
                <small>
                  {index === 0
                    ? "See the target"
                    : index === 1
                      ? "No metronome pressure"
                      : `Lock at ${tempo} bpm`}
                </small>
              </button>
            ))}
          </div>
          <section className="drill-board-stage">
            <div className="section-head">
              <h2>{sessionKey} major · full neck context</h2>
              <span>The drill window, shown against the rest of the neck</span>
            </div>
            <Fretboard
              groups={neckGroups}
              low={0}
              high={12}
              labelMode={phase === 0 ? "degree" : "note"}
              rootKey={sessionKey}
              caption={`${drill.name} in ${sessionKey}`}
              legend
            />
            <div className="board-legend">
              <button
                onClick={() =>
                  playTones(sessionKey, [...drill.intervals], true)
                }
              >
                ▶ Hear the pattern
              </button>
            </div>
          </section>
          <div className="drill-coach-grid">
            <section>
              <div className="section-head">
                <h2>Why this drill</h2>
                <span>Transferable skill</span>
              </div>
              <div className="reason-flow">
                <article>
                  <span>See</span>
                  <strong>{drill.category}</strong>
                  <small>Recognize the same function in every position.</small>
                </article>
                <i>→</i>
                <article>
                  <span>Hear</span>
                  <strong>{drill.intervals.length} target tones</strong>
                  <small>Connect the shape to its sound.</small>
                </article>
                <i>→</i>
                <article>
                  <span>Use</span>
                  <strong>{drill.goal}</strong>
                  <small>Apply it inside real playing.</small>
                </article>
              </div>
            </section>
            <section className="tempo-section">
              <div className="section-head">
                <h2>Tempo ladder</h2>
                <span>{tempo} bpm</span>
              </div>
              <div>
                {([60, 72, 84, 96, 108] as const).map((bpm) => (
                  <button
                    className={tempo === bpm ? "active" : ""}
                    onClick={() => setTempo(bpm)}
                    key={bpm}
                  >
                    {bpm}
                  </button>
                ))}
              </div>
            </section>
            <ol className="instruction-list">
              {[
                [
                  "Orient",
                  `Find every square ${sessionKey} root before playing.`,
                ],
                [
                  "Connect",
                  phase === 0
                    ? "Say each degree aloud as you trace the path."
                    : `Play evenly at ${tempo} bpm. Keep the hand relaxed.`,
                ],
                [
                  "Apply",
                  `${drill.cue} Stop after ${drill.goal.toLowerCase()}.`,
                ],
              ].map(([title, body], i) => (
                <li key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
      {tab === "Theory link" && (
        <section className="drill-theory-link">
          <header>
            <p className="kicker">Scale → chord → music</p>
            <h2>This drill lives inside {sessionKey} harmony</h2>
            <p>
              The scale supplies the notes. Chords emphasize selected degrees.
              This drill trains you to see those targets without losing the key.
            </p>
          </header>
          <div className="theory-visual-grid">
            <div className="theory-fretboard">
              <div className="section-head">
                <h2>{sessionKey} scale and drill tones</h2>
                <span>Full first octave</span>
              </div>
              <Fretboard
                notes={drillNotes(drill, sessionKey, true)}
                low={0}
                high={12}
                labelMode="degree"
                rootKey={sessionKey}
                caption="Every drill tone, by function"
                legend
              />
            </div>
            <PianoMap rootKey={sessionKey} intervals={[...drill.intervals]} />
          </div>
          <div className="scale-chord-bridge">
            {harmony.map((chord, index) => (
              <article
                className={
                  ([...drill.intervals] as number[]).includes(
                    [0, 2, 4, 5, 7, 9, 11][index],
                  )
                    ? "active"
                    : ""
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
                      "motion",
                      "color",
                      "open",
                      "pull",
                      "relative",
                      "resolve",
                    ][index]
                  }
                </small>
              </article>
            ))}
          </div>
        </section>
      )}{" "}
      {tab === "History" && (
        <DrillHistory
          rootKey={sessionKey}
          entries={entries}
          stats={historyStats}
          state={history.status}
          errorMessage={history.error?.message}
          signedOut={history.signedOut}
          onStart={() => go(history.signedOut ? "signin" : "runner")}
        />
      )}
      {/* Start now lives on the practice surface, next to the board it acts on.
          A floating bar here would only cover that board. */}
      <div className="detail-footer-action">
        <button className="secondary-action" onClick={() => go("routines")}>
          Add to routine
        </button>
      </div>
    </div>
  );
}
