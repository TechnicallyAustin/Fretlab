import assert from "node:assert/strict";
import test from "node:test";
import { frontendSource, readProjectFile, squash } from "./helpers/sources.mjs";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
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
  const source = await frontendSource();
  for (const view of ["today","drills","train","keys","progress","routines","runner","summary","grouped","drill-detail","key-detail","scale-detail","routine-detail","guided"]) {
    assert.match(source, new RegExp(`"${view}"`), `missing view: ${view}`);
  }
  for (const fn of ["majorScale", "targetNotes", "scaleShape", "CircleOfFifths"]) {
    assert.match(source, new RegExp(`function ${fn}`), `missing function: ${fn}`);
  }
  // The global key is still persisted per device, now through useStoredKey.
  assert.match(source, /"fretlab-key"/);
});

test("ships complete chord, scale, and song library flows", async () => {
  const source = await frontendSource();
  for (const view of ["chords","chord-detail","scales","scale-library-detail","songs","song-detail"]) {
    assert.match(source, new RegExp(`"${view}"`), `missing view: ${view}`);
  }
  for (const component of ["ChordLibrary","ChordDetail","ScaleLibrary","ScaleLibraryDetail","SongLibrary","SongDetail"]) {
    assert.match(source, new RegExp(`function ${component}`), `missing component: ${component}`);
  }
  for (const data of ["CHORDS", "SCALES", "SONGS"]) {
    assert.match(source, new RegExp(`const ${data}`), `missing library: ${data}`);
  }
  assert.match(source, /function intervalShape/);
});

test("includes visual theory, piano comparison, and drill history systems", async () => {
  const source = await frontendSource();
  const css = await readProjectFile("app/globals.css");
  for (const fn of ["PianoMap", "TheoryLesson", "DrillHistory"]) {
    assert.match(source, new RegExp(`function ${fn}`), `missing component: ${fn}`);
  }
  assert.match(source, /Same notes on a piano/);
  assert.match(css, /\.drill-card \.fretboard\.mini/);
  assert.match(css, /\.view-drill-detail \.drill-detail-screen\.tab-practice/);
});

test("ships modular training, playable libraries, and a dedicated theory hub", async () => {
  const source = await frontendSource();
  assert.match(source, /const TRAINING_MODULES/);
  assert.match(source, /Note locator/);
  assert.match(source, /Chord tones/);
  assert.match(source, /function playTones/);
  assert.match(source, /Hear chord/);
  assert.match(source, /Hear scale/);
  assert.match(source, /function TheoryHub/);
  assert.match(source, /Fretboard foundations/);
  assert.match(source, /Rhythm & phrasing/);
  assert.match(squash(source), /level:"Advanced"/);
});

