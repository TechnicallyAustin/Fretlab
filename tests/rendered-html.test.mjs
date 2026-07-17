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
  assert.match(page, /className="lesson-row-button"/);
  assert.match(page, /aria-label=\{`Open \$\{lesson\}`\}/);
  assert.match(page, /function ProjectStudioView/);
  assert.match(page, /"Foundation" \| "Applied" \| "Integrated" \| "Capstone"/);
  assert.match(page, /jada-learning-state/);
  assert.match(css, /font-family:\s*Verdana/);
  assert.match(css, /font-size:\s*17px/);
  assert.match(css, /\.ds-focus-notice/);
  assert.match(guide, /ADHD, dyslexia, and dysgraphia/i);
  assert.deepEqual(componentFiles.sort(), ["FocusNotice.tsx", "ProgressBar.tsx", "SectionHeader.tsx", "SubconceptCard.tsx", "Surface.tsx", "index.ts"]);
});

test("restores the orbital map and provides eight domain tutor prompts", async () => {
  const [page, css, prompts, tutorComponent] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../lib/domainTutorPrompts.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/learning/DomainTutorPrompt.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /className="domain-map orbit-map"/);
  assert.match(css, /Restored profession-at-a-glance orbital map/);
  assert.match(page, /<DomainTutorPrompt domainId=\{selectedDomain\.id\}/);
  for (const domain of ["product", "marketing", "business", "analytics", "customer", "strategy", "operations", "leadership"]) {
    assert.match(prompts, new RegExp(`\\n  ${domain}: \\{`));
  }
  assert.match(prompts, /Socratic teacher and learning coach/);
  assert.match(prompts, /hint ladder/);
  assert.match(prompts, /Do not complete assignments/);
  assert.match(tutorComponent, /navigator\.clipboard\.writeText/);
});

test("uses progressive colors for progress and My Path accents", async () => {
  const [page, css, progress, subconcept] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../components/design-system/ProgressBar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/design-system/SubconceptCard.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(progress, /"starting" \| "building" \| "advancing" \| "strong" \| "mastered"/);
  assert.match(progress, /export function ProgressValue/);
  assert.match(css, /\.ds-progress\.tone-mastered/);
  assert.match(css, /\.path-module-1/);
  assert.match(css, /\.path-module-4/);
  assert.match(css, /\.role-list button:nth-child\(8\)/);
  assert.match(subconcept, /tone\?: "indigo" \| "aqua" \| "butter" \| "coral"/);
  assert.match(page, /path-module-\$\{moduleIndex \+ 1\}/);
});

test("provides durable routes for every interactive workspace", async () => {
  const [page, catchAll] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[...slug]/page.tsx", import.meta.url), "utf8"),
  ]);

  for (const route of ["/my-path", "/knowledge-map", "/projects", "/portfolio", "/capabilities/"]) {
    assert.match(page, new RegExp(route.replace("/", "\\/")));
  }
  assert.match(page, /window\.history\.pushState/);
  assert.match(page, /popstate/);
  assert.match(catchAll, /export \{ default \} from "\.\.\/page"/);
});

test("gives every lesson a concept-specific teaching brief", async () => {
  const [page, briefs] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/lessonBriefs.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /buildLessonBrief/);
  assert.match(page, /brief\.explanation\.map/);
  assert.match(page, /brief\.conceptDefinition/);
  assert.match(page, /className="concept-definition"/);
  assert.match(page, /className="research-quest"/);
  assert.match(page, /brief\.researchSteps\.map/);
  assert.match(page, /brief\.practice\.map/);
  assert.match(page, /brief\.checkQuestion/);
  assert.doesNotMatch(page, /Good professional judgment starts with evidence that matches the decision/);
  assert.match(briefs, /"Product Vision": "A product vision describes/);
  assert.match(briefs, /"Customer Interviews": "Customer interviews are structured/);
  assert.match(briefs, /"Unit Economics": "Unit economics measures/);
  assert.match(briefs, /"Executive Presentations": "Executive presentations compress/);
  assert.match(briefs, /context\.lessonIndex === 0/);
  assert.match(briefs, /context\.lessonIndex === 1/);
  assert.match(briefs, /context\.lessonIndex === 2/);
  assert.match(briefs, /Review the reasoning, not the person/);
  assert.match(briefs, /sectionTitle: "The core idea"/);
  assert.match(briefs, /Research required|researchTitle/);
  assert.match(briefs, /Find two credible sources/);
  assert.match(page, /Do not complete the practice from this brief alone|Save your sources/);

  const capabilityNames = new Set();
  for (const list of page.matchAll(/capabilities:\s*\[([^\]]*)\]/g)) {
    for (const name of list[1].matchAll(/"([^"]+)"/g)) capabilityNames.add(name[1]);
  }
  const missingDefinitions = [...capabilityNames].filter((name) => !briefs.includes(`"${name}":`));
  assert.deepEqual(missingDefinitions, [], `Missing concept definitions: ${missingDefinitions.join(", ")}`);
});
