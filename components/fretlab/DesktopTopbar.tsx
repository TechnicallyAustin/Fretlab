"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */

import type { KeyName, View } from "@/lib/fretlab/types";

export function DesktopTopbar({
  view,
  selectedKey,
  go,
  openKeyPicker,
}: {
  view: View;
  selectedKey: KeyName;
  go: (view: View) => void;
  openKeyPicker: () => void;
}) {
  const labels: Record<View, string> = {
    today: "Today",
    signin: "Your account",
    drills: "Drill library",
    train: "Training modules",
    keys: "Key explorer",
    library: "Library",
    theory: "Theory courses",
    chords: "Chord library",
    "chord-detail": "Chord study",
    scales: "Scale library",
    "scale-library-detail": "Scale study",
    songs: "Song library",
    "song-detail": "Song practice",
    progress: "Your progress",
    tuner: "Tuner",
    routines: "Routines",
    runner: "Session runner",
    summary: "Session summary",
    grouped: "Grouped drills",
    "drill-detail": "Drill detail",
    "key-detail": "Key detail",
    "scale-detail": "Scale position",
    "routine-detail": "Routine detail",
    guided: "Guided routine",
  };
  return (
    <header className="desktop-topbar">
      <div>
        <span>Workspace</span>
        <strong>{labels[view]}</strong>
      </div>
      {/* The global key already has an interactive chip in the actions group.
          Stating it twice in one bar is noise, not reinforcement. */}
      <div className="desktop-topbar-center">
        <i />
        <span>{labels[view]}</span>
      </div>
      <div className="desktop-topbar-actions">
        <button className="global-key-button" onClick={openKeyPicker}>
          <span className="topbar-key">{selectedKey}</span>
          <span>
            <small>Global key</small>
            <strong>{selectedKey} major · Circle of fifths</strong>
          </span>
          <b>⌄</b>
        </button>
        <button className="topbar-primary" onClick={() => go("train")}>
          Quick train <span>→</span>
        </button>
      </div>
    </header>
  );
}
