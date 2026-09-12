"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { SONGS } from "@/lib/fretlab/library";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { cssVars } from "@/lib/fretlab/palette";
import { useState } from "react";

export function SongLibrary({
  go,
  onOpen,
}: {
  go: (view: View) => void;
  onOpen: (id: string) => void;
}) {
  const [level, setLevel] = useState("All");
  const [query, setQuery] = useState("");
  const visible = SONGS.filter(
    (song) =>
      (level === "All" || song.level === level) &&
      `${song.title} ${song.artist}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="screen-content library-screen song-library-screen">
      <AppHeader
        title="Songs"
        meta={`${visible.length} arrangements`}
        onBack={() => go("library")}
      />
      <section className="songs-hero">
        <div>
          <p className="kicker">Play music sooner</p>
          <h2>Turn the shapes you know into complete songs.</h2>
          <p>
            Each arrangement connects chord changes, rhythm, tempo and the key
            map.
          </p>
        </div>
        <div className="song-search">
          <label htmlFor="song-search">Find a song</label>
          <input
            id="song-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title or artist…"
          />
        </div>
      </section>
      <SegmentTabs
        labels={["All", "Beginner", "Intermediate"]}
        active={level}
        onChange={setLevel}
      />
      <div className="song-library-grid">
        {visible.map((song) => (
          <button
            className="song-card"
            onClick={() => onOpen(song.id)}
            key={song.id}
            style={{
              ...cssVars(song.key),
              backgroundImage: `linear-gradient(180deg,rgba(25,25,30,.04),rgba(25,25,30,.88)),url(${song.image})`,
            }}
          >
            <span className="key-chip">Key {song.key}</span>
            <div>
              <small>
                {song.level} · {song.tempo} bpm
              </small>
              <strong>{song.title}</strong>
              <p>{song.artist}</p>
              <footer>
                {song.progression.map((chord) => (
                  <span key={chord}>{chord}</span>
                ))}
              </footer>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
