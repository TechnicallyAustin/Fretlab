"use client";

/**
 * App Template Contract v1 §5 — L2 section.
 * Composes L3 elements. Receives data through props and owns only local
 * interaction state. Never fetches. Never reads the router.
 */
import type { KeyName } from "@/lib/fretlab/types";
import { CircleOfFifths } from "@/app/_sections/CircleOfFifths";
import { PC_KEY, keyPc, majorScale } from "@/lib/fretlab/theory";
import { cssVars, palette } from "@/lib/fretlab/palette";

export function KeySelectorModal({
  selectedKey,
  onSelect,
  onClose,
}: {
  selectedKey: KeyName;
  onSelect: (key: KeyName) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="key-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="key-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="key-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="kicker">Global key context</p>
            <h2 id="key-modal-title">Choose one key for the whole workspace</h2>
            <p>
              Drills, theory, scales, chords and routines will immediately
              transpose together.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close key selector">
            ×
          </button>
        </header>
        <div className="key-modal-layout">
          <CircleOfFifths
            selectedKey={selectedKey}
            onSelect={(key) => {
              onSelect(key);
              onClose();
            }}
          />
          <div className="key-modal-summary" style={cssVars(selectedKey)}>
            <span>Active everywhere</span>
            <strong>{selectedKey} major</strong>
            <p>{majorScale(selectedKey).join(" · ")}</p>
            <div>
              {majorScale(selectedKey).map((note, index) => (
                <i
                  key={note}
                  style={{
                    background: palette(
                      PC_KEY[
                        (keyPc(selectedKey) + [0, 2, 4, 5, 7, 9, 11][index]) %
                          12
                      ],
                    ).bright,
                  }}
                  title={note}
                />
              ))}
            </div>
            <small>
              Changing the key preserves the lesson and moves every pitch
              relationship.
            </small>
          </div>
        </div>
      </section>
    </div>
  );
}
