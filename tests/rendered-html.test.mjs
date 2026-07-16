import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Jada knowledge OS", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Jada — Commercial Product Leadership<\/title>/i);
  assert.match(html, /Build the judgment to lead products/i);
  assert.match(html, /Your knowledge map/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps paths, lessons, projects, and the design system wired", async () => {
  const [page, css, guide, componentFiles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../docs/DESIGN_SYSTEM.md", import.meta.url), "utf8"),
    readdir(new URL("../components/design-system/", import.meta.url)),
  ]);

  assert.match(page, /function PathView/);
  assert.match(page, /onClick=\{\(\) => onRole\(item\.role\)\}/);
  assert.match(page, /function LessonWorkspace/);
  assert.match(page, /function ProjectStudioView/);
  assert.match(page, /"Foundation" \| "Applied" \| "Integrated" \| "Capstone"/);
  assert.match(page, /jada-learning-state/);
  assert.match(css, /font-family:\s*Verdana/);
  assert.match(css, /font-size:\s*17px/);
  assert.match(css, /\.ds-focus-notice/);
  assert.match(guide, /ADHD, dyslexia, and dysgraphia/i);
  assert.deepEqual(componentFiles.sort(), ["FocusNotice.tsx", "ProgressBar.tsx", "SectionHeader.tsx", "SubconceptCard.tsx", "Surface.tsx", "index.ts"]);
});
