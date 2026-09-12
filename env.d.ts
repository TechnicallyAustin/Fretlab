/**
 * Cloudflare bindings for this Worker.
 *
 * `d1`/`r2` in `.openai/hosting.json` decide which of these the vite plugin
 * actually creates; see vite.config.ts. Keep the names in sync with that file.
 */
declare namespace Cloudflare {
  interface Env {
    /** D1 binding. Enabled by `"d1": "DB"` in .openai/hosting.json. */
    DB: D1Database;
    /** R2 binding for §1 Files. Enabled by `"r2": "R2"` in .openai/hosting.json. */
    R2: R2Bucket;
    ASSETS: Fetcher;

    /** App Template Contract §2. `local` is the portable default. */
    AUTH_MODE?: "local" | "oidc";
    /** Secret used to sign session and refresh tokens in local mode. */
    AUTH_SECRET?: string;
    APP_URL?: string;

    /** §2 oidc mode. Unused when AUTH_MODE=local. */
    OIDC_ISSUER?: string;
    OIDC_CLIENT_ID?: string;
    OIDC_CLIENT_SECRET?: string;
  }
}

declare module "cloudflare:workers" {
  export const env: Cloudflare.Env;
}
