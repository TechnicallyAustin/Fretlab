"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
import { CHORDS } from "@/lib/fretlab/library";
import { chordIntervals } from "@/lib/fretlab/theory";
import { playTones } from "@/lib/fretlab/audio";

export function ChordPlayingLesson({ chord }: { chord: (typeof CHORDS)[number] }) {
  return <section className="chord-playing-lesson"><header><p className="kicker">How to play it cleanly</p><h2>Build the shape before you add speed.</h2><p>Chord diagrams show a hand position, but good playing comes from checking each string and keeping the pulse steady.</p></header><ol><li><strong>Place the root first.</strong><span>Find the square root note and use it as your hand-position anchor.</span></li><li><strong>Set the remaining fingers.</strong><span>Curve each finger so nearby strings stay open and nothing is muted by accident.</span></li><li><strong>Sound one string at a time.</strong><span>Pick from the lowest shown string to the highest, then fix any buzz before strumming.</span></li><li><strong>Strum, release, repeat.</strong><span>Play four slow quarter notes, relax between changes, and only raise the tempo when every note rings.</span></li></ol><button className="primary-action" type="button" onClick={() => playTones(chord.root, chordIntervals(chord), true)}>Hear the chord tones in order <span>→</span></button></section>;
}
