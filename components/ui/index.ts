/**
 * The FretLab UI kit, vendored.
 *
 * App Template Contract v1 §5 — L3 elements. Pure presentation, props in and
 * events out, and they may not import the API client, the auth store, the
 * router, or anything from L1 or L2.
 *
 * Two things are deliberately different from the kit as delivered:
 *
 * **The fretboard is ours.** `./fretboard` keeps the kit's `Marker` prop shape
 * but draws with `components/fretlab/Fretboard`, which carries the type-sizing,
 * windowing, fingering, tuning and keyboard work the kit's renderer has no
 * equivalent for. Cards get all of that without knowing.
 *
 * **The tokens are additive.** Every kit token is `--fl-` prefixed and no kit
 * class name collides with an existing one, so this sits alongside
 * `app/globals.css` rather than replacing it, and screens can move across one
 * at a time.
 */
export * from "./primitives";
export * from "./adapt";
export * from "./shell";
export * from "./hero";
export * from "./cards";
export * from "./practice";
export * from "./progress";
export * from "./keys";
export * from "./media";
export * from "./fretboard";
