/**
 * How big a fretboard is, before anything is drawn on it.
 *
 * App Template Contract v1 §5: domain logic, so it sits under lib/ and any
 * layer may import it. It is pure arithmetic and used to live inside the
 * component, where nothing could check it.
 *
 * It needed checking. Every type size on the board is clamped to a 13px
 * minimum — but those are **viewBox units**, and the SVG is then scaled to fit
 * its container. At `HEAD` the full 0-12 board was 711 units wide, allowed to
 * render at 520px, and so drew its note labels at **8 screen pixels** while the
 * code asserted a floor of 13. A floor that does not survive scaling is not a
 * floor, and no test could see the difference because the arithmetic was not
 * reachable from one.
 *
 * The rule this file exists to keep: **a board is never rendered narrower than
 * its own natural width.** Then the scale is at least 1, and a 13-unit glyph is
 * at least 13 pixels, by construction rather than by assertion.
 */

/** Board metrics in viewBox units. */
export type BoardGeometry = {
  unit: number;
  gap: number;
  openWidth: number;
  nameGutter: number;
  /** Total viewBox width. Also the minimum width it may be rendered at. */
  width: number;
  height: number;
  boardHeight: number;
  numberRow: number;
  markerRow: number;
  top: number;
  dotRadius: number;
  fretNumberSize: number;
  stringNameSize: number;
  labelSize: number;
  /** width / height, for bounding a board by height without distorting it. */
  aspect: number;
};

export type GeometryInput = {
  low: number;
  high: number;
  mini?: boolean;
  /** A chord board carries a muted/open marker row above the nut. */
  showsMarkers?: boolean;
};

/** The smallest type on any board, in viewBox units. Matches the CSS floor. */
export const TYPE_FLOOR = 13;

export function boardGeometry({
  low,
  high,
  mini = false,
  showsMarkers = false,
}: GeometryInput): BoardGeometry {
  const unit = mini ? 40 : 66;
  const gap = mini ? 20 : 28;
  const openWidth = Math.round(unit * 0.62);
  const nameGutter = Math.round(gap * 0.95);

  const fretCount = high - low + 1;
  // Fret zero is the open-string column and is narrower than a fretted one.
  const fretWidths = fretCount * unit - (low === 0 ? unit - openWidth : 0);
  const width = nameGutter + fretWidths;

  const markerRow = showsMarkers && low <= 1 ? Math.round(gap * (mini ? 0.6 : 0.68)) : 0;
  const top = (mini ? 14 : 20) + markerRow;
  const boardHeight = 6 * gap;
  const numberRow = Math.round(gap * 0.82);
  const height = top + boardHeight + numberRow + (mini ? 6 : 10);

  const dotRadius = Math.max(mini ? 8 : 11, Math.round(gap * 0.37));

  return {
    unit,
    gap,
    openWidth,
    nameGutter,
    width,
    height,
    boardHeight,
    numberRow,
    markerRow,
    top,
    dotRadius,
    fretNumberSize: Math.max(TYPE_FLOOR, Math.round(gap * 0.44)),
    stringNameSize: Math.max(TYPE_FLOOR, Math.round(gap * 0.42)),
    labelSize: Math.max(TYPE_FLOOR, Math.round(dotRadius * 0.95)),
    aspect: width / height,
  };
}

/**
 * The scale a board is drawn at in a container of a given width.
 *
 * `min-width` is the board's natural width, and CSS resolves `min-width` above
 * `max-width`, so the legibility floor wins over the height bound rather than
 * the other way round. That ordering is the whole point: a board may overflow
 * and scroll, but it may not shrink.
 */
export function renderedScale(geometry: BoardGeometry, containerWidth: number): number {
  return Math.max(containerWidth, geometry.width) / geometry.width;
}

