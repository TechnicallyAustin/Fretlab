/**
 * The view/URL map.
 *
 * App Template Contract v1 §5 puts URL state in L1. This module is the single
 * place that knows which view lives at which path, so L1 pages, the frame's
 * navigation, and the CSS `view-*` class all agree.
 *
 * It is pure data: no router import, so L2 and L3 may read it without crossing
 * a boundary.
 */
import type { View } from "./types";

/**
 * Detail routes are dynamic segments, written here with a `:param` placeholder.
 *
 * Static siblings (`/scales/current`, `/drills/groups`) sit next to dynamic
 * ones. Next resolves static first, and no entity id collides with one of
 * those words, so the pairs are unambiguous.
 */
export const VIEW_PATHS: Record<View, string> = {
  today: "/",
  drills: "/drills",
  grouped: "/drills/groups",
  "drill-detail": "/drills/:id",
  train: "/train",
  keys: "/keys",
  library: "/library",
  "key-detail": "/keys/current",
  theory: "/theory",
  chords: "/chords",
  "chord-detail": "/chords/:id",
  scales: "/scales",
  "scale-library-detail": "/scales/:id",
  "scale-detail": "/scales/current",
  songs: "/songs",
  "song-detail": "/songs/:id",
  progress: "/progress",
  tuner: "/tuner",
  routines: "/routines",
  "routine-detail": "/routines/:id",
  runner: "/routines/runner/:id",
  summary: "/routines/summary",
  signin: "/signin",
  onboarding: "/onboarding",
};

/** Views whose path carries an id. */
export const DETAIL_VIEWS = new Set<View>([
  // The runner carries the routine it is running: it used to render the same
  // hardcoded drill whichever routine you started from.
  "runner",
  "drill-detail",
  "chord-detail",
  "scale-library-detail",
  "song-detail",
  "routine-detail",
]);

/**
 * Falls back to the view's own default id so `go("chord-detail")` with no id
 * still lands somewhere real rather than on `/chords/:id`.
 */
export const DEFAULT_DETAIL_ID: Record<string, string> = {
  runner: "warm-up",
  "drill-detail": "position-one",
  "chord-detail": "g-major",
  "scale-library-detail": "major",
  "song-detail": "stand-by-me",
  "routine-detail": "warm-up",
};

export function hrefForView(view: View, id?: string): string {
  const path = VIEW_PATHS[view];
  if (!path.includes(":id")) return path;
  return path.replace(":id", id ?? DEFAULT_DETAIL_ID[view] ?? "");
}

const STATIC_PATHS = new Map<string, View>(
  (Object.entries(VIEW_PATHS) as [View, string][])
    .filter(([, path]) => !path.includes(":id"))
    .map(([view, path]) => [path, view]),
);

/** Reverse lookup, used for the `view-*` class and the active nav item. */
export function viewForPath(pathname: string): View {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const exact = STATIC_PATHS.get(path);
  if (exact) return exact;

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 3 && segments[0] === "routines" && segments[1] === "runner") {
    return "runner";
  }
  if (segments.length === 2) {
    switch (segments[0]) {
      case "drills":
        return "drill-detail";
      case "chords":
        return "chord-detail";
      case "scales":
        return "scale-library-detail";
      case "songs":
        return "song-detail";
      case "routines":
        return "routine-detail";
    }
  }
  return "today";
}

/**
 * Which of the four bottom-nav destinations a view belongs to. Lifted verbatim
 * from the shell so the nav highlights the same item it always did.
 */
export function primaryViewFor(view: View): View {
  if (view === "onboarding") return "today";
  if (view === "today") return "today";
  if (view === "theory") return "theory";
  if (view === "library" || view === "keys" || view.includes("key") || view.includes("scale") || view.includes("chord") || view.includes("song")) return "library";
  // The tuner belongs with practice: it is what you do before a session, not
  // something you browse.
  if (
    view === "train" ||
    view === "drills" ||
    view === "routines" ||
    view === "runner" ||
    view === "tuner"
  ) {
    return "train";
  }
  if (view === "grouped" || view.includes("drill")) {
    return "drills";
  }
  return "today";
}
