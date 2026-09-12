/**
 * Module resolution hooks that let the contract tests import the app's real
 * TypeScript modules under plain Node:
 *
 *   - `cloudflare:workers` resolves to an in-process stub
 *   - `@/...` resolves against the project root, as tsconfig paths does
 *   - extensionless relative imports get their `.ts`/`.tsx` extension back
 *
 * This keeps the application source idiomatic for the bundler while staying
 * runnable in `node --test`.
 *
 * Register with: node --import ./tests/helpers/register.mjs
 */
import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const EXTENSIONS = [".ts", ".tsx", ".mjs", ".js"];

function withExtension(basePath) {
  if (existsSync(basePath) && !basePath.endsWith("/")) return basePath;
  for (const extension of EXTENSIONS) {
    if (existsSync(basePath + extension)) return basePath + extension;
  }
  for (const extension of EXTENSIONS) {
    const indexPath = resolvePath(basePath, `index${extension}`);
    if (existsSync(indexPath)) return indexPath;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return { url: new URL("./cloudflare-workers.mjs", import.meta.url).href, shortCircuit: true };
  }

  if (specifier.startsWith("@/")) {
    const resolved = withExtension(resolvePath(ROOT, specifier.slice(2)));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const resolved = withExtension(resolvePath(parentDir, specifier));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
