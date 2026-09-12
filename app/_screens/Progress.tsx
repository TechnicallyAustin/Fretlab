"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { Ring } from "@/components/fretlab/Ring";
import { StateNotice } from "@/components/fretlab/StateNotice";
import { usePracticeSessions } from "@/lib/api/hooks";
import {
  accuracySeries,
  consistencyLevels,
  consistencyMonths,
  insights,
  summarise,
  type RangeLabel,
} from "@/lib/api/progress";
import { useClock } from "@/lib/fretlab/useClock";
import { useState } from "react";

export function Progress({
  go,
  selectedKey,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
}) {
  const [range, setRange] = useState<RangeLabel>("14 days");

  // §5: L1 owns the data. The whole history, once, so the range buttons need no
  // extra request — and so the figures below are not computed from a slice.
  //
  // This used to be `{ limit: 100, musicKey: selectedKey }`, and every figure
  // on the screen came from that filtered set. A streak is a fact about days
  // practised, not about keys: practise daily in a different key each day and
  // the app congratulated you on a streak of 1. Same for the consistency graph
  // and the active-day count. The 100-row cap made it worse the longer you
  // played, silently blanking the oldest squares of a 26-week graph.
  const history = usePracticeSessions({ all: true });
  const sessions = history.data ?? [];

  // Accuracy is the one figure that *is* key-scoped, because comparing a score
  // in G to one in F# means nothing. It is filtered here and labelled as such
  // wherever it is shown.
  const inKey = sessions.filter((session) => session.music_key === selectedKey);

  // Every figure below is relative to the user's own calendar, which only the
  // client knows. The loading state covers the wait, so nothing here is ever
  // rendered against the server's clock.
  const { now } = useClock();
  const activeWeeks = 26;
  // Everything about *practising* comes from the whole history; only accuracy
  // is read from the selected key.
  const values = typeof now !== "number" ? [] : accuracySeries(inKey, range, now);
  const stats = typeof now !== "number" ? null : summarise(sessions, now);
  const keyStats = typeof now !== "number" ? null : summarise(inKey, now);
  const consistency = typeof now !== "number" ? [] : consistencyLevels(sessions, activeWeeks, now);
  const months = typeof now !== "number" ? [] : consistencyMonths(activeWeeks, now);

  // A single point has no line to draw; repeat it so the chart still reads.
  const plotted = values.length === 1 ? [values[0], values[0]] : values;
  // The scale used to be pinned to 55-95%, so a beginner scoring 40% drew a
  // line outside the SVG. It follows the data now, padded and clamped, and the
  // bounds are labelled so the shape of the line means something.
  const floor = Math.max(0, Math.min(...plotted, 100) - 5);
  const ceiling = Math.min(100, Math.max(...plotted, 0) + 5);
  const span = Math.max(1, ceiling - floor);
  const points = plotted
    .map((v, i) => {
      const x = (i / Math.max(1, plotted.length - 1)) * 100;
      const y = 100 - ((Math.min(Math.max(v, floor), ceiling) - floor) / span) * 82;
      return `${x},${y}`;
    })
    .join(" ");

  if (history.status === "loading" || typeof now !== "number" || stats === null || keyStats === null) {
    return (
      <div className="screen-content">
        <AppHeader title={`${selectedKey} progress`} meta="Consistency" />
        <StateNotice tone="loading" title="Loading your practice history" />
      </div>
    );
  }

  if (history.status === "error") {
    return (
      <div className="screen-content">
        <AppHeader title={`${selectedKey} progress`} meta="Consistency" />
        <StateNotice
          tone="error"
          title="Your practice history did not load"
          detail={history.error.message}
          actionLabel="Try again"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="screen-content">
        <AppHeader title={`${selectedKey} progress`} meta="Consistency" />
        <StateNotice
          tone="empty"
          title={
            history.signedOut
              ? "Sign in to track your progress"
              : `No practice logged in ${selectedKey} yet`
          }
          detail={
            history.signedOut
              ? "Your sessions are saved to your account, so your history follows you between devices."
              : "Run a routine and your accuracy, tempo and streak start building here."
          }
          actionLabel={history.signedOut ? "Sign in" : "Start a routine"}
          onAction={() => go(history.signedOut ? "signin" : "routines")}
        />
      </div>
    );
  }

  return (
    <div className="screen-content">
      <AppHeader
        title={`${selectedKey} progress`}
        meta="Consistency"
        action={
          <button className="text-action" onClick={() => go("routines")}>
            Routines
          </button>
        }
      />
      <div className="desktop-progress-range">
        <span>Performance window</span>
        <div>
          {(["7 days", "14 days", "30 days"] as const).map((item) => (
            <button
              className={range === item ? "active" : ""}
              onClick={() => setRange(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <article className="dial-card">
        {/* Accuracy is the key-scoped figure and says so. The streak and the
            reps are not: they count practice, which happens in every key. */}
        <Ring value={keyStats.accuracy ?? 0} size={142} />
        <div>
          <p className="kicker">Neck knowledge · {selectedKey}</p>
          <h2>
            {keyStats.accuracy === null
              ? `No accuracy logged in ${selectedKey} yet`
              : `${keyStats.accuracy}% accurate in ${selectedKey}`}
          </h2>
          <p>
            {keyStats.sessionCount === 0
              ? `Scored sessions in ${selectedKey} will show their average here.`
              : keyStats.sessionCount === 1
                ? `One session in ${selectedKey}. Run it again to see the trend.`
                : `Averaged across ${keyStats.sessionCount} sessions in ${selectedKey}.`}
          </p>
          <div className="mini-stats">
            <span>
              <strong>{stats.streakDays}</strong> day streak
            </span>
            <span>
              <strong>{stats.reps.toLocaleString()}</strong> reps
            </span>
            <span className="all-keys">across every key</span>
          </div>
        </div>
      </article>
      <section className="chart-card">
        <div className="section-head">
          <h2>Daily accuracy · {selectedKey}</h2>
          <span>
            Last {range} · {floor}–{ceiling}%
          </span>
        </div>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label={
            values.length
              ? `Daily accuracy, most recently ${values.at(-1)} percent, over the last ${range}`
              : `No accuracy logged in the last ${range}`
          }
        >
          <defs>
            <linearGradient id="spark" x1="0" x2="1">
              <stop stopColor="oklch(.58 .14 262)" />
              <stop offset="1" stopColor="oklch(.55 .15 148)" />
            </linearGradient>
            <linearGradient id="area" x1="0" x2="0" y2="1">
              <stop stopColor="oklch(.82 .07 289)" stopOpacity=".55" />
              <stop offset="1" stopColor="transparent" />
            </linearGradient>
          </defs>
          <polygon points={`0,100 ${points} 100,100`} fill="url(#area)" />
          <polyline
            points={points}
            fill="none"
            stroke="url(#spark)"
            strokeWidth="2.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </section>
      <section className="heat-card consistency-card">
        <div className="section-head">
          <h2>Practice consistency</h2>
          <span>
            {activeWeeks} weeks · {stats.activeDays} active{" "}
            {stats.activeDays === 1 ? "day" : "days"} · every key
          </span>
        </div>
        <div className="commit-months">
          {months.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
        <div className="commit-layout">
          <div className="commit-days">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          <div
            className="commit-graph"
            aria-label={`Practice activity across ${activeWeeks} weeks`}
          >
            {consistency.map((level, index) => (
              <span
                className={`level-${level}`}
                key={index}
                title={level ? `Practised (level ${level} of 4)` : "No practice"}
              />
            ))}
          </div>
        </div>
        <div className="commit-foot">
          <span>Daily practice builds the streak</span>
          <div>
            <small>Less</small>
            {[0, 1, 2, 3, 4].map((level) => (
              <i className={`level-${level}`} key={level} />
            ))}
            <small>More</small>
          </div>
        </div>
      </section>
      <section className="desktop-progress-insights">
        {insights(sessions, now).map((insight) => (
          <article key={insight.label}>
            <span>{insight.label}</span>
            <strong>{insight.value}</strong>
            <small>{insight.detail}</small>
            <i>
              <b style={{ width: `${insight.percent}%` }} />
            </i>
          </article>
        ))}
      </section>
    </div>
  );
}
