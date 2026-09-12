"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { scaleShape } from "@/lib/fretlab/theory";
import { useState } from "react";

export function Runner({
  go,
  sessionKey,
}: {
  go: (view: View) => void;
  sessionKey: KeyName;
}) {
  const [bpm, setBpm] = useState(84);
  const [paused, setPaused] = useState(false);
  const notes = scaleShape(sessionKey, 1, 5);
  return (
    <div className="screen-content flow-screen">
      <StatusBar end="1 of 4" />
      <div className="step-bar">
        {[0, 1, 2, 3].map((n) => (
          <i className={n === 0 ? "done" : n === 1 ? "current" : ""} key={n} />
        ))}
      </div>
      <div className="runner-hero">
        <p className="kicker">Key of {sessionKey}</p>
        <h1>Position one, up and back</h1>
        <p>
          One note per click. Let the top note turn you around without becoming
          a pause.
        </p>
      </div>
      <Fretboard
        notes={notes}
        low={1}
        high={5}
        labelMode="degree"
        rootKey={sessionKey}
      />
      <div className={`metronome ${paused ? "paused" : ""}`}>
        {[0, 1, 2, 3].map((n) => (
          <i
            style={{
              animationDelay: `${n * (60 / bpm)}s`,
              animationDuration: `${60 / bpm}s`,
            }}
            key={n}
          />
        ))}
      </div>
      <div className="elapsed">
        <strong>02:18</strong>
        <span>of 4:00</span>
      </div>
      <div className="transport">
        <button onClick={() => setBpm((n) => Math.max(40, n - 4))}>
          −4<small>bpm</small>
        </button>
        <button className="pause" onClick={() => setPaused(!paused)}>
          {paused ? "Resume" : "Pause"}
          <small>{bpm} bpm</small>
        </button>
        <button onClick={() => setBpm((n) => Math.min(180, n + 4))}>
          +4<small>bpm</small>
        </button>
      </div>
      <button className="finish-link" onClick={() => go("summary")}>
        Finish session
      </button>
    </div>
  );
}
