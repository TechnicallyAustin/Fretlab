"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 */
import type { View } from "@/lib/fretlab/types";
import { CHORDS, SCALES, SONGS } from "@/lib/fretlab/library";
import { FIFTHS } from "@/lib/fretlab/theory";
import { LibraryTile, SectionHeading } from "@/components/ui";

export function LibraryLaunchpad({ go }: { go: (view: View) => void }) {
  const cards: {
    view: View;
    label: string;
    copy: string;
    image: string;
    count: string;
  }[] = [
    {
      view: "keys",
      label: "Key map",
      copy: "See nearby keys, degrees, and harmonic movement.",
      image: "/guitar-neck.jpg",
      count: `${FIFTHS.length} keys`,
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
      copy: "Every scale in the library, mapped across the neck.",
      image: "/guitar-neck.jpg",
      count: `${SCALES.length} families`,
    },
    {
      view: "songs",
      label: "Songs",
      copy: "Put chords and rhythm into real music.",
      image: "/guitar-stage.jpg",
      count: `${SONGS.length} songs`,
    },
  ];
  return (
    <section className="fl-root library-launchpad">
      <SectionHeading
        title="Explore the full library"
        action={<span className="fl-eyebrow">Choose a way into the neck</span>}
      />
      <div className="fl-grid fl-grid--4">
        {cards.map((card) => (
          <LibraryTile
            key={card.label}
            count={card.count}
            title={card.label}
            description={card.copy}
            image={card.image}
            onOpen={() => go(card.view)}
          />
        ))}
      </div>
    </section>
  );
}
