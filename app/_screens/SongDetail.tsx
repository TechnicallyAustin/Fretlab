"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { CHORDS, SONGS } from "@/lib/fretlab/library";
import { SegmentTabs } from "@/components/fretlab/SegmentTabs";
import { cssVars } from "@/lib/fretlab/palette";
import { useState } from "react";

export function SongDetail({
  go,
  songId,
  onChord,
}: {
  go: (view: View) => void;
  songId: string;
  onChord: (id: string) => void;
}) {
  const song = SONGS.find((item) => item.id === songId) ?? SONGS[0];
  const [section, setSection] = useState("Verse");
  const [playing, setPlaying] = useState(false);
  const openChord = (symbol: string) => {
    const chord = CHORDS.find((item) => item.symbol === symbol);
    if (chord) onChord(chord.id);
  };
  return (
    <div
      className="screen-content detail-screen song-detail-screen"
      style={cssVars(song.key)}
    >
      <AppHeader
        title={song.title}
        meta={song.artist}
        onBack={() => go("songs")}
      />
      <section
        className="song-detail-hero"
        style={{
          backgroundImage: `linear-gradient(90deg,rgba(20,21,28,.94),rgba(20,21,28,.28)),url(${song.image})`,
        }}
      >
        <div>
          <span>{song.level} arrangement</span>
          <h2>{song.title}</h2>
          <p>{song.artist}</p>
          <div>
            <b>{song.tempo} bpm</b>
            <b>Key {song.key}</b>
            <b>{song.capo}</b>
          </div>
        </div>
        <button onClick={() => setPlaying(!playing)}>
          {playing ? "Pause count-in" : "Start count-in"}
          <span>{playing ? "Ⅱ" : "▶"}</span>
        </button>
      </section>
      <div className="song-workspace">
        <section>
          <SegmentTabs
            labels={["Verse", "Chorus", "Bridge"]}
            active={section}
            onChange={setSection}
          />
          <div className="song-timeline">
            {song.progression.concat(song.progression).map((chord, index) => (
              <button onClick={() => openChord(chord)} key={`${chord}${index}`}>
                <span>{index + 1}</span>
                <strong>{chord}</strong>
                <small>{index % 2 ? "2 beats" : "4 beats"}</small>
              </button>
            ))}
          </div>
          <p className="song-instruction">
            {section === "Verse"
              ? `Keep the ${song.focus.toLowerCase()} steady and let every chord land on beat one.`
              : section === "Chorus"
                ? "Open the strum slightly and let the top strings carry the lift."
                : "Reduce the pattern to down-strokes, then rebuild the groove."}
          </p>
        </section>
        <aside>
          <div className="section-head">
            <h2>Chord set</h2>
            <span>Click to study</span>
          </div>
          {song.progression.map((symbol) => {
            const chord = CHORDS.find((item) => item.symbol === symbol);
            return (
              <button onClick={() => chord && onChord(chord.id)} key={symbol}>
                <span className="relation-key">{symbol}</span>
                <span>
                  <strong>{chord?.name ?? symbol}</strong>
                  <small>{chord?.notes ?? "Song chord"}</small>
                </span>
                <b>→</b>
              </button>
            );
          })}
          <div className="song-practice-goal">
            <span>Practice goal</span>
            <strong>3 clean loops</strong>
            <i>
              <b style={{ width: "34%" }} />
            </i>
          </div>
        </aside>
      </div>
    </div>
  );
}
