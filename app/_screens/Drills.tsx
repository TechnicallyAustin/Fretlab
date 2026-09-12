"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { DRILLS } from "@/lib/fretlab/library";
import { FIFTHS } from "@/lib/fretlab/theory";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { Ring } from "@/components/fretlab/Ring";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { cssVars } from "@/lib/fretlab/palette";
import { drillShape, withPlayOrder } from "@/lib/fretlab/fingering";
import { lastAccuracyByDrill } from "@/lib/api/progress";
import { usePracticeSessions } from "@/lib/api/hooks";
import { useState } from "react";
import { useGuitarSetup } from "@/lib/fretlab/GuitarSetup";

export function Drills({
  go,
  selectedKey,
  onOpen,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
  onOpen: (id: string) => void;
}) {
  const { tuning } = useGuitarSetup();
  // §5: L1 owns the data. A drill shows progress only where the player has
  // actually recorded some; the library no longer ships a percentage.
  const history = usePracticeSessions({ limit: 100 });
  const accuracyByDrill = lastAccuracyByDrill(history.data ?? []);
  const [filter, setFilter] = useState("All");
  const [level, setLevel] = useState("All levels");
  const [query, setQuery] = useState("");
  const visible = DRILLS.filter(
    (drill) =>
      (filter === "All" || drill.category === filter) &&
      (level === "All levels" || drill.level === level) &&
      `${drill.name} ${drill.reason}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="screen-content drill-library-screen">
      <AppHeader
        title={`${selectedKey} drill library`}
        meta={`${visible.length} drills`}
        action={
          <button className="text-action" onClick={() => go("grouped")}>
            Learning paths
          </button>
        }
      />
      <section className="drill-library-hero">
        <div>
          <p className="kicker">One key · complete practice system</p>
          <h2>Build the neck in layers.</h2>
          <p>
            Every drill below is transposed to {selectedKey}. Start with
            landmarks, connect scales to chord tones, then add time and
            technique.
          </p>
        </div>
        <button onClick={() => go("routines")}>
          <span>Guided routine</span>
          <strong>18-minute {selectedKey} habit builder</strong>
          <small>Warm-up → map → harmony → music</small>
          <b>Start path →</b>
        </button>
      </section>
      <div className="drill-filter-stack">
        <SegmentTabs
          labels={[
            "All",
            "Neck knowledge",
            "Scale fluency",
            "Chord tones",
            "Intervals",
            "Harmony",
            "Technique",
          ]}
          active={filter}
          onChange={setFilter}
        />
        <div className="chip-scroll">
          {["All levels", "Beginner", "Intermediate", "Advanced"].map(
            (item) => (
              <button
                className={level === item ? "active" : ""}
                onClick={() => setLevel(item)}
                key={item}
              >
                {item}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="desktop-drill-tools">
        <label>
          <span>Search by skill or outcome</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try roots, chord tones, rhythm…"
          />
        </label>
        <div>
          <strong>{visible.length}</strong>
          <span>{selectedKey} major drills</span>
        </div>
      </div>
      <div className="drill-list">
        {visible.map((drill, index) => {
          const shape = drillShape(drill, selectedKey, false, tuning);
          const ordered = withPlayOrder(shape.notes);
          return (
          <button
            className="drill-card expanded"
            key={drill.id}
            onClick={() => onOpen(drill.id)}
            style={cssVars(FIFTHS[(FIFTHS.indexOf(selectedKey) + index) % 12])}
          >
            <Fretboard
              notes={ordered}
              low={shape.windowLow}
              high={shape.windowHigh}
              mini
              rootKey={selectedKey}
              labelMode="order"
            />
            <div className="drill-copy">
              <div className="drill-card-tags">
                <span>{drill.category}</span>
                <span>{drill.level}</span>
              </div>
              <strong>{drill.name}</strong>
              <p>{drill.reason}</p>
              <div>
                <span className="key-chip">Key {selectedKey}</span>
                <small>{drill.minutes} min</small>
                <small>{drill.bpm ? `${drill.bpm} bpm` : "untimed"}</small>
                <i>
                  {[1, 2, 3].map((n) => (
                    <b className={n <= drill.difficulty ? "on" : ""} key={n} />
                  ))}
                </i>
              </div>
            </div>
            <div className="drill-go">
              {accuracyByDrill.has(drill.id) ? (
                <Ring value={accuracyByDrill.get(drill.id) ?? 0} size={44} />
              ) : (
                <span className="drill-unstarted">Not yet practised</span>
              )}
              <span>Open →</span>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}
