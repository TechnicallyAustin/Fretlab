/**
 * The design kit is vendored additively.
 *
 * It arrived as an untracked archive with its paths scrambled and its imports
 * broken. Vendoring it is only safe because nothing in it collides with what
 * is already here — and that is a property worth keeping rather than assuming,
 * since the app's own stylesheet is 8,400 lines and the kit's is 1,188.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { frontendSource, readProjectFile } from "./helpers/sources.mjs";
import { readdir } from "node:fs/promises";

test("every kit token is namespaced, so nothing overwrites the app's", async () => {
  const tokens = await readProjectFile("components/ui/tokens.css");
  const declared = [...tokens.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);
  assert.ok(declared.length > 50, `only found ${declared.length} tokens`);
  const unprefixed = declared.filter((name) => !name.startsWith("--fl-"));
  assert.deepEqual(unprefixed, [], `kit tokens outside the --fl- namespace: ${unprefixed}`);
});

test("no kit class name collides with an app class name", async () => {
  const kit = await readProjectFile("components/ui/fretlab-ui.css");
  const app = await readProjectFile("app/globals.css");
  const names = (css) => new Set([...css.matchAll(/^\.([a-z][a-z0-9-]*)/gm)].map((m) => m[1]));
  const kitNames = names(kit);
  const appNames = names(app);
  const shared = [...kitNames].filter((name) => appNames.has(name));
  assert.deepEqual(
    shared,
    [],
    `these class names are defined in both stylesheets: ${shared.join(", ")}`,
  );
});

test("the kit's stylesheets are actually loaded", async () => {
  const globals = await readProjectFile("app/globals.css");
  assert.match(globals, /@import "\.\.\/components\/ui\/tokens\.css"/);
  assert.match(globals, /@import "\.\.\/components\/ui\/fretlab-ui\.css"/);

  // CSS requires every @import to precede any other rule, so a token file
  // imported after the first selector is silently dropped.
  const firstRule = globals.search(/^[.:@a-z*[]/m);
  const lastImport = globals.lastIndexOf("@import");
  const beforeLastImport = globals.slice(0, lastImport);
  assert.ok(
    !/^\s*[.:#][a-z]/mi.test(beforeLastImport),
    "an @import follows a rule, so the browser will ignore it",
  );
  void firstRule;
});

test("the kit has no unresolvable imports", async () => {
  // It shipped with `export * from "./Hero"` and `from "../primitives"`, and
  // neither path existed where it was extracted to.
  const files = (await readdir("components/ui")).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
  const present = new Set(files.map((f) => f.replace(/\.(tsx|ts)$/, "")));
  for (const file of files) {
    const source = await readProjectFile(`components/ui/${file}`);
    for (const match of source.matchAll(/from "\.\/([A-Za-z-]+)"/g)) {
      assert.ok(
        present.has(match[1]),
        `${file} imports ./${match[1]}, which is not in components/ui`,
      );
    }
    assert.ok(
      !source.includes('from "../'),
      `${file} still reaches outside components/ui with a relative import`,
    );
  }
});

/**
 * The fretboard adapter is the whole reason this vendoring is safe: the kit's
 * cards keep their prop shape while the renderer underneath is the one with
 * the music in it.
 */
test("the kit's cards draw with the app's renderer, not the kit's", async () => {
  const adapter = await readProjectFile("components/ui/fretboard.tsx");
  assert.match(adapter, /from "@\/components\/fretlab\/Fretboard"/);
  assert.match(adapter, /export function FretboardMini/);

  const cards = await readProjectFile("components/ui/cards.tsx");
  assert.match(cards, /from "\.\/fretboard"/, "cards should use the adapter");

  // The two number their strings from opposite ends, and exactly one place is
  // allowed to know that.
  assert.match(adapter, /stringIndex \+ 1/);
  for (const file of ["cards.tsx", "practice.tsx", "shell.tsx", "progress.tsx"]) {
    const source = await readProjectFile(`components/ui/${file}`);
    assert.ok(
      !/stringIndex \+ 1|\.s = /.test(source),
      `${file} converts string indexes itself instead of leaving it to the adapter`,
    );
  }
});

/**
 * The kit does not undo the readability floor.
 *
 * The app set a 13px caption floor in FL-17 and guards it in
 * `text is readable`, which reads `app/globals.css` only. The kit arrived with
 * 61 literal sizes below that floor — down to 7.68px — and a `--fl-t-label`
 * token of 0.7rem, 11.2px, driving every eyebrow, key chip and card kicker.
 * Adopting the kit would have quietly undone FD-07 and FL-17 together.
 *
 * This checks the type scale, and then only those kit classes the app
 * actually renders: the kit ships components for screens FretLab does not
 * have, and their type is not this app's problem until one is adopted. So the
 * guard widens on its own as more screens convert.
 */
