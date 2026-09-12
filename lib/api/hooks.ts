"use client";

/**
 * Data hooks for L1 screens.
 *
 * §1: "Every screen handles four states: loading, empty, error, ready."
 * `AsyncState` makes that shape explicit so a screen cannot forget one.
 */
import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError, type PracticeSessionWire, type UserWire } from "./client";

export type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "error"; data: null; error: ApiClientError }
  | { status: "ready"; data: T; error: null };

const LOADING = { status: "loading", data: null, error: null } as const;

function toClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  return new ApiClientError("internal_error", "Something failed on our side. Try again in a moment.", 0);
}

/**
 * The signed-in user, or null when signed out.
 *
 * A 401 is not an error state here: being signed out is a normal, ready
 * outcome that screens render an invitation for.
 */
export function useSession(): AsyncState<UserWire | null> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<UserWire | null>>(LOADING);
  const [nonce, setNonce] = useState(0);

  // Reset to loading during render rather than from the effect, which would
  // commit an extra frame showing the previous result.
  const [renderedFor, setRenderedFor] = useState(nonce);
  if (renderedFor !== nonce) {
    setRenderedFor(nonce);
    setState(LOADING);
  }

  useEffect(() => {
    const controller = new AbortController();

    api
      .session(controller.signal)
      .then((result) => setState({ status: "ready", data: result.user, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        const clientError = toClientError(error);
        if (clientError.code === "unauthenticated") {
          setState({ status: "ready", data: null, error: null });
          return;
        }
        setState({ status: "error", data: null, error: clientError });
      });

    return () => controller.abort();
  }, [nonce]);

  return { ...state, reload: useCallback(() => setNonce((value) => value + 1), []) };
}

export type PracticeSessionQuery = {
  limit?: number;
  drillId?: string;
  musicKey?: string;
  /** Skip the request entirely, e.g. while the session is still resolving. */
  enabled?: boolean;
  /**
   * Follow the pages until the whole history is in hand.
   *
   * `Progress` draws a 26-week consistency graph and counts a streak, and it
   * did both from a single `limit: 100` request. The server caps a page at
   * 100, so an active player's oldest squares silently went blank and their
   * streak was computed from a truncated history. A figure that quietly
   * degrades the more you practise is worse than no figure.
   */
  all?: boolean;
};

/** The server's own cap, so a full fetch asks for whole pages. */
const PAGE = 100;

/**
 * Stop rather than page forever if the server keeps claiming more. 20 pages is
 * 2,000 sessions — years of daily practice, and far past what the graph shows.
 */
const MAX_PAGES = 20;

/**
 * Practice history. Signed-out visitors get an empty list rather than an error,
 * so the surrounding screen can invite them to sign in instead of failing.
 */
export function usePracticeSessions(
  query: PracticeSessionQuery = {},
): AsyncState<PracticeSessionWire[]> & { signedOut: boolean } {
  const { limit, drillId, musicKey, enabled = true, all = false } = query;

  // A disabled query is already resolved: it is an empty list, not a pending
  // request, so the first render must not show a spinner that never resolves.
  const [state, setState] = useState<AsyncState<PracticeSessionWire[]>>(
    enabled ? LOADING : { status: "ready", data: [], error: null },
  );
  const [signedOut, setSignedOut] = useState(false);

  // Same reset-during-render rule as useSession: a changed query must not
  // briefly render the previous query's rows as if they were current.
  const requestKey = `${enabled}|${all}|${limit ?? ""}|${drillId ?? ""}|${musicKey ?? ""}`;
  const [renderedFor, setRenderedFor] = useState(requestKey);
  if (renderedFor !== requestKey) {
    setRenderedFor(requestKey);
    setState(enabled ? LOADING : { status: "ready", data: [], error: null });
    setSignedOut(false);
  }

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    const fetchPage = (offset: number) =>
      api.listPracticeSessions(
        {
          limit: all ? PAGE : limit,
          offset,
          drillId,
          musicKey,
          sort: "created_at",
          direction: "desc",
        },
        controller.signal,
      );

    const fetchAll = async () => {
      const first = await fetchPage(0);
      if (!all) return first.data;

      const rows = [...first.data];
      for (let page = 1; page < MAX_PAGES && rows.length < first.page.total; page += 1) {
        const next = await fetchPage(page * PAGE);
        if (next.data.length === 0) break;
        rows.push(...next.data);
      }
      return rows;
    };

    fetchAll()
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        const clientError = toClientError(error);
        if (clientError.code === "unauthenticated") {
          setSignedOut(true);
          setState({ status: "ready", data: [], error: null });
          return;
        }
        setState({ status: "error", data: null, error: clientError });
      });

    return () => controller.abort();
  }, [limit, drillId, musicKey, enabled, all]);

  return { ...state, signedOut };
}
