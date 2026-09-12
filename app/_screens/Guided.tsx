"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { ROUTINES } from "@/lib/fretlab/library";
import { Ring } from "@/components/fretlab/Ring";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { cssVars } from "@/lib/fretlab/palette";
import { useState } from "react";

export function Guided({
  go,
  selectedKey,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
}) {
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(1);
  const routine = ROUTINES[1];
  const current = routine.drills[step];
  return (
    <div className="screen-content flow-screen guided-screen">
      <StatusBar end={`${selectedKey} · ${step + 1} of 5`} />
      <div className="step-bar five">
        {routine.drills.map((_, i) => (
          <i
            className={i < step ? "done" : i === step ? "current" : ""}
            key={i}
          />
        ))}
      </div>
      <div className="guided-hero">
        <p className="kicker">Now playing · key of {selectedKey}</p>
        <h1>{current.name}</h1>
        <Ring value={46} size={158} />
        <strong>02:18</strong>
        <span>remaining</span>
      </div>
      <div className={`metronome ${paused ? "paused" : ""}`}>
        {[0, 1, 2, 3].map((n) => (
          <i style={{ animationDelay: `${n * 0.71}s` }} key={n} />
        ))}
      </div>
      <section className="up-next">
        <div className="section-head">
          <h2>Up next · all in {selectedKey}</h2>
        </div>
        {routine.drills.slice(step + 1).map((drill) => (
          <div key={drill.name} style={cssVars(selectedKey)}>
            <i />
            <strong>{drill.name}</strong>
            <span>{drill.mins} min</span>
          </div>
        ))}
      </section>
      <div className="transport guided-actions">
        <button
          onClick={() => setStep(Math.min(routine.drills.length - 1, step + 1))}
        >
          Skip<small>next drill</small>
        </button>
        <button className="pause" onClick={() => setPaused(!paused)}>
          {paused ? "Resume" : "Pause"}
          <small>84 bpm</small>
        </button>
      </div>
      <button className="finish-link" onClick={() => go("routine-detail")}>
        End routine
      </button>
    </div>
  );
}
