/**
 * The stylesheet does not accumulate.
 *
 * At 8,650 lines it was larger than any source area and larger than the whole
 * test suite, and 16 class names were referenced nowhere in any component —
 * several of them residue from screens deleted during the remediation.
 * `accuracy-list` styled the fabricated per-drill percentages that FL-11
 * removed from Summary and outlived them by twenty commits.
 *
 * Deleting a screen has to delete its styles too, and nothing was checking.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readProjectFile, frontendSource } from "./helpers/sources.mjs";

/**
 * Class names the stylesheet may keep without a literal match in a component,
 * because they are assembled at runtime.
 *
 * Kept explicit rather than inferred: a prefix rule that allowed anything
 * would let the next dead class in as well.
 */
const BUILT_AT_RUNTIME = [
  /^view-/, // `app-frame view-${view}`
  /^theme-/, // `site-shell theme-${themeMode}`
  /^level-/, // activity graph and consistency levels
  /^state-notice-/, // `state-notice-${tone}`
  /^tone-/, // note-role tones
  /^googleapis$|^gstatic$/, // font host names inside url()
];

test("every class in the stylesheet is used by something", async () => {
  const css = await readProjectFile("app/globals.css");
  const source = await frontendSource();

  const classes = [...new Set([...css.matchAll(/\.([a-z][a-z0-9-]{2,})/g)].map((m) => m[1]))];

  const dead = classes.filter((name) => {
    if (BUILT_AT_RUNTIME.some((pattern) => pattern.test(name))) return false;
    if (source.includes(name)) return false;
    // A name may be built from a stem plus a suffix, so a stem match counts.
    const parts = name.split("-");
    for (let i = parts.length - 1; i >= 2; i -= 1) {
      if (source.includes(`${parts.slice(0, i).join("-")}-`)) return false;
    }
    return true;
  });

  assert.deepEqual(
    dead,
    [],
    `styles with nothing to style:\n  ${dead.join("\n  ")}\n` +
      "Delete them, or add the prefix to BUILT_AT_RUNTIME if the name is assembled.",
  );
});

test("the stylesheet has no rule without a selector", async () => {
  // A sweep of dead selectors left bare `{` blocks the first time it was run,
  // which builds fine in dev and fails the production minifier.
  const css = await readProjectFile("app/globals.css");
  assert.doesNotMatch(css, /(^|\n)\s*\{\s*\n/, "a rule lost its selector");
  const open = (css.match(/\{/g) ?? []).length;
  const close = (css.match(/\}/g) ?? []).length;
  assert.equal(open, close, "unbalanced braces");
});

/**
 * Audit §9. Two files arrived as single-line JSX blobs — 1,578 and 1,058
 * characters on one line — from a different tool's house style. They are not
 * wrong, but a change to them is invisible in a diff, which is how a defect
 * hides in plain sight during review.
 */
test("no component is written as a single unreviewable line", async () => {
  const { readdir } = await import("node:fs/promises");
  const { join } = await import("node:path");

  const offenders = [];
  for (const dir of ["app/_screens", "app/_sections", "components/fretlab"]) {
    for (const name of await readdir(join(process.cwd(), dir))) {
      if (!name.endsWith(".tsx")) continue;
      const source = await readProjectFile(join(dir, name));
      const longest = Math.max(...source.split("\n").map((line) => line.length));
      // 200 is generous — a long className or a URL can reach it honestly.
      // A thousand-character line is a file with no line breaks in it.
      if (longest > 200) offenders.push(`${dir}/${name} (${longest} chars)`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `unreviewable lines:\n  ${offenders.join("\n  ")}\n` +
      "Run: npx prettier --write <file>",
  );
});
