"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { DesktopPracticeStudio } from "@/app/_sections/DesktopPracticeStudio";
import { Ring } from "@/components/fretlab/Ring";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { cssVars } from "@/lib/fretlab/palette";
import { DRILLS, ROUTINES } from "@/lib/fretlab/library";
import { StateNotice } from "@/components/fretlab/StateNotice";
import { lastAccuracyByDrill, summarise, weekMinutes } from "@/lib/api/progress";
import { usePracticeSessions } from "@/lib/api/hooks";
import { useClock } from "@/lib/fretlab/useClock";

export function Today({
  go,
  sessionKey,
}: {
  go: (view: View) => void;
  sessionKey: KeyName;
}) {
  // §5: L1 owns the data. Every figure on this screen is the player's own or
  // is not shown. It used to greet a brand-new account with a 31 day streak.
  const history = usePracticeSessions({ limit: 100 });
  const sessions = history.data ?? [];
  const stats = summarise(sessions);
  const week = weekMinutes(sessions);
  const weekTotal = week.reduce((sum, day) => sum + day.minutes, 0);
  const peak = Math.max(1, ...week.map((day) => day.minutes));
  const accuracyByDrill = lastAccuracyByDrill(sessions);
  const { dayName, greeting } = useClock();

  // The session the Start button actually begins, read from the routine rather
  // than asserted. bpm is not shown: a routine has no tempo of its own.
  const routine = ROUTINES[0];
  const routineMinutes = routine.drills.reduce((sum, step) => sum + step.mins, 0);

  // "Pick up again" means drills with history, newest first.
  const resumable = DRILLS.filter((drill) => accuracyByDrill.has(drill.id)).slice(0, 2);

  return (
    <div className="screen-content today-screen">
      <StatusBar
        end={stats.streakDays ? `${stats.streakDays} day streak` : "No streak yet"}
      />
      <div className="today-greeting">
        <p>{dayName}</p>
        <h1>{greeting}</h1>
      </div>
      <article className="session-hero">
        <div className="key-watermark">{sessionKey}</div>
        <p className="kicker">Today&apos;s session</p>
        <h2>The key of {sessionKey}</h2>
        <p>
          {routine.name}. Every drill in one key, so the shapes start rhyming.
        </p>
        <div className="session-stats">
          <div>
            <strong>{routineMinutes}</strong>
            <span>minutes</span>
          </div>
          <div>
            <strong>{routine.drills.length}</strong>
            <span>drills</span>
          </div>
        </div>
        <button className="primary-action" onClick={() => go("runner")}>
          Start session <span>→</span>
        </button>
      </article>
      <section className="section">
        <div className="section-head">
          <h2>This week</h2>
          <span>{weekTotal} min</span>
        </div>
        <div className="week-chart">
          {week.map((day, i) => (
            <div className="day" key={i}>
              <div
                className={`bar-track ${day.isToday ? "today" : ""}`}
                title={`${day.minutes} minutes`}
              >
                <span
                  style={{
                    height: day.minutes
                      ? `${Math.max(18, Math.round((day.minutes / peak) * 100))}%`
                      : 0,
                  }}
                />
              </div>
              <span>{day.label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Pick up again · {sessionKey} major</h2>
        </div>
        {resumable.length ? (
          <div className="resume-grid">
            {resumable.map((drill) => (
              <button
                key={drill.id}
                style={cssVars(sessionKey)}
                onClick={() => go("drill-detail")}
              >
                <span className="key-chip">Key {sessionKey}</span>
                <Ring value={accuracyByDrill.get(drill.id) ?? 0} />
                <strong>{drill.name}</strong>
                <small>{drill.minutes} min</small>
              </button>
            ))}
          </div>
        ) : (
          <StateNotice
            tone="empty"
            title="Nothing to pick up yet"
            detail="Finish a training module and the drills you have worked on appear here."
            actionLabel="Open training"
            onAction={() => go("train")}
          />
        )}
      </section>
      <DesktopPracticeStudio go={go} sessionKey={sessionKey} />
    </div>
  );
}