test("notes are coloured by function, not by pitch class", async () => {
  const source = await frontendSource();

  // The old board coloured every dot by its pitch class, so a seven-note scale
  // arrived as seven unrelated hues. That system is gone for good.
  assert.doesNotMatch(source, /noteAccent/, "pitch-class colouring must not come back");
  assert.doesNotMatch(
    source,
    /palette\(PC_KEY\[/,
    "a note's colour must not be derived from its pitch class",
  );

  // Function drives the drawing instead: four roles, one hue per key.
  const roles = await import("../lib/fretlab/noteRoles.ts");
  assert.deepEqual(roles.LEGEND_ROLES, ["root", "third", "fifth", "scale"]);
  assert.equal(roles.roleForDegree(0), "root");
  assert.equal(roles.roleForDegree(4), "third");
  assert.equal(roles.roleForDegree(3), "third", "minor thirds are still thirds");
  assert.equal(roles.roleForDegree(7), "fifth");
  assert.equal(roles.roleForDegree(2), "scale");
  assert.equal(roles.roleForDegree(1), "outside");

  // Shape carries the meaning, so the board survives greyscale.
  const shapes = roles.LEGEND_ROLES.map((role) => roles.ROLE_STYLE[role].shape);
  assert.equal(new Set(shapes).size >= 3, true, "roles must differ by shape, not only colour");

  // Every role sits in the key's own hue.
  const hue = (await import("../lib/fretlab/palette.ts")).keyHue("G");
  for (const role of roles.LEGEND_ROLES) {
    assert.match(roles.roleColor(role, "G"), new RegExp(`oklch\\([0-9.]+ [0-9.]+ ${hue}\\)`));
  }

  assert.match(source, /linearGradient/);
  assert.match(squash(source), /strokeWidth=\{0\.55\+string\*0\.13\}/);
});

test("every board states its fret window, including mini boards", async () => {
  const source = await frontendSource();
  // A board starting at fret 7 used to show no numbers and no string names,
  // which is what made drill boards unreadable.
  assert.doesNotMatch(source, /const showLabels = !mini/);
  assert.doesNotMatch(source, /const showStringNames = !mini/);
  assert.match(source, /Position \$\{low\}/);
  assert.match(source, /Open position/);

  // Fret markers are at their real neck positions.
  const { default: _ } = { default: null };
  void _;
  assert.match(squash(source), /SINGLE_INLAYS=newSet\(\[3,5,7,9,15,17,19,21\]\)/);
  assert.match(squash(source), /DOUBLE_INLAYS=newSet\(\[12,24\]\)/);
});

test("text is readable: rem type stays at or above the 13px caption floor", async () => {
  const css = await readProjectFile("app/globals.css");
  const sizes = [...css.matchAll(/font-size:\s*([0-9.]+)rem/g)].map((match) => Number(match[1]) * 16);
  assert.ok(sizes.length > 100, "expected the full stylesheet");
  const tiny = sizes.filter((size) => size < 13);
  assert.deepEqual(tiny, [], `found text below 13px: ${[...new Set(tiny)].join(", ")}`);
  assert.match(css, /font: 400 1rem\/1\.6 Inter/, "body copy should be 1rem");
  assert.match(css, /font-size: 1rem/, "supporting copy should use the rem scale");
  assert.match(css, /stand-mode/, "stand mode should be present");
});

test("keeps one global key across guided drills, routines, and harmony", async () => {
  const source = await frontendSource();
  const css = await readProjectFile("app/globals.css");
  assert.match(source, /function KeySelectorModal/);
  assert.match(source, /Global key/);
  // One global key, now held in a single store rather than in the shell, so it
  // survives navigation between routes and across tabs.
  assert.match(squash(source), /const\[selectedKey,setSelectedKey\]=useStoredKey\(\)/);
  assert.match(source, /useSyncExternalStore/);
  // The selected drill moved from component state into the URL.
  assert.match(squash(source), /"\/drills\/:id"/);
  assert.doesNotMatch(source, /setSelectedDrill/);
  assert.match(source, /function drillNotes/);
  assert.match(source, /Why this drill/);
  assert.match(source, /Scale → chord → music/);
  assert.match(source, /A scale is the source; chords are selected stacks/);
  assert.match(source, /practice routines/);
  assert.match(css, /\.drill-board-stage/);
  assert.match(css, /\.key-modal-backdrop/);
});

test("clarifies practice studio, keeps one key button, and tracks consistency", async () => {
  const source = await frontendSource();
  const css = await readProjectFile("app/globals.css");
  assert.match(source, /Choose practice studio lesson/);
  assert.match(source, /Goal · find all/);
  assert.match(source, /Circle of fifths/);
  assert.doesNotMatch(source, /global-key-select/);
  assert.match(source, /Practice consistency/);
  assert.match(source, /commit-graph/);
  assert.match(squash(css), /@media\(max-width:899px\)/);
  assert.match(css, /\.drill-filter-stack \.segment-tabs/);
});

test("uses the paper theme and key-color token system", async () => {
  const source = await frontendSource();
  const css = await readProjectFile("app/globals.css");
  const layout = await readProjectFile("app/layout.tsx");
  assert.match(source, /oklch\(0\.58 0\.155/);
  assert.match(squash(css), /--paper:#f4f0e7/);
  assert.match(squash(css), /--card:#fbf8f2/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(layout, /FretLab — Practice one key/);
  assert.match(layout, /\/og\.png/);
});

test("every view has its own route and renders there", async () => {
  const { VIEW_PATHS } = await import("../lib/fretlab/routes.ts");

  // Each view now owns a URL, so §5's "L1 owns URL state" is literally true.
  const paths = Object.entries(VIEW_PATHS).map(([view, path]) => [
    view,
    path
      .replace("/drills/:id", "/drills/position-one")
      .replace("/chords/:id", "/chords/c-major")
      .replace("/scales/:id", "/scales/blues")
      .replace("/songs/:id", "/songs/stand-by-me")
      .replace("/routines/runner/:id", "/routines/runner/warm-up"),
  ]);

  for (const [view, path] of paths) {
    const response = await render(path);
    assert.equal(response.status, 200, `${view} did not render at ${path}`);
    const html = await response.text();
    assert.match(
      html,
      new RegExp(`app-frame view-${view}\\b`),
      `${path} rendered, but not as the ${view} view`,
    );
  }
});

test("mobile Library exposes every top-level library route within two taps", async () => {
  const source = await readProjectFile("components/fretlab/BottomNav.tsx");
  const library = await readProjectFile("app/_screens/Library.tsx");
  const launchpad = await readProjectFile("app/_sections/LibraryLaunchpad.tsx");
  assert.match(source, /label: "Library", view: "library"/);
  for (const view of ["keys", "chords", "scales", "songs"]) {
    assert.match(launchpad, new RegExp(`view: "${view}"`));
  }
  assert.match(library, /LibraryLaunchpad/);
  assert.doesNotMatch(source, /label: "Learn"/);
  assert.doesNotMatch(source, /label: "Theory"/);
});

test("theme preference has system, light, and dark modes", async () => {
  const frame = await readProjectFile("app/_screens/FretLabFrame.tsx");
  const store = await readProjectFile("lib/fretlab/useStoredTheme.ts");
  const css = await readProjectFile("app/globals.css");
  assert.match(store, /"system" \| "light" \| "dark"/);
  assert.match(store, /fretlab-theme/);
  assert.match(frame, /useStoredTheme/);
  assert.match(frame, /theme-\$\{themeMode\}/);
  assert.match(css, /\.theme-dark/);
  assert.match(css, /prefers-color-scheme: light/);
});

test("first-run onboarding chooses a path and skips after completion", async () => {
  const screen = await readProjectFile("app/_screens/Onboarding.tsx");
  const store = await readProjectFile("lib/fretlab/useOnboarding.ts");
  const root = await readProjectFile("app/page.tsx");
  assert.match(screen, /What can you already play/);
  assert.match(screen, /What do you want to work on/);
  assert.match(screen, /Which way do you hold the guitar/);
  assert.match(screen, /setSelectedKey\(key\)/);
  assert.match(store, /fretlab-onboarding-complete/);
  assert.match(root, /if \(!complete\) return <Onboarding/);
  assert.match(root, /return <Today/);
});

test("Today uses a contribution graph and fretboards keep stable viewports", async () => {
  const today = await readProjectFile("app/_screens/Today.tsx");
  const css = await readProjectFile("app/globals.css");
  assert.match(today, /weekdayContributionLevels\(sessions, now\)/);
  assert.match(today, /contribution-graph/);
  assert.match(today, /Monday through Friday/);
  assert.match(css, /\.contribution-graph/);
  assert.match(css, /\.fretboard svg[\s\S]*height: 180px/);
  assert.match(css, /\.fretboard\.mini svg[\s\S]*height: 112px/);
});

test("detail routes render the entity named in the URL", async () => {
  const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const [path, expected] of [
    ["/chords/c-major", "C major"],
    ["/chords/a-minor", "A minor"],
    ["/songs/dreams", "Dreams"],
    ["/scales/blues", "Blues"],
    ["/drills/thirds", "Thirds"],
    // The runner rendered a hardcoded drill whichever routine you started, so
    // that it names the one in the URL is the whole of FL-11's first claim.
    ["/routines/runner/warm-up", "Ten minute warm-up"],
    ["/routines/runner/one-key-deep", "One key, deep"],
    // A drill id runs as a single step, so "Start this drill" starts this one.
    ["/routines/runner/thirds", "Thirds through the shape"],
  ]) {
    const text = strip(await (await render(path)).text());
    assert.ok(text.includes(expected), `${path} should name "${expected}"`);
  }
});

test("the runner opens each routine on its own first drill", async () => {
  const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  // Every routine used to open on "Position one, up and back".
  const warm = strip(await (await render("/routines/runner/warm-up")).text());
  assert.ok(warm.includes("Open string check"), "warm-up opened on the wrong drill");
  const deep = strip(await (await render("/routines/runner/one-key-deep")).text());
  assert.ok(deep.includes("Position one, up and back"), "one-key-deep opened wrong");
  assert.ok(!warm.includes("Position one, up and back"), "still the hardcoded drill");
});

test("a run that recorded nothing shows no summary figures", async () => {
  // Script and style contents are dropped first: the RSC payload embedded in
  // the page carries build hashes full of digits, and stripping tags alone
  // would let those stand in for rendered figures.
  const visible = (html) =>
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");

  // The summary shipped a 92% ring and four invented per-drill percentages
  // for a run that measured nothing and saved nothing.
  const text = visible(await (await render("/routines/summary")).text());
  assert.ok(text.includes("No finished run to show"), "summary is not empty");
  for (const invented of ["92", "96%", "88%", "84%", "Strong work"]) {
    assert.ok(!text.includes(invented), `summary still shows "${invented}"`);
  }
});

/**
 * The Today screen threw a hydration mismatch: the server rendered a week of
 * day labels beginning "S" and the browser rendered one beginning "M".
 *
 * `weekMinutes()` defaulted its `now` to `Date.now()`, so it was read during
 * render — and the seven labels come from the clock alone, with or without any
 * sessions, so the chart disagreed even on a brand-new account. The server has
 * neither the user's clock nor their timezone, so the only correct answer is
 * not to render it there at all.
 */
test("nothing clock-derived is server-rendered on Today", async () => {
  const html = await (await render("/")).text();
  const visible = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");

  assert.ok(!/week-chart/.test(visible), "the week chart server-rendered");
  assert.ok(!/This week/.test(visible), "the week section server-rendered");
  // The greeting has always waited for a client clock; it still must.
  for (const greeting of ["Good morning", "Good afternoon", "Good evening"]) {
    assert.ok(!visible.includes(greeting), `"${greeting}" server-rendered`);
  }
});

/**
 * FL-15. The tuner is the one screen whose main job is usually *not* running:
 * it is waiting for permission, being refused it, or finding no microphone.
 * §7 wants each of those to be a state with a way out, so the screen has to
 * render usefully before any microphone exists — including on the server,
 * where one never will.
 */
test("the tuner is useful before the microphone is", async () => {
  const visible = (html) =>
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");

  const text = visible(await (await render("/tuner")).text());

  // It says what it is about to do with the microphone before asking.
  assert.match(text, /Turn on the microphone/);
  assert.match(text, /Nothing is recorded or sent anywhere/);

  // And the reference pitches are there whether or not it can ever listen,
  // because that is the whole feature when there is no microphone to be had.
  for (const [name, hz] of [
    ["E", "82.41"],
    ["A", "110.00"],
    ["D", "146.83"],
    ["G", "196.00"],
    ["B", "246.94"],
    ["E", "329.63"],
  ]) {
    assert.ok(text.includes(hz), `the ${name} string's pitch is missing`);
  }
});

test("the tuner's every state names a way out", async () => {
  const source = await readProjectFile("app/_screens/Tuner.tsx");
  // Permission refused and no microphone are different problems. Collapsing
  // them into one message leaves half the readers with no way forward.
  for (const state of ["denied", "unavailable", "unsupported", "requesting"]) {
    assert.ok(source.includes(`"${state}"`), `no branch for ${state}`);
  }
  assert.ok(
    !/tone="error"/.test(source),
    "a refused permission is a state, not an error",
  );
});

test("screens handle the loading state §1 requires", async () => {
  const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  // These two screens own data, so their first paint is a loading state rather
  // than an empty shell or fabricated numbers.
  assert.match(strip(await (await render("/progress")).text()), /Loading your practice history/);
  assert.match(strip(await (await render("/signin")).text()), /Checking your session/);
});
