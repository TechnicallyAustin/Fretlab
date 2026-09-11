import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders FretLab", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>FretLab — Practice one key\. Know the whole neck\.<\/title>/i);
  assert.match(html, /FretLab/i);
  assert.doesNotMatch(html, /Jada|codex-preview|Your site is taking shape/i);
});

test("ships every handoff screen and computed music logic", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const view of ["today","drills","train","keys","progress","routines","runner","summary","grouped","drill-detail","key-detail","scale-detail","routine-detail","guided"]) assert.match(page, new RegExp(`\\"${view}\\"`));
  assert.match(page, /function majorScale/);
  assert.match(page, /function targetNotes/);
  assert.match(page, /function scaleShape/);
  assert.match(page, /function CircleOfFifths/);
  assert.match(page, /localStorage\.setItem\("fretlab-key"/);
});

test("ships complete chord, scale, and song library flows", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const view of ["chords","chord-detail","scales","scale-library-detail","songs","song-detail"]) assert.match(page, new RegExp(`\\"${view}\\"`));
  for (const component of ["ChordLibrary","ChordDetail","ScaleLibrary","ScaleLibraryDetail","SongLibrary","SongDetail"]) assert.match(page, new RegExp(`function ${component}`));
  assert.match(page, /const CHORDS/);
  assert.match(page, /const SCALES/);
  assert.match(page, /const SONGS/);
  assert.match(page, /function intervalShape/);
});

test("uses the paper theme and key-color token system", async () => {
  const [page, css, layout] = await Promise.all([readFile(new URL("../app/page.tsx", import.meta.url), "utf8"), readFile(new URL("../app/globals.css", import.meta.url), "utf8"), readFile(new URL("../app/layout.tsx", import.meta.url), "utf8")]);
  assert.match(page, /oklch\(0\.58 0\.155/);
  assert.match(css, /--paper:#f4f0e7/);
  assert.match(css, /--card:#fbf8f2/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(layout, /FretLab — Practice one key/);
  assert.match(layout, /\/og\.png/);
});

test("keeps catch-all routes renderable", async () => {
  const response = await render("/drills");
  assert.equal(response.status, 200);
  const catchAll = await readFile(new URL("../app/[...slug]/page.tsx", import.meta.url), "utf8");
  assert.match(catchAll, /export \{ default \} from "\.\.\/page"/);
});
