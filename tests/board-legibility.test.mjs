/**
 * A board is legible at the size it actually renders.
 *
 * FD-01. `Fretboard` clamps every type size to a 13px minimum — but in
 * **viewBox units**, and the SVG is then scaled to fit its container. At the
 * commit this test was written against, the full 0-12 board was 711 units wide,
 * allowed to render at 520px, and drew its note labels at **8 screen pixels**
 * while the code asserted a floor of 13.
 *
 * No existing test could see it. `Math.max(13, ...)` is trivially true in the
 * unit space it is written in; the defect only exists in the ratio between that
 * space and the container. So this test computes the ratio.
 */
import assert from "node:assert/strict";
import test from "node:test";

const { boardGeometry, renderedScale, smallestTypeOnScreen, TYPE_FLOOR } =
  await import("../lib/fretlab/boardGeometry.ts");

/**
 * Content widths the app actually renders into.
 *
 * 354 is the 390px phone frame less its 18px side padding, which is what the
 * shell uses between 431px and 899px and on a real phone. 324 is the same for a
 * 360px device. 1100 is the main column of the desktop two-column layout.
 */
const CONTAINERS = [
  { name: "small phone", width: 324 },
  { name: "phone frame", width: 354 },
  { name: "desktop column", width: 1100 },
];

const BOARDS = [
  { name: "full neck", input: { low: 0, high: 12 } },
  { name: "half neck", input: { low: 0, high: 6 } },
  { name: "drill box", input: { low: 1, high: 4 } },
  { name: "scale position", input: { low: 3, high: 7 } },
  { name: "chord shape", input: { low: 0, high: 4, showsMarkers: true } },
  { name: "mini box", input: { low: 1, high: 4, mini: true } },
  { name: "mini neck", input: { low: 0, high: 12, mini: true } },
];

test("no board renders type below 13px at any width the app uses", () => {
  for (const board of BOARDS) {
    const geometry = boardGeometry(board.input);
    for (const container of CONTAINERS) {
      const size = smallestTypeOnScreen(geometry, container.width);
      assert.ok(
        size >= TYPE_FLOOR,
        `${board.name} in a ${container.width}px ${container.name}: smallest type is ${size.toFixed(1)}px`,
      );
    }
  }
});

test("a board is never scaled below its own width", () => {
  for (const board of BOARDS) {
    const geometry = boardGeometry(board.input);
    for (const container of CONTAINERS) {
      const scale = renderedScale(geometry, container.width);
      assert.ok(
        scale >= 1,
        `${board.name} at ${container.width}px renders at ${scale.toFixed(2)}x`,
      );
    }
  }
});

test("a board still grows to fill a container wider than itself", () => {
  // The floor must not become a ceiling: a four-fret box in a desktop column
  // should use the width, not sit at its natural size with 800px spare.
  const box = boardGeometry({ low: 1, high: 4 });
  assert.ok(box.width < 1100, "the box should be narrower than the column");
  assert.ok(
    renderedScale(box, 1100) > 3,
    "a small board should scale up into a wide column",
  );
});

test("the height bound is expressible without distorting the board", () => {
  // The CSS bounds height through `max-width: calc(45vh * aspect)`, which only
  // works if the aspect ratio is exported and positive.
  for (const board of BOARDS) {
    const geometry = boardGeometry(board.input);
    assert.ok(geometry.aspect > 0, `${board.name} has no aspect ratio`);
    assert.ok(
      Math.abs(geometry.aspect - geometry.width / geometry.height) < 1e-9,
      `${board.name}: aspect disagrees with its own dimensions`,
    );
  }
});

test("the full neck is the board that could not fit, and it is known", () => {
  // Not a regression guard: a record of the trade this fix makes. The full neck
  // is 860 units and a phone column is 354, so it is legible and scrolls. The
  // fix for the scrolling is a narrower default window, which is its own task.
  const neck = boardGeometry({ low: 0, high: 12 });
  assert.ok(neck.width > 354, "the full neck fits a phone now?");
  const half = boardGeometry({ low: 0, high: 6 });
  assert.ok(
    half.width > 354,
    "even a seven-fret board overflows a phone column at legible size",
  );
  // Five frets is what actually fits, which is what a narrower default means.
  const five = boardGeometry({ low: 0, high: 4 });
  assert.ok(five.width <= 354, `five frets need ${five.width}px`);
});

test("the CSS honours the geometry it is given", async () => {
  const { readProjectFile } = await import("./helpers/sources.mjs");
  const css = await readProjectFile("app/globals.css");
  assert.match(css, /min-width: var\(--board-min, 0\)/, "the floor must be applied");
  assert.match(css, /max-width: calc\(45vh \* var\(--board-aspect/, "height bound");
  assert.ok(
    !css.includes("--board-natural"),
    "the old width cap should be gone, not left dangling",
  );
});
