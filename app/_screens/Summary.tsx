"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { View } from "@/lib/fretlab/types";
import { Ring } from "@/components/fretlab/Ring";
import { StatusBar } from "@/components/fretlab/StatusBar";

export function Summary({ go }: { go: (view: View) => void }) {
  return (
    <div className="screen-content summary-screen">
      <StatusBar end="Complete" />
      <article>
        <p className="kicker">Session complete</p>
        <Ring value={92} size={168} />
        <h1>Strong work</h1>
        <p>
          You kept the pulse through the shape and found every G on the neck.
          The turnaround is the one place to slow down tomorrow.
        </p>
        <div className="accuracy-list">
          {[
            ["Position one", 96],
            ["Thirds", 88],
            ["Locate G", 92],
            ["Changes", 84],
          ].map(([name, value]) => (
            <div key={name}>
              <span>{name}</span>
              <strong>{value}%</strong>
              <i>
                <b style={{ width: `${value}%` }} />
              </i>
            </div>
          ))}
        </div>
      </article>
      <div className="action-row">
        <button className="secondary-action">Share</button>
        <button className="primary-action" onClick={() => go("today")}>
          Back to today
        </button>
      </div>
    </div>
  );
}
