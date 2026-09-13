"use client";

/**
 * App Template Contract v1 §7 — the error state, at the route level.
 *
 * There was no boundary anywhere, so a throw during render took the whole
 * screen. Both faults reported from the browser during the remediation did
 * exactly that: a hydration mismatch, and a `RangeError: Invalid time value`
 * raised six frames inside a date helper. Neither left the reader anything but
 * a blank page.
 *
 * §7: an error state names what failed and what to do next, and does not
 * apologise. The practice a person had just done is not lost — sessions are
 * recorded as they finish, not when a screen unmounts — and saying so is the
 * most useful sentence on the page.
 */
import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is what ties this to a server log; without it a bug report
    // says "it broke" and nothing else.
    console.error("FretLab route error", error.digest ?? "", error);
  }, [error]);

  return (
    <main className="route-error">
      <div>
        <p className="kicker">This screen stopped</p>
        <h1>Something here went wrong.</h1>
        <p>
          Your practice is safe — sessions are saved as each drill finishes, not
          when you leave a screen. Try this screen again, or go back to today.
        </p>
        {error.digest && (
          <p className="route-error-digest">
            Reference <code>{error.digest}</code>
          </p>
        )}
        <div className="route-error-actions">
          <button className="primary-action" onClick={reset}>
            Try again
          </button>
          {/* A hard load, not a client navigation. Soft-navigating out of a
              tree that just threw keeps the broken state around; this is the
              one place in the app where reloading is the point. */}
          <button
            className="secondary-action"
            onClick={() => window.location.assign("/")}
          >
            Back to today
          </button>
        </div>
      </div>
    </main>
  );
}
