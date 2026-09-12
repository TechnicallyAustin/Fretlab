/**
 * Frontend source, concatenated.
 *
 * The §5 split moved components out of app/page.tsx into _screens, _sections,
 * components/ and lib/fretlab. These assertions are about what the app ships,
 * not about which file holds it, so they read the whole tree and survive the
 * next move too.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not .pathname: the project path contains a space.
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const DIRS = ["app", "components", "lib/fretlab"];
const SKIP = new Set(["node_modules", "dist", ".next", ".wrangler", "api"]);

async function walk(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let cached;

export async function frontendSource() {
  if (cached) return cached;
  const files = [];
  for (const dir of DIRS) await walk(join(ROOT, dir), files);
  const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
  cached = contents.join("\n");
  return cached;
}

export async function readProjectFile(relative) {
  return readFile(join(ROOT, relative), "utf8");
}

/** Collapses whitespace so assertions do not depend on formatter settings. */
export const squash = (text) => text.replace(/\s+/g, "");
