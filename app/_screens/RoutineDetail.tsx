"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { ROUTINES, routineKey, routineSteps } from "@/lib/fretlab/library";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { drillShape } from "@/lib/fretlab/fingering";
import { useState } from "react";

export function RoutineDetail({
  go,
  sessionKey,
  onAdoptKey,
}: {
  /** Takes an id too: the runner needs to know what it is running. */
  go: (view: View, id?: string) => void;
  sessionKey: KeyName;
  /** Switch the global key to the routine's, when the two disagree. */
  onAdoptKey?: (key: KeyName) => void;
}) {
  const [tab, setTab] = useState("Drills");
  const routine = ROUTINES[1];
  const steps = routineSteps(routine);
  const total = steps.reduce((sum, step) => sum + step.mins, 0);
  // A routine may be written for a key of its own. Where that disagrees with
  // the key you chose, the screen says which one wins rather than showing one
  // and practising the other, which is what it used to do.
  const practisedIn = routineKey(routine, sessionKey);
  const borrowed = practisedIn !== sessionKey;
  return (
    <div className="screen-content detail-screen">
      <AppHeader
        title={routine.name}
        meta="Routine"
        onBack={() => go("routines")}
      />
      <p className="detail-lede">
        {total} minutes · {steps.length} drills · everything in {practisedIn}{" "}
        major
      </p>
      {borrowed && (
        <div className="key-conflict">
          <p>
            Practising in {practisedIn} — your key is {sessionKey}.
          </p>
          {onAdoptKey && (
            <button onClick={() => onAdoptKey(practisedIn)}>
              Switch my key to {practisedIn}
            </button>
          )}
        </div>
      )}
      <SegmentTabs
        labels={["Drills", "Guided", "Settings"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Drills" && (
        <ol className="routine-drills">
          {steps.map((step, i) => {
            // The mini board used to draw an arbitrary six-note slice of the
            // key's scale, the same notes whatever the step was. It draws the
            // step's own shape now, in the window it is actually played in.
            const shape = drillShape(step.drill, practisedIn);
            return (
            <li className={i === 1 ? "current" : ""} key={`${step.drillId}${i}`}>
              <span>{i + 1}</span>
              <Fretboard
                notes={shape.notes}
                low={shape.windowLow}
                high={shape.windowHigh}
                mini
                rootKey={practisedIn}
              />
              <div>
                <strong>{step.drill.name}</strong>
                <small>
                  {step.phase} · {step.mins} min · key {practisedIn}
                </small>
              </div>
              <em>{i === 0 ? "done" : i === 1 ? "now" : "next"}</em>
            </li>
            );
          })}
        </ol>
      )}
      {tab === "Guided" && (
        <article className="tab-copy">
          <h2>Stay in the flow</h2>
          <p>
            Guided mode keeps time, moves you between drills, and shows what is
            coming next so your hands never cool down.
          </p>
        </article>
      )}
      {tab === "Settings" && (
        <article className="tab-copy">
          <h2>Routine settings</h2>
          <p>
            Repeat three times a week. Metronome count-in is on and transitions
            last ten seconds.
          </p>
        </article>
      )}
      <div className="action-row sticky-action">
        <button className="secondary-action">Edit</button>
        {/* This led to Guided, which is hardcoded to one routine and records
            nothing, so the primary action on the routine screen left Progress
            empty. It starts the runner for this routine now. */}
        <button
          className="primary-action"
          onClick={() => go("runner", routine.id)}
        >
          Start routine
        </button>
      </div>
    </div>
  );
}