test("the kit's type scale clears the 13px floor", async () => {
  const tokens = await readProjectFile("components/ui/tokens.css");
  for (const [, name, rem] of tokens.matchAll(/(--fl-t-[a-z]+):\s*([0-9.]+)rem/g)) {
    const px = Number(rem) * 16;
    assert.ok(px >= 13, `${name} is ${px.toFixed(1)}px, under the 13px floor`);
  }
});

test("no kit component the app renders sets type below 13px", async () => {
  const css = await readProjectFile("components/ui/fretlab-ui.css");

  // "In use" means the class reaches the page, not that it appears in the
  // kit's own source — every kit class does that, which is how the first
  // version of this test flagged components FretLab does not have. So the
  // in-use set is read out of the rendered HTML.
  const rendered = new Set();
  for (const route of ["/", "/songs", "/scales", "/chords", "/library"]) {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `kit-${process.pid}-${route}`);
    const { default: worker } = await import(workerUrl.href);
    const response = await worker.fetch(
      new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const html = await response.text();
    for (const [, value] of html.matchAll(/class="([^"]*)"/g)) {
      for (const name of value.split(/\s+/)) if (name.startsWith("fl-")) rendered.add(name);
    }
  }
  assert.ok(rendered.size > 10, `only ${rendered.size} kit classes rendered; is the build stale?`);

  const offenders = [];
  const lines = css.split("\n");
  lines.forEach((line, index) => {
    for (const match of line.matchAll(/font-size:\s*(\.?[0-9.]+)rem/g)) {
      const px = Number(match[1]) * 16;
      if (px >= 13) continue;
      let selector = line.split("{")[0].trim();
      if (!selector) {
        for (let back = index; back >= 0 && back > index - 14; back -= 1) {
          if (/\{\s*$/.test(lines[back])) {
            selector = lines[back].trim();
            break;
          }
        }
      }
      const classes = [...selector.matchAll(/\.(fl-[a-z0-9_-]+)/g)].map((m) => m[1]);
      if (classes.some((name) => rendered.has(name))) {
        offenders.push(`${px.toFixed(2)}px  ${selector.slice(0, 60)}`);
      }
    }
  });

  assert.deepEqual(
    offenders,
    [],
    `kit type under the 13px floor, on components the app renders:\n  ${offenders.join("\n  ")}`,
  );
});

/**
 * App CSS does not reach inside kit components.
 *
 * The class-name collision test above passes and always did — the kit's names
 * and the app's never overlapped. That was never the whole risk. Kit markup is
 * mounted inside the app's own containers, so any app rule written as an
 * ancestor plus a bare element selector lands on it.
 *
 * It happened. `.library-launchpad button>span` was written for the
 * hand-rolled tiles it replaced, and it matched three spans inside the kit's
 * LibraryTile — the scrim, the count and the body — giving the text container
 * a pill background and uppercase tracking, laid over the tile. That is the
 * overlaid text that got reported.
 */
test("no app rule reaches into a converted screen with a bare element selector", async () => {
  const css = await readProjectFile("app/globals.css");

  // The containers that hold kit components today. A screen joins this list
  // when it is converted, and its own CSS has to stop reaching inside.
  const converted = [
    "library-home-header",
    "library-launchpad",
    "song-library-screen",
    "scale-library-screen",
    "chord-library-screen",
    "today-screen",
  ];
  const ELEMENTS =
    /(?:^|[\s>+~])(?:button|span|small|strong|b|i|p|h1|h2|h3|article|section|div|img|footer|header)(?:\s*[>+~]|\s|$)/;

  const offenders = [];
  for (const [, selector] of css.matchAll(/(?:^|\})\s*([^{}@]+)\{/g)) {
    for (const part of selector.split(",")) {
      const trimmed = part.trim();
      if (!converted.some((name) => trimmed.includes(`.${name}`))) continue;
      // Only the part after the container matters: the container's own
      // element qualifier is fine, reaching past it is not.
      const tail = trimmed.slice(
        Math.max(...converted.map((name) => {
          const at = trimmed.indexOf(`.${name}`);
          return at === -1 ? -1 : at + name.length + 1;
        })),
      );
      if (tail && ELEMENTS.test(tail)) offenders.push(trimmed.slice(0, 70));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `app rules that can land on kit markup:\n  ${offenders.join("\n  ")}\n` +
      "Scope them to a class, or delete them if the markup they were written for is gone.",
  );
});
