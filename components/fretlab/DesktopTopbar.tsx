"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */

import type { KeyName, View } from "@/lib/fretlab/types";
import { primaryViewFor } from "@/lib/fretlab/routes";

export function DesktopTopbar({
  view,
  selectedKey,
  go,
  openKeyPicker,
  themeMode,
  onToggleTheme,
  standMode,
  onToggleStand,
}: {
  view: View;
  selectedKey: KeyName;
  go: (view: View) => void;
  openKeyPicker: () => void;
  themeMode: "light" | "dark" | "system";
  onToggleTheme: () => void;
  standMode: boolean;
  onToggleStand: () => void;
}) {
  const labels: Record<View, string> = {
    today: "Today",
    signin: "Your account",
    onboarding: "Getting started",
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
    ear: "Ear training",
    routines: "Routines",
    runner: "Session runner",
    summary: "Session summary",
    grouped: "Grouped drills",
    "drill-detail": "Drill detail",
    "key-detail": "Key detail",
    "routine-detail": "Routine detail",
  };
  const section: Partial<Record<View, string>> = {
    today: "Home",
    train: "Practice",
    drills: "Practice",
    library: "Explore",
    theory: "Learn",
  };
  return (
    <header className="desktop-topbar">
      <div>
        <span>FretLab</span>
        <strong>{section[primaryViewFor(view)] ?? "Practice"}</strong>
      </div>
      {/* The global key already has an interactive chip in the actions group.
          Stating it twice in one bar is noise, not reinforcement. */}
      <div className="desktop-topbar-center">
        <i />
        <span>{labels[view]}</span>
      </div>
      <div className="desktop-topbar-actions">
        <button
          className={`topbar-icon-button${themeMode === "dark" ? " active" : ""}`}
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle colour theme"
          title={themeMode === "dark" ? "Use light theme" : "Use dark theme"}
        >
          <span aria-hidden="true">◐</span>
        </button>
        <button
          className={`topbar-icon-button${standMode ? " active" : ""}`}
          type="button"
          onClick={onToggleStand}
          aria-pressed={standMode}
          aria-label="Toggle stand mode"
          title="Toggle stand mode"
        >
          <span aria-hidden="true">↕</span>
        </button>
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
