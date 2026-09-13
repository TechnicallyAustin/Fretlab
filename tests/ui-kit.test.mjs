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
import { readProjectFile } from "./helpers/sources.mjs";
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
