"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
/**
 * Runs a routine, one step at a time, and records what was practised.
 *
 * This screen used to ignore every input it was given. The drill title was the
 * string "Position one, up and back", the notes were always
 * `scaleShape(key, 1, 5)`, the step bar always read "step 2 of 4", and "Finish
 * session" recorded nothing — so starting any routine from any screen showed
 * the same drill and left no trace. `Progress`'s empty state said "Start a
 * routine", which led here, which meant a new user following the app's own
 * instruction watched their progress screen stay empty forever.
 *
 * What it records is only what it measured: a duration, the tempo it was set
 * to, the drill and the key. There is no accuracy — the runner is a timer and
 * has nothing to be accurate about. The column stays null, which `Progress`
 * already handles, rather than being filled with a plausible number.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import type { LastRun, RunStep } from "@/lib/fretlab/lastRun";
import { ApiClientError, api } from "@/lib/api/client";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { MetronomeBar } from "@/components/fretlab/MetronomeBar";
import { StateNotice } from "@/components/fretlab/StateNotice";
import { StatusBar } from "@/components/fretlab/StatusBar";
import type { RunPlan } from "@/lib/fretlab/library";
import { runPlanFor } from "@/lib/fretlab/library";
import { drillShape } from "@/lib/fretlab/fingering";
import { saveLastRun } from "@/lib/fretlab/lastRun";
import { useElapsed } from "@/lib/fretlab/useElapsed";
import { useMetronome } from "@/lib/fretlab/useMetronome";
import { useState } from "react";
import { useGuitarSetup } from "@/lib/fretlab/GuitarSetup";

export function Runner({
  go,
  sessionKey,
  routineId,
  startStep = 0,
}: {
  go: (view: View) => void;
  sessionKey: KeyName;
  /** A routine id, or a drill id for a one-step run. */
  routineId: string;
  startStep?: number;
}) {
  const plan = runPlanFor(routineId, sessionKey);
  const [step, setStep] = useState(startStep);
  // Steps already finished, so their time survives moving on to the next one.
  const [done, setDone] = useState<RunStep[]>([]);
  const [saving, setSaving] = useState(false);

  if (!plan || plan.steps.length === 0) {
    return (
      <div className="screen-content flow-screen runner-screen">
        <StatusBar end="Practice run" />
        <StateNotice
          tone="error"
          title="There is nothing to run here"
          detail="That routine or drill no longer exists. Pick one from the list."
          actionLabel="Back to routines"
          onAction={() => go("routines")}
        />
      </div>
    );
  }

  return (
    <RunnerBody
      go={go}
      plan={plan}
      step={step}
      setStep={setStep}
      done={done}
      setDone={setDone}
      saving={saving}
      setSaving={setSaving}
    />
  );
}

/**
 * Split out so the hooks below never sit after the early return above: a
 * missing routine must not change how many hooks the component calls.
 */
function RunnerBody({
  go,
  plan,
  step,
  setStep,
  done,
  setDone,
  saving,
  setSaving,
}: {
  go: (view: View) => void;
  plan: RunPlan;
  step: number;
  setStep: (step: number) => void;
  done: RunStep[];
  setDone: (steps: RunStep[]) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}) {
  const { tuning } = useGuitarSetup();
  const steps = plan.steps;
  const practisedIn = plan.key;
  const index = Math.min(step, steps.length - 1);
  const current = steps[index];
  const drill = current.drill;

  // Restarts on every step, so the clock measures this drill rather than the
  // whole sitting.
  const { seconds, label: elapsedLabel } = useElapsed(`${plan.id}:${index}`);
  const metronome = useMetronome({
    // A drill with bpm 0 is not played to a click; it still gets a metronome,
    // just not one that claims a tempo the drill never asked for.
    bpm: drill.bpm || 84,
    meter: 4,
    countInBars: 1,
  });

  const shape = drillShape(drill, practisedIn, false, tuning);
  const planned = current.mins * 60;
  const over = seconds >= planned;
  const last = index >= steps.length - 1;

  const bank = (): RunStep[] => [
    ...done,
    {
      drillId: drill.id,
      name: drill.name,
      seconds: Math.max(1, seconds),
      bpm: drill.bpm || null,
    },
  ];

  const next = () => {
    setDone(bank());
    setStep(index + 1);
  };

  const finish = async () => {
    const played = bank();
    setSaving(true);
    metronome.stop();

    // One session per step, with only what was measured. Recorded in order so
    // the summary and the history read the same way.
    let saveError: string | null = null;
    for (const each of played) {
      try {
        await api.createPracticeSession({
          title: `${plan.name} · ${each.name}`,
          drill_id: each.drillId,
          music_key: practisedIn,
          bpm: each.bpm ?? undefined,
          duration_seconds: each.seconds,
          tags: [practisedIn, "routine", plan.id],
        });
      } catch (error) {
        // A signed-out visitor can still practise; only the saving fails, and
        // saying so beats a silent no-op.
        saveError =
          error instanceof ApiClientError && error.code === "unauthenticated"
            ? "Sign in to save this run to your history."
            : error instanceof ApiClientError
              ? error.message
              : "That run was not saved. Your practice still counted.";
        break;
      }
    }

    const run: LastRun = {
      routineId: plan.id,
      routineName: plan.name,
      musicKey: practisedIn,
      finishedAt: new Date().toISOString(),
      steps: played,
      saveError,
    };
    saveLastRun(run);
    setSaving(false);
    go("summary");
  };

  return (
    <div className="screen-content flow-screen runner-screen">
      <StatusBar end={`Step ${index + 1} of ${steps.length}`} />
      <div className="step-bar" aria-label={`Step ${index + 1} of ${steps.length}`}>
        {steps.map((each, i) => (
          <i
            className={i < index ? "done" : i === index ? "current" : ""}
            key={`${each.drillId}${i}`}
          />
        ))}
      </div>
      <div className="runner-hero">
        <p className="kicker">
          {plan.name} · key of {practisedIn}
        </p>
        <h1>{drill.name}</h1>
        <p>{drill.cue}</p>
      </div>
      <Fretboard
        notes={shape.notes}
        low={shape.windowLow}
        high={shape.windowHigh}
        labelMode="degree"
        rootKey={practisedIn}
      />
      <div className="elapsed">
        <strong>{elapsedLabel}</strong>
        <span>
          of {current.mins} min{over ? " · time's up" : ""}
        </span>
      </div>
      <MetronomeBar metronome={metronome} />
      {/* Carried over from Guided, which was deleted in FD-03. Knowing what is
          coming is the one thing that screen did that this one did not, and it
          is what stops a routine feeling like an unmarked queue. */}
      {steps.length > 1 && !last && (
        <section className="up-next">
          <div className="section-head">
            <h2>Up next · all in {practisedIn}</h2>
          </div>
          {steps.slice(index + 1).map((step, i) => (
            <div key={`${step.drillId}${i}`}>
              <i />
              <strong>{step.drill.name}</strong>
              <span>{step.mins} min</span>
            </div>
          ))}
        </section>
      )}
      <div className="runner-advance">
        {last ? (
          <button className="primary-action" onClick={finish} disabled={saving}>
            {saving ? "Saving…" : steps.length === 1 ? "Finish drill" : "Finish routine"}
          </button>
        ) : (
          <button className="primary-action" onClick={next}>
            Next drill <span>→</span>
          </button>
        )}
      </div>
      <button className="finish-link" onClick={finish} disabled={saving}>
        End here and save
      </button>
    </div>
  );
}
