"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * The mobile-first landing page for the app's browseable music library.
 */
import type { View } from "@/lib/fretlab/types";
import { LibraryLaunchpad } from "@/app/_sections/LibraryLaunchpad";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { PageTitle, TheoryCallout } from "@/components/ui";

export function Library({ go }: { go: (view: View) => void }) {
  return (
    <div className="fl-root screen-content library-home-screen">
      <StatusBar end="Library" />
      <header className="library-home-header">
        <p className="fl-eyebrow">Browse by musical job</p>
        <PageTitle title="Library" />
        <p>Choose a map, shape, sound, or song to study next.</p>
      </header>
      <LibraryLaunchpad go={go} />
      <TheoryCallout
        title="Start with Theory"
        body="Learn intervals, degrees, harmony, and rhythm from the beginning."
        actionLabel="Open Theory"
        onOpen={() => go("theory")}
      />
    </div>
  );
}
