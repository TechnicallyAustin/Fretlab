/**
 * App Template Contract v1 §2 — `AUTH_MODE` selects the implementation.
 * The frontend never learns which one is running.
 *
 *   AUTH_MODE=local   backend-issued session, no external IdP  (portable default)
 *   AUTH_MODE=oidc    Authentik, Authorization Code + PKCE
 *
 * §2: "A template that hard-requires Authentik cannot be handed to anyone,
 * demoed off the network, or run in CI."
 */
import { env } from "cloudflare:workers";

export type AuthMode = "local" | "oidc";

export function authMode(): AuthMode {
  return env.AUTH_MODE === "oidc" ? "oidc" : "local";
}

export function isLocalMode(): boolean {
  return authMode() === "local";
}

export function appUrl(request: Request): string {
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, "");
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${protocol}://${host}`;
}
