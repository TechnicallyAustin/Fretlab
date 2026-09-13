/**
 * Every screen renders something a person can use.
 *
 * Audit §3. Nine screens had no test of any kind — DrillDetail, GroupedDrills,
 * KeyDetail, Keys, RoutineDetail, Routines, ScaleDetail, SignIn, Summary — and
 * of the 139 assertions that did cover screens, 31 read source files and
 * matched regexes against them. That pins implementation details rather than
 * behaviour, and it cost twice during the remediation: one assertion was
 * pinned to `--board-natural` and another to `${low}`, and both failed when the
 * code improved rather than when it broke.
 *
 * These render the route and read the page. They pass whatever the source says,
 * as long as a reader gets something real.
 */
import assert from "node:assert/strict";
import test from "node:test";

async function render(path) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

/** Visible text only: scripts carry the RSC payload and would match anything. */
function visible(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

const page = async (path) => visible(await (await render(path)).text());

/**
 * The nine that had nothing. Each names what a reader must actually find,
 * rather than which component rendered it.
 */
const SCREENS = [
  { path: "/drills/thirds", name: "DrillDetail", expect: ["Thirds through the shape", "Intervals"] },
  { path: "/drills/groups", name: "GroupedDrills", expect: ["Scale fluency"] },
  { path: "/keys", name: "Keys", expect: ["key"] },
  { path: "/keys/current", name: "KeyDetail", expect: ["major"] },
  { path: "/routines", name: "Routines", expect: ["Ten minute warm-up", "Neck knowledge"] },
  { path: "/routines/one-key-deep", name: "RoutineDetail", expect: ["One key, deep", "minutes"] },
  { path: "/routines/summary", name: "Summary", expect: ["No finished run to show"] },
  { path: "/signin", name: "SignIn", expect: ["Checking your session"] },
  { path: "/scales/major", name: "ScaleLibraryDetail", expect: ["Major"] },
];

for (const screen of SCREENS) {
  test(`${screen.name} renders something usable at ${screen.path}`, async () => {
    const response = await render(screen.path);
    assert.equal(response.status, 200, `${screen.path} did not render`);
    const text = visible(await response.text());
    for (const phrase of screen.expect) {
      assert.ok(
        text.includes(phrase),
        `${screen.path} should show "${phrase}"`,
      );
    }
    // A screen that renders only chrome is not rendering.
    assert.ok(text.length > 400, `${screen.path} rendered almost nothing`);
  });
}

test("a detail screen shows the entity in its URL, not a default", async () => {
  // The defect this guards is the one FL-11 and the /scales/current removal
  // both fixed: a detail route that renders a fixed entity whatever the URL.
  const thirds = await page("/drills/thirds");
  const pentatonic = await page("/drills/pentatonic-one");
  assert.ok(thirds.includes("Thirds through the shape"));
  assert.ok(pentatonic.includes("Pentatonic box one"));
  assert.ok(
    !pentatonic.includes("Thirds through the shape"),
    "one drill page is showing another drill",
  );

  const deep = await page("/routines/one-key-deep");
  const warm = await page("/routines/warm-up");
  assert.ok(deep.includes("One key, deep"));
  assert.ok(warm.includes("Ten minute warm-up"));
  assert.ok(!warm.includes("One key, deep"), "routine pages are interchangeable");
});

test("no screen renders a raw template placeholder", async () => {
  // A `${...}` reaching the page means a template literal was written into
  // JSX text as a string, which has happened in this codebase before.
  for (const screen of SCREENS) {
    const text = await page(screen.path);
    assert.ok(!text.includes("${"), `${screen.path} leaked a template literal`);
    assert.ok(!/\bundefined\b/.test(text), `${screen.path} rendered "undefined"`);
    assert.ok(!/\bNaN\b/.test(text), `${screen.path} rendered "NaN"`);
  }
});
