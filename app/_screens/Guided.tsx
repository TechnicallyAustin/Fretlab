"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { ROUTINES } from "@/lib/fretlab/library";
import { MetronomeBar } from "@/components/fretlab/MetronomeBar";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { cssVars } from "@/lib/fretlab/palette";
import { useElapsed } from "@/lib/fretlab/useElapsed";
import { useMetronome } from "@/lib/fretlab/useMetronome";
import { useState } from "react";

export function Guided({
  go,
  selectedKey,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
}) {
  const { label: elapsedLabel } = useElapsed(selectedKey);
  const metronome = useMetronome({ bpm: 84, meter: 4, countInBars: 1 });
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
        <strong>{elapsedLabel}</strong>
        <span>elapsed</span>
      </div>
      <MetronomeBar metronome={metronome} subdivisions={false} />
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
      </div>
      <button className="finish-link" onClick={() => go("routine-detail")}>
        End routine
      </button>
    </div>
  );
}
