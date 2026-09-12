"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
/**
 * What the run you just finished actually recorded.
 *
 * This screen used to show a 92% ring, four per-drill percentages — "Position
 * one 96%, Thirds 88%" — and a paragraph telling you which turnaround to slow
 * down tomorrow, for a run that measured nothing and saved nothing. Every one
 * of those figures was a literal.
 *
 * The runner is a timer, so time is what this reports. There is no accuracy
 * here because there is no accuracy to report: `Train` is the screen that
 * scores, and its numbers show up on `Progress` where they were earned.
 */
import type { View } from "@/lib/fretlab/types";
import { StateNotice } from "@/components/fretlab/StateNotice";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { useLastRun } from "@/lib/fretlab/lastRun";

/** "4:05", the same shape the runner's own clock used. */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function Summary({ go }: { go: (view: View) => void }) {
  // An external store rather than an effect: sessionStorage does not exist on
  // the server, and reading it into state in an effect cascades renders.
  const run = useLastRun();

  if (!run) {
    return (
      <div className="screen-content summary-screen">
        <StatusBar end="Complete" />
        <StateNotice
          tone="empty"
          title="No finished run to show"
          detail="Run a routine through to the end and its summary appears here."
          actionLabel="Pick a routine"
          onAction={() => go("routines")}
        />
      </div>
    );
  }

  const total = run.steps.reduce((sum, step) => sum + step.seconds, 0);

  return (
    <div className="screen-content summary-screen">
      <StatusBar end="Complete" />
      <article>
        <p className="kicker">{run.routineName} · key of {run.musicKey}</p>
        <h1>{clock(total)}</h1>
        <p>
          {run.steps.length} {run.steps.length === 1 ? "drill" : "drills"}{" "}
          practised. Times are what the clock measured, not what the routine
          planned for.
        </p>
        {run.saveError && (
          <StateNotice
            tone="error"
            title="Not saved to your history"
            detail={run.saveError}
            actionLabel="Sign in"
            onAction={() => go("signin")}
          />
        )}
        <div className="run-step-list">
          {run.steps.map((step, i) => (
            <div key={`${step.drillId}${i}`}>
              <span>{step.name}</span>
              <strong>{clock(step.seconds)}</strong>
              <small>{step.bpm ? `${step.bpm} bpm` : "no click"}</small>
            </div>
          ))}
        </div>
      </article>
      <div className="action-row">
        <button className="secondary-action" onClick={() => go("progress")}>
          See progress
        </button>
        <button className="primary-action" onClick={() => go("today")}>
          Back to today
        </button>
      </div>
    </div>
  );
}
