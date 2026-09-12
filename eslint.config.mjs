import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

/**
 * App Template Contract v1 §5 — "Three levels, enforced by lint rules rather
 * than discipline."
 *
 * The contract's directory shape is written for a Vite SPA (`src/pages/...`).
 * On the App Router the same three levels are spelled:
 *
 *   L1 page     app/_screens/*                    owns data and layout
 *   L2 section  app/_sections/*                   composes L3, never fetches
 *   L3 element  components/*                      pure presentation
 *
 * `_`-prefixed folders are App Router private folders, so L2 and L3 live under
 * app/ without becoming routes.
 *
 * Dependency direction (§5):
 *   L1 -> L2 -> L3
 *   L1 -> lib/*
 *   L2 -> L3 only
 *   L3 -> L3 only
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "db/**/*.ts"],
    plugins: { boundaries },
    settings: {
      // Element patterns match FOLDERS, not files. First match wins, so the
      // more specific paths come first.
      "boundaries/elements": [
        { type: "api", pattern: "app/api/**" },
        { type: "l2-section", pattern: "app/_sections" },
        { type: "l1-page", pattern: "app/_screens" },
        { type: "l3-element", pattern: "components/**" },
        { type: "lib-server", pattern: "lib/api" },
        { type: "lib-server", pattern: "lib/auth" },
        { type: "lib-server", pattern: "lib/http" },
        { type: "lib-server", pattern: "db" },
        { type: "lib-domain", pattern: "lib/fretlab" },
        // Route bindings live in the app/ route folders. Listed last so the
        // specific folders above win, and so no file escapes classification.
        { type: "l1-page", pattern: "app/**" },
        { type: "l1-page", pattern: "app" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            // L1 owns data and composes everything below it.
            {
              from: { element: { type: "l1-page" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["l1-page", "l2-section", "l3-element", "lib-domain", "lib-server"] },
                  },
                },
              },
            },
            // L2 composes L3 and may use pure domain helpers. It never fetches.
            {
              from: { element: { type: "l2-section" } },
              allow: {
                to: { element: { types: { anyOf: ["l2-section", "l3-element", "lib-domain"] } } },
              },
            },
            // L3 is pure presentation. Importing the API client, the auth
            // store, or anything from L1/L2 fails the build.
            {
              from: { element: { type: "l3-element" } },
              allow: {
                to: { element: { types: { anyOf: ["l3-element", "lib-domain"] } } },
              },
            },
            // Server code may use the server libraries.
            {
              from: { element: { type: "api" } },
              allow: { to: { element: { types: { anyOf: ["api", "lib-server", "lib-domain"] } } } },
            },
            {
              from: { element: { type: "lib-server" } },
              allow: { to: { element: { types: { anyOf: ["lib-server", "lib-domain"] } } } },
            },
            // The domain layer depends on nothing but itself.
            {
              from: { element: { type: "lib-domain" } },
              allow: { to: { element: { type: "lib-domain" } } },
            },
            // §5: "L2 and L3 never read the router."
            {
              from: { element: { types: { anyOf: ["l2-section", "l3-element"] } } },
              disallow: {
                to: {
                  module: {
                    origin: "external",
                    source: { anyOf: ["next/navigation", "next/router", "next/headers"] },
                  },
                },
              },
              message:
                "§5: L2 and L3 never read the router. Pass what you need down as a prop.",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    "tests/**",
    "scripts/**",
  ]),
]);

export default eslintConfig;
