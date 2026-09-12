/**
 * Text has to be readable against what it sits on.
 *
 * Nothing checked this before, and both secondary text tiers failed WCAG AA on
 * the paper palette: `--quiet` was **3.64:1** on a sunken panel against a
 * 4.5:1 requirement, and `--muted` 4.22:1. Between them they colour 173 rules —
 * captions, legends, fret numbers, state notices — so most of the app's
 * secondary copy was under the bar in both themes.
 *
 * The sibling rule, `text is readable: rem type stays at or above the 13px
 * caption floor`, guards the *size* of that text. This guards its contrast.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readProjectFile } from "./helpers/sources.mjs";

/** WCAG 2.1 relative luminance, sRGB. */
function luminance([r, g, b]) {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const rgb = (hexValue) => {
  const h = hexValue.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/** Pull a token's hex value out of a block of CSS. */
function token(css, block, name) {
  const start = css.indexOf(block);
  assert.ok(start >= 0, `no ${block} block in the stylesheet`);
  const window = css.slice(start, start + 1400);
  const match = window.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  assert.ok(match, `${block} does not define --${name} as a hex value`);
  return match[1];
}

const AA = 4.5;

test("secondary text meets WCAG AA on every surface it sits on", async () => {
  const css = await readProjectFile("app/globals.css");

  const themes = [
    { name: "light", block: ":root {" },
    { name: "dark", block: ".theme-dark," },
  ];

  for (const theme of themes) {
    const surfaces = ["paper", "card", "sunken"].map((name) => ({
      name,
      value: token(css, theme.block, name),
    }));
    for (const text of ["ink", "muted", "quiet"]) {
      const colour = token(css, theme.block, text);
      for (const surface of surfaces) {
        const ratio = contrast(rgb(colour), rgb(surface.value));
        assert.ok(
          ratio >= AA,
          `${theme.name}: --${text} (${colour}) on --${surface.name} (${surface.value}) is ${ratio.toFixed(2)}:1, needs ${AA}`,
        );
      }
    }
  }
});

test("the two secondary tiers stay visibly different", async () => {
  // Raising both to clear AA is easy; doing it without collapsing them into one
  // grey is the part worth guarding. `muted` is the more prominent tier.
  const css = await readProjectFile("app/globals.css");
  for (const block of [":root {", ".theme-dark,"]) {
    const muted = rgb(token(css, block, "muted"));
    const quiet = rgb(token(css, block, "quiet"));
    const ratio = contrast(muted, quiet);
    assert.ok(
      ratio >= 1.15,
      `${block} muted and quiet are ${ratio.toFixed(2)}:1 apart — one tier, not two`,
    );
  }
});

test("the light theme and the system default agree", async () => {
  // The light palette is written twice: once on :root and once inline in the
  // .theme-system override. They drifted apart once already.
  const css = await readProjectFile("app/globals.css");
  // `.theme-system` appears twice, and both blocks set --paper: once sharing
  // the dark block's selector list, once inside the light media query. Scope
  // to the query, or this reads the dark palette and compares it to the light.
  const lightQuery = css.match(/@media \(prefers-color-scheme: light\) \{([\s\S]*?)\n\}/);
  assert.ok(lightQuery, "no prefers-color-scheme: light query");
  const system = lightQuery[1].match(/\.theme-system\s*\{([^}]*)\}/);
  assert.ok(system, "no .theme-system override inside the light query");
  for (const name of ["ink", "muted", "quiet", "paper", "card", "sunken"]) {
    const root = token(css, ":root {", name);
    const override = system[1].match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
    assert.ok(override, `.theme-system does not set --${name}`);
    assert.equal(
      override[1].toLowerCase(),
      root.toLowerCase(),
      `--${name} differs between :root and .theme-system`,
    );
  }
});

test("every step of the activity graph is visible against the one below", async () => {
  // The ramp was 24/45/68/100, which left 1.11:1 between "no practice" and
  // "some practice": the lowest signal the graph exists to show could not be
  // seen. Checked across all twelve key hues, since the fill is key-coloured.
  const css = await readProjectFile("app/globals.css");
  // Every ramp in the stylesheet, not the first: the activity graph on Today
  // and the 26-week consistency graph on Progress each define their own, and
  // they were both wrong in the same way. A test that checked one would have
  // left the other invisible.
  const found = [...css.matchAll(
    /\.level-(\d)[^{]*\{\s*background: color-mix\(in srgb, var\(--key-bright\) (\d+)%/g,
  )];
  assert.ok(found.length >= 6, `expected two ramps of three, found ${found.length}`);
  const mixes = {};
  for (const [, level, percent] of found) {
    const value = Number(percent);
    if (mixes[level] !== undefined) {
      assert.equal(mixes[level], value, `level ${level} uses two different mixes`);
    }
    mixes[level] = value;
  }
  assert.deepEqual(Object.keys(mixes).sort(), ["1", "2", "3"], "expected three mixed levels");

  const oklchToRgb = (L, C, H) => {
    const h = (H * Math.PI) / 180;
    const a = C * Math.cos(h);
    const b = C * Math.sin(h);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
    const out = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
    return out.map((c) => {
      const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
      return Math.max(0, Math.min(1, v)) * 255;
    });
  };

  const card = rgb(token(css, ":root {", "card"));
  const sunken = rgb(token(css, ":root {", "sunken"));

  for (let index = 0; index < 12; index += 1) {
    const hue = (289 + index * 30) % 360;
    const bright = oklchToRgb(0.58, 0.155, hue);
    const blend = (p) => bright.map((v, i) => v * p + card[i] * (1 - p));
    const levels = [sunken, blend(mixes[1] / 100), blend(mixes[2] / 100), blend(mixes[3] / 100), bright];
    for (let step = 1; step < levels.length; step += 1) {
      const ratio = contrast(levels[step], levels[step - 1]);
      assert.ok(
        ratio >= 1.25,
        `hue ${hue}: level ${step - 1} to ${step} is ${ratio.toFixed(2)}:1 — the step cannot be seen`,
      );
    }
  }
});
