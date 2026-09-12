"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { FIFTHS } from "@/lib/fretlab/theory";
import { ROUTINES, routineKey, routineSteps } from "@/lib/fretlab/library";
import { cssVars } from "@/lib/fretlab/palette";
import { usePracticeSessions } from "@/lib/api/hooks";
import { routineProgress, weekMinutes } from "@/lib/api/progress";

export function Routines({
  go,
  selectedKey,
}: {
  /** Takes an id too: the runner needs to know what it is running. */
  go: (view: View, id?: string) => void;
  selectedKey: KeyName;
}) {
  // §5: L1 owns the data. These were literals: 3 sessions, 68 minutes.
  const history = usePracticeSessions({ limit: 100 });
  const week = weekMinutes(history.data ?? []);
  const weekTotal = week.reduce((sum, day) => sum + day.minutes, 0);
  const weekSessions = week.filter((day) => day.minutes > 0).length;
  return (
    <div className="screen-content routines-screen">
      <AppHeader
        title={`${selectedKey} practice routines`}
        meta="Habit builder"
      />
      <p className="routines-intro">
        Each routine keeps one key active while skills build in a deliberate
        order.
      </p>
      <section className="routine-principle">
        <span>01 Warm hands</span>
        <i>→</i>
        <span>02 Map the key</span>
        <i>→</i>
        <span>03 Target harmony</span>
        <i>→</i>
        <span>04 Make music</span>
      </section>
      <section className="desktop-routine-summary">
        <div>
          <span>This week</span>
          <strong>{weekSessions}</strong>
          <small>{weekSessions === 1 ? "session" : "sessions"}</small>
        </div>
        <div>
          <span>Practice time</span>
          <strong>{weekTotal}</strong>
          <small>minutes</small>
        </div>
        <div>
          <span>Current context</span>
          <strong>{selectedKey}</strong>
          <small>major · all drills</small>
        </div>
        <button onClick={() => go("routine-detail")}>
          Open today&apos;s plan <span>→</span>
        </button>
      </section>
      <div className="routine-list">
        {ROUTINES.map((routine, index) => {
          const steps = routineSteps(routine);
          const progress = routineProgress(
            history.data ?? [],
            routine.drills.map((step) => step.drillId),
          );
          const total = steps.reduce((sum, step) => sum + step.mins, 0);
          const practisedIn = routineKey(routine, selectedKey);
          return (
            <article
              className="routine-card"
              key={routine.name}
              style={cssVars(
                FIFTHS[(FIFTHS.indexOf(selectedKey) + index * 2) % 12],
              )}
            >
              <div className="routine-title">
                <div>
                  <span className="key-chip">Key {practisedIn}</span>
                  <h2>{routine.name}</h2>
                  <p>
                    {total} min · {steps.length} linked drills ·{" "}
                    {routine.cadence}
                  </p>
                </div>
              </div>
              <div className="routine-sequence">
                {steps.map((step, i) => (
                  <div key={`${step.drillId}${i}`}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <strong>{step.drill.name}</strong>
                    <small>
                      {step.phase} · {step.mins} min
                    </small>
                    {i < steps.length - 1 && <i>→</i>}
                  </div>
                ))}
              </div>
              <div className="routine-foot">
                {/* Dots and a date used to be literals: three filled and
                    "Yesterday" on an account with no history at all. They
                    count days these drills were actually practised, and say
                    nothing when that is nothing. */}
                <span>
                  {progress.last ? (
                    <>
                      {[1, 2, 3].map((n) => (
                        <i className={n <= progress.completed ? "on" : ""} key={n} />
                      ))}{" "}
                      Drills last practised {progress.last}
                    </>
                  ) : (
                    "Not practised yet"
                  )}
                </span>
                <button onClick={() => go("runner", routine.id)}>
                  Start routine
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
