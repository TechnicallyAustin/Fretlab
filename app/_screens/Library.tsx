"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * The mobile-first landing page for the app's browseable music library.
 */
import type { View } from "@/lib/fretlab/types";
import { LibraryLaunchpad } from "@/app/_sections/LibraryLaunchpad";
import { StatusBar } from "@/components/fretlab/StatusBar";

export function Library({ go }: { go: (view: View) => void }) {
  return (
    <div className="screen-content library-home-screen">
      <StatusBar end="Library" />
      <header className="library-home-header">
        <p className="kicker">Browse by musical job</p>
        <h1>Library</h1>
        <p>Choose a map, shape, sound, or song to study next.</p>
      </header>
      <LibraryLaunchpad go={go} />
      <section className="library-theory-link">
        <div>
          <p className="kicker">Need the why?</p>
          <h2>Start with Theory</h2>
          <p>Learn intervals, degrees, harmony, and rhythm from the beginning.</p>
        </div>
        <button type="button" onClick={() => go("theory")}>Open Theory <span>→</span></button>
      </section>
    </div>
  );
}
