"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 *
 * Its L1 parent (DrillDetail) loads the sessions and hands them down, which is
 * why this file has no hook and no client import.
 */
import type { KeyName } from "@/lib/fretlab/types";
import { StateNotice } from "@/components/fretlab/StateNotice";

export type DrillHistoryEntry = {
  id: string;
  day: string;
  bpm: number | null;
  accuracy: number | null;
  time: string;
};

export type DrillHistoryStats = {
  bestTempo: number | null;
  averageAccuracy: number | null;
  totalReps: number;
  sessionCount: number;
};

export function DrillHistory({
  rootKey,
  entries,
  stats,
  state,
  errorMessage,
  signedOut,
  onStart,
}: {
  rootKey: KeyName;
  entries: DrillHistoryEntry[];
  stats: DrillHistoryStats;
  state: "loading" | "error" | "ready";
  errorMessage?: string;
  signedOut?: boolean;
  onStart?: () => void;
}) {
  if (state === "loading") {
    return (
      <section className="drill-history">
        <StateNotice tone="loading" title="Loading this drill's history" />
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="drill-history">
        <StateNotice
          tone="error"
          title="This drill's history did not load"
          detail={errorMessage}
          actionLabel="Try again"
          onAction={() => window.location.reload()}
        />
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="drill-history">
        <StateNotice
          tone="empty"
          title={signedOut ? "Sign in to keep a history" : "No sessions logged for this drill"}
          detail={
            signedOut
              ? "Sessions are saved to your account, so your history follows you between devices."
              : "Run it once and your tempo, accuracy and reps appear here."
          }
          actionLabel={signedOut ? "Sign in" : "Start this drill"}
          onAction={onStart}
        />
      </section>
    );
  }

  const newest = entries[0];
  const oldest = entries[entries.length - 1];
  const tempoGain =
    newest.bpm !== null && oldest.bpm !== null && entries.length > 1 ? newest.bpm - oldest.bpm : null;

  return (
    <section className="drill-history">
      <header>
        <p className="kicker">Practice history</p>
        <h2>
          {tempoGain !== null && tempoGain > 0
            ? "This shape is becoming automatic"
            : "Building this shape"}
        </h2>
        <p>
          {tempoGain !== null && tempoGain > 0
            ? `Tempo is up ${tempoGain} bpm across your last ${entries.length} sessions.`
            : `${entries.length} ${entries.length === 1 ? "session" : "sessions"} logged in ${rootKey}.`}
        </p>
      </header>
      <div className="history-summary">
        <article>
          <span>Best clean tempo</span>
          <strong>
            {stats.bestTempo ?? "—"} <small>bpm</small>
          </strong>
          <b>{tempoGain !== null && tempoGain > 0 ? `+${tempoGain} recently` : "Your fastest clean pass"}</b>
        </article>
        <article>
          <span>Average accuracy</span>
          <strong>
            {stats.averageAccuracy ?? "—"}
            <small>%</small>
          </strong>
          <b>
            {entries.length}-session average
          </b>
        </article>
        <article>
          <span>Total repetitions</span>
          <strong>{stats.totalReps.toLocaleString()}</strong>
          <b>
            Across {stats.sessionCount} {stats.sessionCount === 1 ? "session" : "sessions"}
          </b>
        </article>
      </div>
      <div className="history-grid">
        <section>
          <div className="section-head">
            <h2>Tempo and accuracy</h2>
            <span>Last {entries.length === 1 ? "session" : `${entries.length} sessions`}</span>
          </div>
          <div className="history-bars">
            {entries.map((session) => (
              <div key={session.id}>
                <span>{session.day}</span>
                <i>
                  <b style={{ width: `${session.accuracy ?? 0}%` }} />
                </i>
                <strong>{session.accuracy ?? "—"}%</strong>
                <small>{session.bpm ?? "—"} bpm</small>
              </div>
            ))}
          </div>
        </section>
        <aside>
          <div className="section-head">
            <h2>Next target</h2>
            <span>Key of {rootKey}</span>
          </div>
          <strong>
            {stats.bestTempo === null
              ? "Log a tempo to set a target."
              : `Hold ${stats.bestTempo + 4} bpm without losing accuracy.`}
          </strong>
          <p>
            {stats.averageAccuracy !== null && stats.averageAccuracy >= 90
              ? "Accuracy is holding. Move the tempo up before adding length."
              : "Keep the tempo where it is until accuracy sits above 90%."}
          </p>
          <div>
            <span>Next target</span>
            <b>
              {stats.bestTempo === null
                ? "Set a tempo"
                : `${stats.bestTempo + 4} bpm at 92%+`}
            </b>
          </div>
        </aside>
      </div>
      <div className="session-log">
        <div className="section-head">
          <h2>Session log</h2>
          <span>Most recent first</span>
        </div>
        {entries.map((session) => (
          <div key={session.id}>
            <span className="history-check">
              {(session.accuracy ?? 0) >= 90 ? "✓" : "·"}
            </span>
            <strong>{session.day}</strong>
            <span>{session.time}</span>
            <span>{session.bpm ?? "—"} bpm</span>
            <span>{session.accuracy ?? "—"}% accurate</span>
          </div>
        ))}
      </div>
    </section>
  );
}
