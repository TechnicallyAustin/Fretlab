/**
 * §2 `POST /api/v1/auth/login`
 *   local: credentials.
 *   oidc:  returns authorize URL.
 *
 * The frontend calls the same endpoint in both modes and follows
 * `authorize_url` when one comes back, so it never learns which mode is running.
 */
import { route, readJson } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { unauthenticated, validationFailed } from "@/lib/http/errors";
import { userToWire } from "@/lib/api/serialize";
import { authMode, appUrl } from "@/lib/auth/mode";
import { authorizeUrl, createPkce, OIDC_STATE_COOKIE } from "@/lib/auth/oidc";
import { createSession, sessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/crypto";
import { findByEmail } from "@/lib/auth/users";
import { secureToken } from "@/lib/http/id";

export const POST = route(async (context) => {
  const redirectUri = `${appUrl(context.request)}/api/v1/auth/callback`;

  if (authMode() === "oidc") {
    const state = secureToken(16);
    const { verifier, challenge } = await createPkce();
    const url = await authorizeUrl(redirectUri, state, challenge);

    // The verifier and state never reach the page; §2 keeps the browser out of
    // the token exchange entirely.
    const cookie = `${OIDC_STATE_COOKIE}=${state}.${verifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`;
    return ok({ authorize_url: url }, context.requestId, { "set-cookie": cookie });
  }

  const body = await readJson<{ email?: unknown; password?: unknown }>(context.request);
  if (typeof body.email !== "string" || typeof body.password !== "string") {
    throw validationFailed("Enter your email and password.", "email");
  }

  const user = await findByEmail(body.email);
  const valid = await verifyPassword(body.password, user?.passwordHash ?? null);

  // One message for both branches so the response cannot enumerate accounts.
  if (!user || !valid) {
    throw unauthenticated("That email and password do not match. Check both and try again.");
  }

  const value = await createSession(user.id, context.request);
  return ok({ user: userToWire(user) }, context.requestId, { "set-cookie": sessionCookie(value) });
});
