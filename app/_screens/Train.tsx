"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
import type { KeyName, Tuning } from "@/lib/fretlab/types";
import {
  DROP_D_TUNING,
  FIFTHS,
  intervalShape,
  openPc,
  spellPitchClass,
  STANDARD_TUNING,
} from "@/lib/fretlab/theory";
import { Fretboard } from "@/components/fretlab/Fretboard";
import { StatusBar } from "@/components/fretlab/StatusBar";
import { trainableById, trainables } from "@/lib/fretlab/library";
import { playTones } from "@/lib/fretlab/audio";
import { useElapsed } from "@/lib/fretlab/useElapsed";
import { useMemo, useState } from "react";
import { api, ApiClientError } from "@/lib/api/client";

export function Train({
  selectedKey,
  setSelectedKey,
  tuning = STANDARD_TUNING,
  leftHanded = false,
  setTuning,
  setLeftHanded,
}: {
  selectedKey: KeyName;
  setSelectedKey: (key: KeyName) => void;
  tuning?: Tuning;
  leftHanded?: boolean;
  setTuning?: (tuning: Tuning) => void;
  setLeftHanded?: (leftHanded: boolean) => void;
}) {
  // Every drill is scorable now, not only the four training modules. The
  // scoring was never specific to them: it needs target notes and a sentence
  // saying what to find, and every drill has both.
  const items = useMemo(() => trainables(), []);
  const [moduleId, setModuleId] = useState<string>("locator");
  const trainingModule = trainableById(moduleId) ?? items[0];
  const moduleIndex = items.findIndex((item) => item.id === trainingModule.id);
  const notes = useMemo(
    () =>
      intervalShape(
        selectedKey,
        [...trainingModule.intervals],
        trainingModule.low,
        trainingModule.high,
        tuning,
      ).filter(
        (note) =>
          !trainingModule.strings || trainingModule.strings.includes(note.s),
      ),
    [selectedKey, trainingModule, tuning],
  );
  const signature = notes.map((note) => `${note.s}:${note.f}`).join(",");
  // Nothing is found until the player finds it. This used to open with every
  // target but one already marked, so the drill was a single tap and the
  // accuracy it recorded was near-perfect before anyone had played a note.
  const [found, setFound] = useState<Set<string>>(() => new Set());
  const [misses, setMisses] = useState(0);
  // Targets hit before any wrong guess. Tapping a dot you were shown is not
  // recall, so first-attempt correctness is the only figure worth keeping.
  const [clean, setClean] = useState(0);
  const [renderedFor, setRenderedFor] = useState(signature);
  // Changing key or module starts the drill over. Adjusting during render
  // avoids the extra committed frame an effect would cause.
  if (renderedFor !== signature) {
    setRenderedFor(signature);
    setFound(new Set());
    setMisses(0);
    setClean(0);
  }
  const [missedSince, setMissedSince] = useState(false);
  const hit = (s: number, f: number) => {
    const id = `${s}:${f}`;
    if (found.has(id)) return;
    if (notes.some((note) => note.s === s && note.f === f)) {
      setFound((current) => new Set(current).add(id));
      if (!missedSince) setClean((n) => n + 1);
      setMissedSince(false);
    } else {
      setMisses((n) => n + 1);
      setMissedSince(true);
    }
  };
  const accuracy = found.size ? Math.round((clean / found.size) * 100) : 0;

  const [recordError, setRecordError] = useState<string | null>(null);

  /**
   * §1 Resource: a completed module is a practice session.
   *
   * Only the figures this screen actually measures are sent: hits, misses and
   * elapsed time. Nothing is invented to fill a column.
   */
  // A real clock, so the figure on screen is the one that gets recorded.
  const {
    seconds: elapsedSeconds,
    label: elapsedLabel,
    startedAt,
  } = useElapsed(signature);

  const record = async (complete: boolean) => {
    if (!complete) return;
    try {
      await api.createPracticeSession({
        title: trainingModule.name,
        drill_id: trainingModule.id,
        music_key: selectedKey,
        accuracy,
        reps: found.size + misses,
        duration_seconds: startedAt.current
          ? Math.max(1, elapsedSeconds)
          : undefined,
        tags: [selectedKey, "training"],
      });
      setRecordError(null);
    } catch (error) {
      // A signed-out visitor can still practise; only the saving fails, and
      // saying so is better than a silent no-op.
      if (error instanceof ApiClientError && error.code === "unauthenticated") {
        setRecordError("Sign in to save this session to your history.");
        return;
      }
      setRecordError(
        error instanceof ApiClientError
          ? error.message
          : "That session was not saved. Your practice still counted.",
      );
    }
  };

  const next = () => {
    void record(found.size === notes.length);
    // Round the whole library and the key advances, so the same drill comes
    // back in a key you have not done it in — which is the distinction the
    // review scheduler also makes.
    if (moduleIndex === items.length - 1)
      setSelectedKey(FIFTHS[(FIFTHS.indexOf(selectedKey) + 1) % FIFTHS.length]);
    setModuleId(items[(moduleIndex + 1) % items.length].id);
    setMisses(0);
  };

  return (
    <div className="screen-content train-screen">
      <StatusBar end="Training modules" />
      <section className="train-module-picker">
        <div className="section-head">
          {/* "Your module path" described four items in a fixed order. It is
              the whole drill library now, so it is a list to choose from
              rather than a path to walk. */}
          <h2>What to practise</h2>
          <span>
            {moduleIndex + 1} of {items.length}
          </span>
        </div>
        <div className="train-module-list">
          {items.map((item) => (
            <button
              className={item.id === moduleId ? "active" : ""}
              onClick={() => setModuleId(item.id)}
              key={item.id}
            >
              <strong>{item.name}</strong>
              <small>
                {item.level} · {item.minutes} min
              </small>
              <i>
                {/* Only the drill in hand shows progress. The bar used to fill
                    for every item before this one in the list, which read as
                    "completed" for drills nobody had opened. */}
                <b
                  style={{
                    width: `${item.id === moduleId ? Math.round((found.size / Math.max(1, notes.length)) * 100) : 0}%`,
                  }}
                />
              </i>
            </button>
          ))}
        </div>
      </section>
      <section className="guitar-setup" aria-label="Guitar setup">
        <div className="section-head">
          <h2>Guitar setup</h2>
          <span>
            {tuning.name} · {leftHanded ? "Left-handed" : "Right-handed"}
          </span>
        </div>
        <div className="setup-controls">
          <div>
            <span>Tuning</span>
            <button
              className={tuning.id === STANDARD_TUNING.id ? "active" : ""}
              onClick={() => setTuning?.(STANDARD_TUNING)}
            >
              Standard
            </button>
            <button
              className={tuning.id === DROP_D_TUNING.id ? "active" : ""}
              onClick={() => setTuning?.(DROP_D_TUNING)}
            >
              Drop D
            </button>
          </div>
          <div>
            <span>Handedness</span>
            <button
              className={!leftHanded ? "active" : ""}
              onClick={() => setLeftHanded?.(false)}
            >
              Right-handed
            </button>
            <button
              className={leftHanded ? "active" : ""}
              onClick={() => setLeftHanded?.(true)}
            >
              Left-handed
            </button>
          </div>
        </div>
      </section>
      <div className="train-hero">
        <p className="kicker">{trainingModule.name}</p>
        <strong>{selectedKey}</strong>
        <span>{trainingModule.instruction}</span>
        <div>
          <span>{trainingModule.target}</span>
          <button
            onClick={() =>
              playTones(selectedKey, [...trainingModule.intervals], true)
            }
          >
            ▶ Hear target
          </button>
        </div>
      </div>
      <div className="train-board">
        <div className="section-head">
          <h2>Find {trainingModule.target}</h2>
          <span>
            {notes.length - found.size} left · the board does not show you where
          </span>
        </div>
        <Fretboard
          notes={notes}
          low={1}
          high={7}
          interactive
          hideTargets
          found={found}
          onCell={hit}
          rootKey={selectedKey}
          tuning={tuning}
          leftHanded={leftHanded}
        />
      </div>
      <div className="stat-grid">
        <article>
          <strong>
            {found.size}/{notes.length}
          </strong>
          <span>found</span>
        </article>
        <article>
          <strong>{elapsedLabel}</strong>
          <span>elapsed</span>
        </article>
        <article>
          <strong>{accuracy || 0}%</strong>
          <span>accuracy</span>
        </article>
      </div>
      <button
        className={
          found.size === notes.length ? "primary-action" : "secondary-action"
        }
        onClick={next}
      >
        {found.size === notes.length
          ? "Complete module"
          : "Move to next module"}{" "}
        <span>→</span>
      </button>
      {recordError && (
        <p className="record-notice" role="status">
          {recordError}
        </p>
      )}
      <aside className="desktop-train-guide">
        <div>
          <p className="kicker">Live target map</p>
          <strong>{notes.length - found.size}</strong>
          <span>locations remain</span>
        </div>
        <div className="target-lanes">
          {[6, 5, 4, 3, 2, 1].map((string) => {
            const total = notes.filter((note) => note.s === string).length;
            const complete = notes.filter(
              (note) => note.s === string && found.has(`${note.s}:${note.f}`),
            ).length;
            return (
              <div key={string}>
                <span>
                  {spellPitchClass(openPc(tuning, string), selectedKey)}
                </span>
                <i>
                  <b
                    style={{
                      width: `${total ? (complete / total) * 100 : 100}%`,
                    }}
                  />
                </i>
                <small>
                  {complete}/{total}
                </small>
              </div>
            );
          })}
        </div>
        <p>
          Work string by string. Say each pitch or degree before you tap it,
          then repeat without fret numbers.
        </p>
      </aside>
    </div>
  );
}
