"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
import type { View } from "@/lib/fretlab/types";
import type { ThemeMode } from "@/lib/fretlab/useStoredTheme";
import { CHORDS, SCALES, SONGS } from "@/lib/fretlab/library";
import { FIFTHS } from "@/lib/fretlab/theory";

export function BottomNav({ active, go, themeMode, onToggleTheme }: { active: View; go: (view: View) => void; themeMode: ThemeMode; onToggleTheme: () => void }) {
  const items: { label: string; view: View }[] = [
    { label: "Today", view: "today" },
    { label: "Practice", view: "drills" },
    { label: "Library", view: "library" },
    { label: "Progress", view: "progress" },
  ];
  return (
    <nav className="tab-bar" aria-label="Primary navigation">
      <div className="desktop-brand" aria-label="FretLab">
        <span>F</span>
        <div>
          <strong>FretLab</strong>
          <small>
            Practice one key.
            <br />
            Know the whole neck.
          </small>
        </div>
      </div>
      <div className="nav-items">
        {items.map((item, index) => (
          <button
            key={item.label}
            onClick={() => go(item.view)}
            className={item.view === active ? "active" : ""}
          >
            <i />
            {item.label}
            <small>0{index + 1}</small>
          </button>
        ))}
        <button className="nav-theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle colour theme">
          {themeMode === "dark" ? "Light" : "Dark"}
        </button>
      </div>
      <div className="desktop-library-nav">
        <span>Explore</span>
        <button onClick={() => go("keys")}>
          Key map <small>{FIFTHS.length}</small>
        </button>
        <button onClick={() => go("chords")}>
          Chords <small>{CHORDS.length}</small>
        </button>
        <button onClick={() => go("scales")}>
          Scales <small>{SCALES.length}</small>
        </button>
        <button onClick={() => go("songs")}>
          Songs <small>{SONGS.length}</small>
        </button>
      </div>
      <p className="desktop-nav-note">
        One connected practice system for the entire fretboard.
      </p>
    </nav>
  );
}
