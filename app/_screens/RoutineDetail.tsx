"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { ROUTINES } from "@/lib/fretlab/library";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { scaleShape } from "@/lib/fretlab/theory";
import { useState } from "react";

export function RoutineDetail({
  go,
  sessionKey,
}: {
  go: (view: View) => void;
  sessionKey: KeyName;
}) {
  const [tab, setTab] = useState("Drills");
  const routine = ROUTINES[1];
  const total = routine.drills.reduce((sum, d) => sum + d.mins, 0);
  return (
    <div className="screen-content detail-screen">
      <AppHeader
        title={routine.name}
        meta="Routine"
        onBack={() => go("routines")}
      />
      <p className="detail-lede">
        {total} minutes · {routine.drills.length} drills · everything in{" "}
        {sessionKey} major
      </p>
      <SegmentTabs
        labels={["Drills", "Guided", "Settings"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Drills" && (
        <ol className="routine-drills">
          {routine.drills.map((drill, i) => (
            <li className={i === 1 ? "current" : ""} key={drill.name}>
              <span>{i + 1}</span>
              <Fretboard
                notes={scaleShape(sessionKey, 1, 4).slice(i, i + 6)}
                low={1}
                high={4}
                mini
                rootKey={sessionKey}
              />
              <div>
                <strong>{drill.name}</strong>
                <small>
                  {drill.phase} · {drill.mins} min · key {sessionKey}
                </small>
              </div>
              <em>{i === 0 ? "done" : i === 1 ? "now" : "next"}</em>
            </li>
          ))}
        </ol>
      )}
      {tab === "Guided" && (
        <article className="tab-copy">
          <h2>Stay in the flow</h2>
          <p>
            Guided mode keeps time, moves you between drills, and shows what is
            coming next so your hands never cool down.
          </p>
        </article>
      )}
      {tab === "Settings" && (
        <article className="tab-copy">
          <h2>Routine settings</h2>
          <p>
            Repeat three times a week. Metronome count-in is on and transitions
            last ten seconds.
          </p>
        </article>
      )}
      <div className="action-row sticky-action">
        <button className="secondary-action">Edit</button>
        <button className="primary-action" onClick={() => go("guided")}>
          Start guided
        </button>
      </div>
    </div>
  );
}
