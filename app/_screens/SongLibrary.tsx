"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { SONGS } from "@/lib/fretlab/library";
import { Hero, HeroSearch, SegmentedControl, SongCard, levelOf } from "@/components/ui";
import { keyHue } from "@/lib/fretlab/palette";
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
    /* fl-root scopes the design kit's type and colour to the screens that have
       been converted, so the rest of the app keeps its own look until it is
       converted too. */
    <div className="fl-root screen-content library-screen song-library-screen">
      <AppHeader
        title="Songs"
        meta={`${visible.length} arrangements`}
        onBack={() => go("library")}
      />
      <Hero
        eyebrow="Play music sooner"
        title="Turn the shapes you know into complete songs."
        sub="Each arrangement connects chord changes, rhythm, tempo and the key map."
        aside={<HeroSearch value={query} onChange={setQuery} />}
      />
      <SegmentedControl
        label="Difficulty"
        options={["All", "Beginner", "Intermediate"]}
        value={level}
        onChange={setLevel}
      />
      <div className="fl-grid fl-grid--3">
        {visible.map((song) => (
          <SongCard
            key={song.id}
            title={song.title}
            artist={song.artist}
            songKey={song.key}
            level={levelOf(song.level)}
            bpm={song.tempo}
            chords={song.progression}
            image={song.image}
            hue={keyHue(song.key)}
            onOpen={() => onOpen(song.id)}
          />
        ))}
      </div>
    </div>
  );
}
