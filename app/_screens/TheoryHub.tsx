"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, View } from "@/lib/fretlab/types";
import { CircleOfFifthsLesson } from "@/app/_sections/CircleOfFifthsLesson";
import { TheoryHubContent } from "@/app/_sections/TheoryHubContent";

export function TheoryHub({
  go,
  selectedKey,
  onSelectKey,
}: {
  go: (view: View) => void;
  selectedKey: KeyName;
  onSelectKey: (key: KeyName) => void;
}) {
  return (
    <div className="theory-stack">
      <CircleOfFifthsLesson selectedKey={selectedKey} onSelect={onSelectKey} />
      <TheoryHubContent go={go} selectedKey={selectedKey} />
    </div>
  );
}
