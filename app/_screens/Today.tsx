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
import {
  lastAccuracyByDrill,
  summarise,
  weekMinutes,
  workweekContributionMinutes,
} from "@/lib/api/progress";
import { usePracticeSessions } from "@/lib/api/hooks";
import { dueToday, reviewSchedule } from "@/lib/api/review";
import { Button, Heatmap, HeatLegend, SessionCard } from "@/components/ui";
import { useClock } from "@/lib/fretlab/useClock";

export function Today({
  go,
  sessionKey,
}: {
  /** Takes an id too: the runner needs to know what it is running. */
  go: (view: View, id?: string) => void;
  sessionKey: KeyName;
}) {
  // §5: L1 owns the data. Every figure on this screen is the player's own or
  // is not shown. It used to greet a brand-new account with a 31 day streak.
  const history = usePracticeSessions({ limit: 100 });
  const sessions = history.data ?? [];
  const accuracyByDrill = lastAccuracyByDrill(sessions);

  // `now` is null until the client has a clock. Everything below that is
  // date-relative waits for it: the server has neither the user's clock nor
  // their timezone, so it drew a different week of day labels than the browser
  // did and React threw a hydration mismatch on this screen.
  //
  // The check is `typeof`, not `=== null`, and that matters. A stale module in
  // the browser — a hot reload that replaced this file but not `useClock` —
  // hands back an object with no `now` on it at all, and `undefined === null`
  // is false. That slipped past the guard and threw "Invalid time value" from
  // inside a date helper. Anything that is not a number means no clock yet.
  const { dayName, greeting, now } = useClock();
  const stats = typeof now !== "number" ? null : summarise(sessions, now);
  // What the app thinks should be practised today, replayed from the sessions
  // that were actually scored. Timed runs are practice, not review, so they do
  // not appear here — see lib/api/review.ts.
  const due =
    typeof now !== "number" ? [] : dueToday(reviewSchedule(sessions, now), now);
  const week = typeof now !== "number" ? null : weekMinutes(sessions, now);
  const weekTotal = week?.reduce((sum, day) => sum + day.minutes, 0) ?? 0;
  // The tallest bar in the week, so a light week still reads as a shape rather
  // than as five slivers. Never zero, or every bar divides by it.
  const peak = Math.max(1, ...(week ?? []).map((day) => day.minutes));
  const contributionWeeks =
    typeof now !== "number" ? null : workweekContributionMinutes(sessions, 5, now);

  // The session the Start button actually begins, read from the routine rather
  // than asserted. bpm is not shown: a routine has no tempo of its own.
  const routine = ROUTINES[0];
  const routineMinutes = routine.drills.reduce((sum, step) => sum + step.mins, 0);

  // "Pick up again" means drills with history, newest first.
  const resumable = DRILLS.filter((drill) => accuracyByDrill.has(drill.id)).slice(0, 2);

  return (
    <div className="fl-root screen-content today-screen">
      <StatusBar
        end={
          stats === null
            ? "FretLab"
            : stats.streakDays
              ? `${stats.streakDays} day streak`
              : "No streak yet"
        }
      />
      <div className="today-greeting">
        <p>{dayName}</p>
        <h1>{greeting}</h1>
      </div>
      {due.length > 0 && (
        <button className="review-banner" onClick={() => go("train")}>
          <span>Today&apos;s review</span>
          <strong>
            {due.length} {due.length === 1 ? "item" : "items"}
          </strong>
          <small>
            {due.some((item) => item.leech)
              ? "One is not sticking — try it slower"
              : `Due now · ${due[0].musicKey}`}
          </small>
          <b>→</b>
        </button>
      )}
      <SessionCard
        title={`The key of ${sessionKey}`}
        sub={`${routine.name}. Every drill in one key, so the shapes start rhyming.`}
        stats={[
          { value: routineMinutes, label: "minutes" },
          { value: routine.drills.length, label: "drills" },
        ]}
        primary={
          /* The runner needs to know which routine: it used to render the
             same hardcoded drill whichever one you started. */
          <Button
            variant="primary"
            block
            trailing="\u2192"
            onClick={() => go("runner", routine.id)}
          >
            Start session
          </Button>
        }
        secondary={
          /* The reasons a lot of people open a guitar app on a weekday, so
             they sit on the first screen rather than behind the library. */
          <div className="today-side-actions">
            <Button variant="onDark" block onClick={() => go("tuner")}>
              Tune up first
            </Button>
            <Button variant="onDark" block onClick={() => go("ear")}>
              Train your ear
            </Button>
          </div>
        }
      />
      {/* Seven day labels come from the clock alone, with or without any
          sessions, so this whole section waits for a client clock rather than
          rendering an empty chart the browser then disagrees with. */}
      {week && (
      <section className="section">
        <div className="section-head">
          <h2>This week</h2>
          <span>{weekTotal} min</span>
        </div>
        {/* Seven bars, one per day, at the minutes actually practised. This was
            replaced by the five-level contribution grid below, which lost both
            the weekend and the magnitude: a 40-minute Tuesday and a 10-minute
            one are the same square. The bars answer "how much", the grid below
            answers "how often" — they are different questions. */}
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
        {contributionWeeks && (
          <>
          {/* Five labels and the range, both explicit. The kit defaults to
              seven weekdays and "Last 3 months"; this data is five weeks of
              weekdays. The extra rows would draw as empty cells and read as
              "never practises at weekends", which is the opposite of the note
              below — and of the kit's own comment on the component. */}
          <Heatmap
            weeks={contributionWeeks}
            rowLabels={["M", "Tu", "W", "Th", "F"]}
            rangeLabel="Last five weeks"
          />
          <HeatLegend />
          <p className="contribution-note">
            Weekdays only. Weekend practice still counts towards your streak.
          </p>
          </>
        )}
      </section>
      )}
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
                onClick={() => go("drill-detail", drill.id)}
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
