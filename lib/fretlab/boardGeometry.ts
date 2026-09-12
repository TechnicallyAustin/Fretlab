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
