/**
 * Every control can be reached and named.
 *
 * Audit §8. Contrast is guarded to WCAG AA by `tests/contrast.test.mjs`;
 * nothing else was. There are 101 buttons against 37 `aria-label`s, and no
 * assertion that a control has an accessible name, that a heading order makes
 * sense, or that the page declares a language.
 *
 * These read the rendered HTML rather than the source, so they describe what a
 * screen reader would actually meet.
 */
import assert from "node:assert/strict";
import test from "node:test";

async function render(path) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `a11y-${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

const body = async (path) => {
  const html = await (await render(path)).text();
  // Scripts carry the serialised component tree, which is not the document.
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
};

const ROUTES = [
  "/", "/drills", "/train", "/keys", "/theory", "/chords",
  "/scales", "/songs", "/progress", "/tuner", "/routines", "/signin",
];

/** The text a screen reader would announce for one element's markup. */
function accessibleName(tag) {
  const aria = tag.match(/aria-label="([^"]*)"/)?.[1];
  if (aria?.trim()) return aria.trim();
  if (/aria-labelledby="[^"]+"/.test(tag)) return "labelledby";
  if (/aria-hidden="true"/.test(tag)) return "hidden";
  // Strip nested markup and entities to get at the text content.
  const inner = tag
    .replace(/^<button\b[^>]*>/i, "")
    .replace(/<\/button>$/i, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#x?[0-9a-f]+;/gi, "x")
    .replace(/\s+/g, " ")
    .trim();
  return inner;
}

test("every button says what it does", async () => {
  const nameless = [];
  for (const route of ROUTES) {
    const html = await body(route);
    for (const match of html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/gi)) {
      const name = accessibleName(match[0]);
      if (!name) nameless.push(`${route}: ${match[0].slice(0, 90)}`);
    }
  }
  assert.deepEqual(
    nameless,
    [],
    `buttons a screen reader cannot announce:\n  ${nameless.join("\n  ")}`,
  );
});

test("every page declares its language and a viewport", async () => {
  for (const route of ROUTES) {
    const html = await (await render(route)).text();
    assert.match(html, /<html[^>]+lang="[a-z-]+"/i, `${route} has no lang`);
    assert.match(html, /name="viewport"/i, `${route} has no viewport`);
  }
});

test("every page has exactly one first-level heading", async () => {
  // More than one h1 leaves a screen-reader user with no "top of the page",
  // and none leaves them with no landmark at all.
  for (const route of ROUTES) {
    const html = await body(route);
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    assert.ok(h1s.length <= 1, `${route} has ${h1s.length} h1 elements`);
  }
});

test("headings do not skip a level", async () => {
  for (const route of ROUTES) {
    const html = await body(route);
    const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i += 1) {
      assert.ok(
        levels[i] <= levels[i - 1] + 1,
        `${route} jumps from h${levels[i - 1]} to h${levels[i]}`,
      );
    }
  }
});

test("an image that carries meaning carries a description", async () => {
  for (const route of ROUTES) {
    const html = await body(route);
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(match[0], /alt="/, `${route}: an image with no alt`);
    }
    // The fretboard is an SVG, and its container carries the description.
    // The board itself, not its figure or caption wrappers — matching
    // `fretboard` loosely also caught `fretboard-caption`, which has nothing
    // to announce and correctly says nothing.
    for (const match of html.matchAll(/<div[^>]*class="fretboard(?: mini)?"[^>]*>/gi)) {
      assert.ok(
        /aria-label="|role="/.test(match[0]),
        `${route}: a fretboard with nothing to announce`,
      );
    }
  }
});

test("a control that only shows an icon is labelled", async () => {
  // Arrows, chevrons and symbols announce as their character or as nothing.
  const SYMBOLS = /^[←→↑↓▶⌄✓×—·\s\d]*$/u;
  const unlabelled = [];
  for (const route of ROUTES) {
    const html = await body(route);
    for (const match of html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/gi)) {
      const tag = match[0];
      if (/aria-label="[^"]+"/.test(tag)) continue;
      const name = accessibleName(tag);
      if (name && SYMBOLS.test(name)) {
        unlabelled.push(`${route}: "${name}" — ${tag.slice(0, 70)}`);
      }
    }
  }
  assert.deepEqual(
    unlabelled,
    [],
    `icon-only controls with no label:\n  ${unlabelled.join("\n  ")}`,
  );
});

test("the fretboard grid is reachable by keyboard where it is playable", async () => {
  // FL-16 added keyboard navigation; nothing asserted it survived. The grid is
  // on Train, where the board is tapped — a drill page's board is a diagram
  // and correctly exposes role="img" instead.
  const train = await body("/train");
  assert.match(train, /role="grid"/i, "the playable board is not a grid");
  assert.match(train, /tabindex="0"/i, "nothing in the board can take focus");

  const diagram = await body("/drills/thirds");
  assert.match(diagram, /role="img"/i, "a diagram board should announce as an image");
});