/** The on-screen size of the smallest glyph on a board, in real pixels. */
export function smallestTypeOnScreen(
  geometry: BoardGeometry,
  containerWidth: number,
): number {
  const scale = renderedScale(geometry, containerWidth);
  return (
    Math.min(geometry.fretNumberSize, geometry.stringNameSize, geometry.labelSize) *
    scale
  );
}

/**
 * Where to scroll a board that does not fit, so the notes are on screen.
 *
 * A full 0–12 neck is 860 units and a phone column is 354, so after FD-01 it
 * is legible and overflows. Left alone it opens at the nut — and a drill whose
 * shape sits at frets 7–10 then opens on an empty stretch of board, with the
 * thing being taught off the right-hand edge. The learner has to discover the
 * scroll to find out the board is not empty.
 *
 * Returns the pixel offset that centres the notes in view, clamped to the ends
 * so the board never scrolls past its own edges. Returns 0 when it all fits,
 * which is the common case and needs no scrolling at all.
 */
export function scrollTargetFor(
  frets: readonly number[],
  /** Only the three measurements this needs, so a caller can pass primitives
      and keep them out of a React dependency array. */
  geometry: Pick<BoardGeometry, "width" | "unit" | "nameGutter">,
  containerWidth: number,
): number {
  const overflow = geometry.width - containerWidth;
  if (overflow <= 0 || frets.length === 0) return 0;

  // Where the notes sit in viewBox units. `nameGutter` is the string-name
  // column before fret one.
  const lowest = Math.min(...frets);
  const highest = Math.max(...frets);
  const unitsPerFret = geometry.unit;
  const left = geometry.nameGutter + lowest * unitsPerFret;
  const right = geometry.nameGutter + (highest + 1) * unitsPerFret;
  const centre = (left + right) / 2;

  // The board renders at its natural width when it overflows, so viewBox units
  // and pixels are one to one — that is what FD-01's minimum width buys.
  return Math.max(0, Math.min(overflow, Math.round(centre - containerWidth / 2)));
}

/**
 * How many frets fit a container at legible size.
 *
 * The board may never be scaled below its own width (see `renderedScale`), so
 * "fits" is a question about the viewBox, not about the screen: how many fret
 * columns can be laid out before the natural width passes the container.
 *
 * Returns at least 4, which is a hand span and the width of a CAGED position —
 * below that the board stops being a shape and becomes a list of notes.
 */
export function fretsThatFit(
  containerWidth: number,
  { mini = false }: { mini?: boolean } = {},
): number {
  // Every column is costed at full width, including fret zero, which is
  // narrower. Sizing against the narrow open column would be right only for a
  // window that actually contains it — and the window is chosen *after* this,
  // from where the notes are. Asking for five frets on the strength of a nut
  // that then turns out not to be in frame overflows by exactly one column's
  // difference, which is how frets 7-11 came to need 357px of a 354px column.
  const probe = boardGeometry({ low: 1, high: 1, mini });
  const unit = mini ? 40 : 66;
  const fretted = Math.floor((containerWidth - probe.nameGutter) / unit);
  return Math.max(4, fretted);
}

/**
 * The slice of neck to show when the whole of it will not fit.
 *
 * Centred on the notes, then pushed back inside the board's own range, so a
 * shape near the nut or near the 12th fret still gets a full window rather
 * than a half-empty one running off the end.
 *
 * A four-fret window is exactly a CAGED position, which is the point: the
 * narrow view shows one position at a time rather than a squinting view of
 * twelve frets, and moving between them is the thing the neck is made of.
 */
export function windowFor(
  low: number,
  high: number,
  frets: readonly number[],
  size: number,
): { low: number; high: number } {
  const span = high - low + 1;
  if (size >= span) return { low, high };

  const played = frets.filter((fret) => fret >= low && fret <= high);
  const centre = played.length
    ? (Math.min(...played) + Math.max(...played)) / 2
    : low + size / 2;

  let start = Math.round(centre - (size - 1) / 2);
  start = Math.max(low, Math.min(start, high - size + 1));
  return { low: start, high: start + size - 1 };
}
