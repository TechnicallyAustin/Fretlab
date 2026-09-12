"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 * Owns its data and page-level layout, and composes L2 sections. FretLab
 * renders these from the shell in app/page.tsx; see the README on routing.
 */
/**
 * The tuner.
 *
 * Table stakes for a guitar app and the reason people open one on a weekday,
 * and FretLab had no microphone input at all.
 *
 * §7's four states do most of the work here, because most of what a tuner
 * does is not tuning: it is waiting for permission, being refused it, finding
 * no microphone, or hearing nothing. Each of those is a state with its own way
 * out rather than an error, and none of them apologises.
 */
import type { View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { StateNotice } from "@/components/fretlab/StateNotice";
import { IN_TUNE_CENTS } from "@/lib/fretlab/pitch";
import { useTuner } from "@/lib/fretlab/useTuner";

/** Cents beyond which the needle pins rather than running off the dial. */
const RANGE = 50;

export function Tuner({ go }: { go: (view: View) => void }) {
  const tuner = useTuner();
  const { reading, state, tuning } = tuner;

  // −50..50 cents mapped across the dial, clamped so a wildly slack string
  // pins at the end instead of drawing outside the meter.
  const offset = reading
    ? Math.max(-RANGE, Math.min(RANGE, reading.cents))
    : 0;

  return (
    <div className="screen-content tuner-screen">
      <AppHeader title="Tuner" meta="Standard tuning" onBack={() => go("today")} />

      {state === "idle" && (
        <StateNotice
          tone="empty"
          title="Tune up"
          detail="FretLab listens through your microphone. Nothing is recorded or sent anywhere — the sound is measured on this device and discarded."
          actionLabel="Turn on the microphone"
          onAction={tuner.start}
        />
      )}

      {state === "requesting" && (
        <StateNotice
          tone="loading"
          title="Waiting for microphone access"
          detail="Your browser is asking whether to allow it."
        />
      )}

      {state === "denied" && (
        <StateNotice
          tone="empty"
          title="Microphone access is off"
          detail="The browser is blocking it for this site. Allow the microphone in the address-bar permissions, then try again."
          actionLabel="Try again"
          onAction={tuner.start}
        />
      )}

      {state === "unavailable" && (
        <StateNotice
          tone="empty"
          title="No microphone found"
          detail="Nothing is available to listen with, or another app is using it. You can still tune to the reference pitches below."
          actionLabel="Try again"
          onAction={tuner.start}
        />
      )}

      {state === "unsupported" && (
        <StateNotice
          tone="empty"
          title="This browser cannot listen"
          detail="Microphone input needs a secure connection and a current browser. The reference pitches below work anywhere."
        />
      )}

      {state === "listening" && (
        <section className="tuner-dial" aria-live="polite">
          {reading ? (
            <>
              <p className="kicker">
                Nearest string · {reading.target.string} ({reading.target.name}
                {reading.target.octave})
              </p>
              <strong className={reading.inTune ? "in-tune" : ""}>
                {reading.note.name}
                <small>{reading.note.octave}</small>
              </strong>
              <p className="tuner-cents">
                {reading.inTune
                  ? "In tune"
                  : `${Math.abs(Math.round(reading.cents))} cents ${
                      reading.cents < 0 ? "flat — tighten" : "sharp — loosen"
                    }`}
              </p>
              <div className="tuner-meter">
                <i className="tuner-centre" />
                <i
                  className={`tuner-needle ${reading.inTune ? "in-tune" : ""}`}
                  style={{ left: `${50 + (offset / RANGE) * 50}%` }}
                />
              </div>
              <p className="tuner-hz">{reading.frequency.toFixed(1)} Hz</p>
            </>
          ) : (
            <>
              <p className="kicker">Listening</p>
              <strong className="tuner-waiting">—</strong>
              <p className="tuner-cents">Play one string and let it ring.</p>
            </>
          )}
          <button className="finish-link" onClick={tuner.stop}>
            Turn the microphone off
          </button>
        </section>
      )}

      {/* Always present: it is the reference a tuner is measured against, and
          it is the whole feature when there is no microphone to be had. */}
      <section className="section">
        <div className="section-head">
          <h2>Standard tuning</h2>
          <span>low to high</span>
        </div>
        <ol className="tuner-strings">
          {tuning.map((string) => (
            <li
              className={
                reading && reading.target.string === string.string ? "current" : ""
              }
              key={string.string}
            >
              <span>{string.string}</span>
              <strong>
                {string.name}
                <small>{string.octave}</small>
              </strong>
              <em>{string.frequency.toFixed(2)} Hz</em>
            </li>
          ))}
        </ol>
        <p className="tuner-note">
          Within {IN_TUNE_CENTS} cents counts as in tune, which is about as
          close as an ear hears.
        </p>
      </section>
    </div>
  );
}
