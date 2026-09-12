"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 */
import type { KeyName } from "@/lib/fretlab/types";
import { keyPc } from "@/lib/fretlab/theory";

export function PianoMap({
  rootKey,
  intervals = [0, 2, 4, 5, 7, 9, 11],
}: {
  rootKey: KeyName;
  intervals?: number[];
}) {
  const root = keyPc(rootKey);
  const active = new Set(intervals.map((interval) => (root + interval) % 12));
  const whites = [
    { name: "C", pc: 0 },
    { name: "D", pc: 2 },
    { name: "E", pc: 4 },
    { name: "F", pc: 5 },
    { name: "G", pc: 7 },
    { name: "A", pc: 9 },
    { name: "B", pc: 11 },
  ];
  const blacks = [
    { name: "C#", pc: 1, left: 14.3 },
    { name: "D#", pc: 3, left: 28.6 },
    { name: "F#", pc: 6, left: 57.1 },
    { name: "G#", pc: 8, left: 71.4 },
    { name: "A#", pc: 10, left: 85.7 },
  ];
  return (
    <div className="piano-card">
      <div className="section-head">
        <h2>Same notes on a piano</h2>
        <span>One linear octave</span>
      </div>
      <div
        className="piano-map"
        aria-label={`${rootKey} notes on a piano keyboard`}
      >
        <div className="white-keys">
          {whites.map((key) => (
            <div
              className={`${active.has(key.pc) ? "active" : ""} ${key.pc === root ? "root" : ""}`}
              key={key.name}
            >
              <span>{key.name}</span>
            </div>
          ))}
        </div>
        {blacks.map((key) => (
          <div
            className={`black-key ${active.has(key.pc) ? "active" : ""} ${key.pc === root ? "root" : ""}`}
            style={{ left: `${key.left}%` }}
            key={key.name}
          >
            <span>{key.name}</span>
          </div>
        ))}
      </div>
      <p>
        A piano shows pitch once from left to right. Guitar repeats those same
        pitches across six offset strings, which creates multiple routes to the
        same note.
      </p>
    </div>
  );
}
