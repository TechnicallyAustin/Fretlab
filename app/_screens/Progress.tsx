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
  insights,
  summarise,
  type RangeLabel,
} from "@/lib/api/progress";
import { useState } from "react";

export function Progress({
  go,
  selectedKey,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
}) {
  const [range, setRange] = useState<RangeLabel>("14 days");

  // §5: L1 owns the data. Pulls the whole recent window once and derives every
  // figure on this screen from it, so the range buttons need no extra request.
  const history = usePracticeSessions({ limit: 100, musicKey: selectedKey });
  const sessions = history.data ?? [];

  const values = accuracySeries(sessions, range);
  const stats = summarise(sessions);
  const consistency = consistencyLevels(sessions);
  const activeWeeks = 26;

  // A single point has no line to draw; repeat it so the chart still reads.
  const plotted = values.length === 1 ? [values[0], values[0]] : values;
  const points = plotted
    .map(
      (v, i) =>
        `${(i / Math.max(1, plotted.length - 1)) * 100},${100 - ((v - 55) / 40) * 82}`,
    )
    .join(" ");

  if (history.status === "loading") {
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
        <Ring value={stats.accuracy ?? 0} size={142} />
        <div>
          <p className="kicker">Neck knowledge · {selectedKey}</p>
          <h2>
            {stats.accuracy === null
              ? "No accuracy logged yet"
              : `${stats.accuracy}% accurate`}
          </h2>
          <p>
            {stats.sessionCount === 1
              ? "One session in. Run the routine again to see the trend."
              : `Averaged across ${stats.sessionCount} sessions in ${selectedKey}.`}
          </p>
          <div className="mini-stats">
            <span>
              <strong>{stats.streakDays}</strong> day streak
            </span>
            <span>
              <strong>{stats.reps.toLocaleString()}</strong> reps
            </span>
          </div>
        </div>
      </article>
      <section className="chart-card">
        <div className="section-head">
          <h2>Daily accuracy</h2>
          <span>Last {range}</span>
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
            {stats.activeDays === 1 ? "day" : "days"}
          </span>
        </div>
        <div className="commit-months">
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
          <span>Aug</span>
        </div>
        <div className="commit-layout">
          <div className="commit-days">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          <div
            className="commit-graph"
            aria-label="Practice activity across 26 weeks"
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
        {insights(sessions).map((insight) => (
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
