"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
/**
 * Ear training.
 *
 * FL-24. Hear a distance or a chord, name it. The vocabulary is the board's —
 * an interval is called the third here because that is what the fretboard has
 * been calling it — so what you hear and what you see are the same lesson
 * rather than two.
 *
 * Grading matches `Train`: right first time, or not. So a session lands in the
 * review queue with the same kind of accuracy a shape session does, rather
 * than being a separate score nothing reads.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import type { EarMode } from "@/lib/fretlab/ear";
import { ApiClientError, api } from "@/lib/api/client";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { StateNotice } from "@/components/fretlab/StateNotice";
import { askQuestion, explain } from "@/lib/fretlab/ear";
import { playTones } from "@/lib/fretlab/audio";
import { useElapsed } from "@/lib/fretlab/useElapsed";
import { useMemo, useState } from "react";

/** Questions in a round. Enough to be a session, short enough to finish. */
const ROUND = 8;

export function Ear({
  go,
  selectedKey,
}: {
  go: (view: View, id?: string) => void;
  selectedKey: KeyName;
}) {
  const [mode, setMode] = useState<EarMode>("intervals");
  const [asked, setAsked] = useState(0);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000));
  const [picked, setPicked] = useState<string | null>(null);
  const [clean, setClean] = useState(0);
  const [missed, setMissed] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const question = useMemo(() => askQuestion(mode, seed + asked), [mode, seed, asked]);
  const { seconds, label: elapsed } = useElapsed(`${mode}:${seed}`);

  const play = () => playTones(selectedKey, question.intervals, mode === "intervals");

  const restart = (next: EarMode) => {
    setMode(next);
    setAsked(0);
    setSeed(Math.floor(Math.random() * 1000));
    setPicked(null);
    setClean(0);
    setMissed(false);
    setDone(false);
    setSaveError(null);
  };

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    // Right first time is the only figure worth keeping, exactly as Train
    // counts a tapped note.
    if (id === question.answer && !missed) setClean((n) => n + 1);
    if (id !== question.answer) setMissed(true);
  };

  const advance = async () => {
    const last = asked + 1 >= ROUND;
    setPicked(null);
    setMissed(false);
    if (!last) {
      setAsked((n) => n + 1);
      return;
    }
    setDone(true);
    try {
      await api.createPracticeSession({
        title: mode === "intervals" ? "Interval recognition" : "Chord quality recognition",
        drill_id: mode === "intervals" ? "ear-intervals" : "ear-qualities",
        music_key: selectedKey,
        accuracy: Math.round((clean / ROUND) * 100),
        reps: ROUND,
        duration_seconds: Math.max(1, seconds),
        tags: [selectedKey, "ear"],
      });
      setSaveError(null);
    } catch (error) {
      setSaveError(
        error instanceof ApiClientError && error.code === "unauthenticated"
          ? "Sign in to save this round to your history."
          : "That round was not saved. Your practice still counted.",
      );
    }
  };

  if (done) {
    const score = Math.round((clean / ROUND) * 100);
    return (
      <div className="screen-content ear-screen">
        <AppHeader title="Ear training" meta="Listening" onBack={() => go("train")} />
        <section className="ear-result">
          <p className="kicker">Round complete · key of {selectedKey}</p>
          <strong>{score}%</strong>
          <p>
            {clean} of {ROUND} right first time, in {elapsed}.
          </p>
          {saveError && (
            <StateNotice
              tone="error"
              title="Not saved to your history"
              detail={saveError}
              actionLabel="Sign in"
              onAction={() => go("signin")}
            />
          )}
          <div className="action-row">
            <button className="secondary-action" onClick={() => go("progress")}>
              See progress
            </button>
            <button className="primary-action" onClick={() => restart(mode)}>
              Another round
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="screen-content ear-screen">
      <AppHeader title="Ear training" meta="Listening" onBack={() => go("train")} />
      <SegmentTabs
        labels={["Intervals", "Chords"]}
        active={mode === "intervals" ? "Intervals" : "Chords"}
        onChange={(label) => restart(label === "Intervals" ? "intervals" : "qualities")}
      />

      <section className="ear-stage">
        <div className="section-head">
          <h2>
            {mode === "intervals" ? "Name the distance" : "Name the chord"}
          </h2>
          <span>
            {asked + 1} of {ROUND}
          </span>
        </div>
        {/* The only control before an answer: nothing to read off, so the
            question cannot be answered by looking. */}
        <button className="ear-play" onClick={play}>
          ▶ {picked ? "Hear it again" : "Play it"}
        </button>

        <div className="ear-options">
          {question.options.map((option) => (
            <button
              className={
                !picked
                  ? ""
                  : option.id === question.answer
                    ? "right"
                    : option.id === picked
                      ? "wrong"
                      : "faded"
              }
              onClick={() => choose(option.id)}
              disabled={Boolean(picked)}
              key={option.id}
            >
              <strong>{option.name}</strong>
              <small>{option.detail}</small>
            </button>
          ))}
        </div>

        {picked && (
          <div className="ear-answer">
            <p className={picked === question.answer ? "right" : "wrong"}>
              {picked === question.answer ? "Right." : "Not that one."}
            </p>
            <p>{explain(question, selectedKey)}</p>
            <button className="primary-action" onClick={advance}>
              {asked + 1 >= ROUND ? "Finish round" : "Next"} <span>→</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
