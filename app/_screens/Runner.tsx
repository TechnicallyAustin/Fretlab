"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { MetronomeBar } from "@/components/fretlab/MetronomeBar";
import { scaleShape } from "@/lib/fretlab/theory";
import { useElapsed } from "@/lib/fretlab/useElapsed";
import { useMetronome } from "@/lib/fretlab/useMetronome";

export function Runner({
  go,
  sessionKey,
}: {
  go: (view: View) => void;
  sessionKey: KeyName;
}) {
  const { label: elapsedLabel } = useElapsed(sessionKey);
  // A bar of count-in, because the drill starts on beat one and you cannot
  // start on a beat you have not heard yet.
  const metronome = useMetronome({ bpm: 84, meter: 4, countInBars: 1 });
  const notes = scaleShape(sessionKey, 1, 5);
  return (
    <div className="screen-content flow-screen">
      <StatusBar end="Practice run" />
      <div className="runner-hero">
        <p className="kicker">Key of {sessionKey}</p>
        <h1>Position one, up and back</h1>
        <p>
          One note per click. Let the top note turn you around without becoming
          a pause.
        </p>
      </div>
      <Fretboard
        notes={notes}
        low={1}
        high={5}
        labelMode="degree"
        rootKey={sessionKey}
      />
      <div className="elapsed">
        <strong>{elapsedLabel}</strong>
        <span>elapsed</span>
      </div>
      <MetronomeBar metronome={metronome} />
      <button className="finish-link" onClick={() => go("summary")}>
        Finish session
      </button>
    </div>
  );
}
