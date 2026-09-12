"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { ROUTINES, routineKey, routineSteps } from "@/lib/fretlab/library";
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
  const [step, setStep] = useState(1);
  const routine = ROUTINES[1];
  const steps = routineSteps(routine);
  const practisedIn = routineKey(routine, selectedKey);
  const current = steps[step];
  // The tempo comes from the drill being run, not from a number typed into
  // the transport. A drill with no tempo of its own is not played to a click.
  const metronome = useMetronome({
    bpm: current.drill.bpm || 84,
    meter: 4,
    countInBars: 1,
  });
  return (
    <div className="screen-content flow-screen guided-screen">
      <StatusBar end={`${practisedIn} · ${step + 1} of ${steps.length}`} />
      <div className="step-bar five">
        {steps.map((_, i) => (
          <i
            className={i < step ? "done" : i === step ? "current" : ""}
            key={i}
          />
        ))}
      </div>
      <div className="guided-hero">
        <p className="kicker">Now playing · key of {practisedIn}</p>
        <h1>{current.drill.name}</h1>
        <strong>{elapsedLabel}</strong>
        <span>elapsed</span>
      </div>
      <MetronomeBar metronome={metronome} subdivisions={false} />
      <section className="up-next">
        <div className="section-head">
          <h2>Up next · all in {practisedIn}</h2>
        </div>
        {steps.slice(step + 1).map((next, i) => (
          <div key={`${next.drillId}${i}`} style={cssVars(practisedIn)}>
            <i />
            <strong>{next.drill.name}</strong>
            <span>{next.mins} min</span>
          </div>
        ))}
      </section>
      <div className="transport guided-actions">
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
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
