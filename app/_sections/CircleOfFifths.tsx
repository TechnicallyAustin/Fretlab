"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 */
import type { KeyName } from "@/lib/fretlab/types";
import { FIFTHS, majorScale } from "@/lib/fretlab/theory";
import { keyHue } from "@/lib/fretlab/palette";
import { polar, wedge } from "@/lib/fretlab/geometry";

export function CircleOfFifths({
  selectedKey,
  onSelect,
}: {
  selectedKey: KeyName;
  onSelect: (key: KeyName) => void;
}) {
  const selected = FIFTHS.indexOf(selectedKey);
  return (
    <div className="key-wheel">
      <svg
        viewBox="0 0 316 316"
        role="img"
        aria-label="Interactive circle of fifths"
      >
        {FIFTHS.map((key, index) => {
          const distance = (index - selected + 12) % 12;
          const near = distance === 0 || distance === 1 || distance === 11;
          const h = keyHue(key);
          return (
            <g
              key={key}
              role="button"
              tabIndex={0}
              aria-label={`Select ${key} major`}
              onClick={() => onSelect(key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(key);
              }}
            >
              <path
                d={wedge(
                  158,
                  158,
                  106,
                  150,
                  index * 30 - 14.4,
                  index * 30 + 14.4,
                )}
                fill={
                  distance === 0
                    ? `oklch(.62 .16 ${h})`
                    : near
                      ? `oklch(.885 .06 ${h})`
                      : `oklch(.955 .014 ${h})`
                }
              />
              <path
                d={wedge(
                  158,
                  158,
                  64,
                  102,
                  index * 30 - 14.4,
                  index * 30 + 14.4,
                )}
                fill={near ? `oklch(.935 .032 ${h})` : `oklch(.975 .008 ${h})`}
              />
            </g>
          );
        })}
        <circle
          cx="158"
          cy="158"
          r="58"
          fill="var(--key-fill-2)"
          stroke="var(--key-edge)"
        />
      </svg>
      {FIFTHS.map((key, index) => {
        const outer = polar(158, 158, 128, index * 30);
        const inner = polar(158, 158, 84, index * 30);
        return (
          <div key={key}>
            <button
              onClick={() => onSelect(key)}
              className={`wheel-label ${selectedKey === key ? "selected" : ""}`}
              style={{
                left: `${(outer[0] / 316) * 100}%`,
                top: `${(outer[1] / 316) * 100}%`,
              }}
            >
              {key}
            </button>
            <span
              className="minor-label"
              style={{
                left: `${(inner[0] / 316) * 100}%`,
                top: `${(inner[1] / 316) * 100}%`,
              }}
            >
              {majorScale(key)[5]}m
            </span>
          </div>
        );
      })}
      <div className="wheel-core">
        <strong>{selectedKey}</strong>
        <span>major</span>
      </div>
    </div>
  );
}
