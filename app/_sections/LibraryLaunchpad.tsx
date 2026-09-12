"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 */
import type { View } from "@/lib/fretlab/types";
import { CHORDS, SCALES } from "@/lib/fretlab/library";

export function LibraryLaunchpad({ go }: { go: (view: View) => void }) {
  const cards: {
    view: View;
    label: string;
    copy: string;
    image: string;
    count: string;
  }[] = [
    {
      view: "theory",
      label: "Theory courses",
      copy: "Intervals, harmony and rhythm you can see.",
      image: "/guitar-neck.jpg",
      count: "5 modules",
    },
    {
      view: "chords",
      label: "Chord library",
      copy: "Shapes, voicings and chord-tone maps.",
      image: "/guitar-strings.jpg",
      count: `${CHORDS.length} chords`,
    },
    {
      view: "scales",
      label: "Scale library",
      copy: "Eleven sounds mapped across the neck.",
      image: "/guitar-neck.jpg",
      count: `${SCALES.length} families`,
    },
    {
      view: "songs",
      label: "Songs",
      copy: "Put chords and rhythm into real music.",
      image: "/guitar-stage.jpg",
      count: "6 songs",
    },
  ];
  return (
    <section className="library-launchpad">
      <div className="section-head">
        <h2>Explore the full library</h2>
        <span>Choose a way into the neck</span>
      </div>
      <div>
        {cards.map((card) => (
          <button
            onClick={() => go(card.view)}
            key={card.label}
            style={{
              backgroundImage: `linear-gradient(110deg,rgba(35,36,47,.86),rgba(35,36,47,.2)),url(${card.image})`,
            }}
          >
            <span>{card.count}</span>
            <strong>{card.label}</strong>
            <small>{card.copy}</small>
            <b>Open →</b>
          </button>
        ))}
      </div>
    </section>
  );
}
