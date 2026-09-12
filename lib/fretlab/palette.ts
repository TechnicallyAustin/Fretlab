/**
 * The key-colour system. One hue per key, shared by every practice surface.
 *
 * App Template Contract v1 §5: this is domain logic, not presentation. It sits
 * under lib/ so L2 sections and L3 elements can use it without importing from
 * a page, and so the boundary lint has somewhere legal to point.
 */
import type { KeyName } from "./types";
import { FIFTHS } from "./theory";

export function keyHue(key: KeyName) {
  return (289 + FIFTHS.indexOf(key) * 30) % 360;
}
export function palette(key: KeyName) {
  const h = keyHue(key);
  return {
    key,
    h,
    bright: `oklch(0.58 0.155 ${h})`,
    ink: `oklch(0.44 0.145 ${h})`,
    fill: `oklch(0.935 0.032 ${h})`,
    fill2: `oklch(0.885 0.055 ${h})`,
    edge: `oklch(0.79 0.07 ${h})`,
    glow: `oklch(0.9 0.05 ${h})`,
    dim: `oklch(0.965 0.016 ${h})`,
  };
}
export function cssVars(key: KeyName) {
  const p = palette(key);
  return {
    "--key-bright": p.bright,
    "--key-ink": p.ink,
    "--key-fill": p.fill,
    "--key-fill-2": p.fill2,
    "--key-edge": p.edge,
    "--key-glow": p.glow,
    "--key-dim": p.dim,
  } as React.CSSProperties;
}
