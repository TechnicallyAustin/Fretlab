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

export function Today({
  go,
  sessionKey,
}: {
  go: (view: View) => void;
  sessionKey: KeyName;
}) {
  const week = [
    ["M", 14],
    ["T", 22],
    ["W", 8],
    ["T", 18],
    ["F", 6],
    ["S", 0],
    ["S", 0],
  ] as const;
  return (
    <div className="screen-content today-screen">
      <StatusBar end="31 day streak" />
      <div className="today-greeting">
        <p>Thursday</p>
        <h1>Good evening</h1>
      </div>
      <article className="session-hero">
        <div className="key-watermark">{sessionKey}</div>
        <p className="kicker">Today&apos;s session</p>
        <h2>The key of {sessionKey}</h2>
        <p>
          Four drills that all live in one key, so the shapes start rhyming.
        </p>
        <div className="session-stats">
          <div>
            <strong>18</strong>
            <span>minutes</span>
          </div>
          <div>
            <strong>4</strong>
            <span>drills</span>
          </div>
          <div>
            <strong>84</strong>
            <span>bpm</span>
          </div>
        </div>
        <button className="primary-action" onClick={() => go("runner")}>
          Start session <span>→</span>
        </button>
      </article>
      <section className="section">
        <div className="section-head">
          <h2>This week</h2>
          <span>68 min</span>
        </div>
        <div className="week-chart">
          {week.map(([day, mins], i) => (
            <div className="day" key={`${day}${i}`}>
              <div
                className={`bar-track ${i === 4 ? "today" : ""}`}
                title={`${mins} minutes`}
              >
                <span
                  style={{
                    height: mins
                      ? `${Math.max(18, Math.round((mins / 22) * 100))}%`
                      : 0,
                  }}
                />
              </div>
              <span>{day}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Pick up again · {sessionKey} major</h2>
        </div>
        <div className="resume-grid">
          <button
            style={cssVars(sessionKey)}
            onClick={() => go("drill-detail")}
          >
            <span className="key-chip">Key {sessionKey}</span>
            <Ring value={62} />
            <strong>Locate every root</strong>
            <small>3 min left</small>
          </button>
          <button
            style={cssVars(sessionKey)}
            onClick={() => go("drill-detail")}
          >
            <span className="key-chip">Key {sessionKey}</span>
            <Ring value={23} />
            <strong>Pentatonic box one</strong>
            <small>6 min left</small>
          </button>
        </div>
      </section>
      <DesktopPracticeStudio go={go} sessionKey={sessionKey} />
    </div>
  );
}
