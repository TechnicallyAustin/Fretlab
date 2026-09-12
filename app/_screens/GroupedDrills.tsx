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
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { cssVars } from "@/lib/fretlab/palette";
import { lastAccuracyByDrill } from "@/lib/api/progress";
import { usePracticeSessions } from "@/lib/api/hooks";
import { useState } from "react";
import { drillShape } from "@/lib/fretlab/fingering";
import { useGuitarSetup } from "@/lib/fretlab/GuitarSetup";

export function GroupedDrills({
  go,
  selectedKey,
  onOpen,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
  onOpen: (id: string) => void;
}) {
  const { tuning } = useGuitarSetup();
  const history = usePracticeSessions({ limit: 100 });
  const accuracyByDrill = lastAccuracyByDrill(history.data ?? []);
  const [tab, setTab] = useState("Skill paths");
  const categories = [
    "Neck knowledge",
    "Scale fluency",
    "Chord tones",
    "Harmony",
  ];
  return (
    <div className="screen-content">
      <AppHeader
        title={`${selectedKey} learning paths`}
        meta={`${DRILLS.length} drills`}
        onBack={() => go("drills")}
      />
      <SegmentTabs
        labels={["Skill paths", "Beginner", "Intermediate", "Advanced"]}
        active={tab}
        onChange={setTab}
      />
      <div className="group-list">
        {categories.map((category, index) => {
          const items = DRILLS.filter(
            (drill) =>
              drill.category === category &&
              (tab === "Skill paths" || drill.level === tab),
          ).slice(0, 4);
          return items.length ? (
            <section
              key={category}
              style={cssVars(
                FIFTHS[(FIFTHS.indexOf(selectedKey) + index * 2) % 12],
              )}
            >
              <div className="group-title">
                <h2>
                  <i />
                  {category}
                </h2>
                <span>{items.length} step path</span>
              </div>
              {items.map((drill) => {
                const shape = drillShape(drill, selectedKey, false, tuning);
                return (
                <button key={drill.id} onClick={() => onOpen(drill.id)}>
                  <Fretboard
                    notes={shape.notes}
                    low={shape.windowLow}
                    high={shape.windowHigh}
                    mini
                    rootKey={selectedKey}
                  />
                  <div>
                    <strong>{drill.name}</strong>
                    <i>
                      <b style={{ width: `${accuracyByDrill.get(drill.id) ?? 0}%` }} />
                    </i>
                  </div>
                  <small>{drill.minutes} min</small>
                </button>
                );
              })}
            </section>
          ) : null;
        })}
      </div>
    </div>
  );
}
