/**
 * §9: "Boundary lint passes; a deliberate L3-imports-API violation fails the
 * build."
 *
 * The second half is the part worth testing: a rule that never fires is worse
 * than no rule, because it reads as enforcement.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = fileURLToPath(new URL("../", import.meta.url));

async function lint(paths) {
  try {
    const { stdout } = await run("npx", ["eslint", "--format", "json", ...paths], { cwd: ROOT });
    return JSON.parse(stdout);
  } catch (error) {
    // eslint exits non-zero when it finds errors; the report is still on stdout.
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
}

test("the three levels currently pass the boundary lint", async () => {
  const results = await lint(["app", "components", "lib", "db"]);
  const violations = results.flatMap((result) =>
    result.messages
      .filter((message) => message.ruleId?.startsWith("boundaries/"))
      .map((message) => `${result.filePath}:${message.line} ${message.message}`),
  );
  assert.deepEqual(violations, [], `boundary violations:\n${violations.join("\n")}`);
});

test("an L3 element importing the API client fails the lint", async () => {
  const target = join(ROOT, "components/fretlab/__boundary_probe__.tsx");
  await writeFile(
    target,
    `"use client";
import { getDb } from "@/db";
import { practiceSessionToWire } from "@/lib/api/serialize";

export function BoundaryProbe() {
  void getDb;
  void practiceSessionToWire;
  return null;
}
`,
  );

  try {
    const results = await lint([target]);
    const boundaryErrors = results
      .flatMap((result) => result.messages)
      .filter((message) => message.ruleId === "boundaries/dependencies");

    assert.ok(
      boundaryErrors.length >= 2,
      "§5 must reject an L3 element that imports the API client or the database",
    );
    for (const error of boundaryErrors) {
      assert.equal(error.severity, 2, "the violation must be an error, not a warning");
      assert.match(error.message, /l3-element/);
    }
  } finally {
    await rm(target, { force: true });
  }
});

test("the contract's dependency direction is encoded in the config", async () => {
  const config = await readFile(join(ROOT, "eslint.config.mjs"), "utf8");
  assert.match(config, /boundaries\/dependencies/);
  assert.match(config, /default: "disallow"/);
  for (const type of ["l1-page", "l2-section", "l3-element", "lib-domain", "lib-server", "api"]) {
    assert.match(config, new RegExp(`"${type}"`), `missing element type: ${type}`);
  }
});
