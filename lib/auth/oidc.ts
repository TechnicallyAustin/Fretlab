/**
 * App Template Contract v1 §2 — oidc mode.
 *
 * Authorization Code + PKCE against Authentik. The backend is the confidential
 * client: the code exchange happens here and the resulting tokens never leave
 * the server. The browser only ever receives the §2 session cookie.
 */
import { env } from "cloudflare:workers";
import { secureToken } from "@/lib/http/id";
import { malformed, unauthenticated } from "@/lib/http/errors";
import type { Role } from "@/db/schema";

export const OIDC_STATE_COOKIE = "fretlab_oidc";

type Discovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint?: string;
};

let cachedDiscovery: Discovery | null = null;

function issuer(): string {
  if (!env.OIDC_ISSUER) {
    throw malformed("AUTH_MODE is oidc but OIDC_ISSUER is not set. Set it or switch to AUTH_MODE=local.");
  }
  return env.OIDC_ISSUER.replace(/\/$/, "");
}

export async function discover(): Promise<Discovery> {
  if (cachedDiscovery) return cachedDiscovery;
  const response = await fetch(`${issuer()}/.well-known/openid-configuration`);
  if (!response.ok) {
    throw unauthenticated("The identity provider is unreachable. Try again shortly.");
  }
  cachedDiscovery = (await response.json()) as Discovery;
  return cachedDiscovery;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** PKCE S256 challenge. The verifier is held in an httpOnly cookie, not in the page. */
export async function createPkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = secureToken(48);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

export async function authorizeUrl(
  redirectUri: string,
  state: string,
  challenge: string,
): Promise<string> {
  const { authorization_endpoint } = await discover();
  const url = new URL(authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.OIDC_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export type OidcProfile = {
  subject: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  role: Role;
};

/** §2: "A `role` claim resolved from Authentik groups under OIDC." */
export function roleFromGroups(groups: unknown): Role {
  const list = Array.isArray(groups) ? groups.map((item) => String(item).toLowerCase()) : [];
  if (list.includes("owner") || list.includes("authentik admins")) return "owner";
  if (list.includes("admin")) return "admin";
  return "member";
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
  verifier: string,
): Promise<OidcProfile> {
  const { token_endpoint, userinfo_endpoint } = await discover();

  const tokenResponse = await fetch(token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: env.OIDC_CLIENT_ID ?? "",
      client_secret: env.OIDC_CLIENT_SECRET ?? "",
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) {
    throw unauthenticated("Sign-in could not be completed. Start again from the sign-in screen.");
  }

  const tokens = (await tokenResponse.json()) as { access_token: string };
  const userinfoResponse = await fetch(userinfo_endpoint, {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userinfoResponse.ok) {
    throw unauthenticated("The identity provider did not return a profile. Start again from the sign-in screen.");
  }

  const claims = (await userinfoResponse.json()) as Record<string, unknown>;
  const email = String(claims.email ?? "");
  if (!email) {
    throw unauthenticated("The identity provider did not return an email address. Ask an owner to add one to your account.");
  }

  return {
    subject: String(claims.sub),
    email: email.toLowerCase(),
    displayName: String(claims.name ?? claims.preferred_username ?? email.split("@")[0]),
    emailVerified: claims.email_verified !== false,
    role: roleFromGroups(claims.groups),
  };
}

export async function endSessionUrl(redirectTo: string): Promise<string | null> {
  const { end_session_endpoint } = await discover();
  if (!end_session_endpoint) return null;
  const url = new URL(end_session_endpoint);
  url.searchParams.set("post_logout_redirect_uri", redirectTo);
  return url.toString();
}
