/** §2 `POST /api/v1/auth/register` -> local only, 404 under oidc. */
import { route, readJson } from "@/lib/http/handler";
import { created } from "@/lib/http/respond";
import { notFound } from "@/lib/http/errors";
import { userToWire } from "@/lib/api/serialize";
import { isLocalMode } from "@/lib/auth/mode";
import { createSession, sessionCookie } from "@/lib/auth/session";
import { createLocalUser } from "@/lib/auth/users";
import { issueAuthToken } from "@/lib/auth/tokens";
import { requireEmail, requirePassword, requireString } from "@/lib/api/validate";

export const POST = route(async (context) => {
  if (!isLocalMode()) {
    throw notFound("Accounts are managed by your identity provider. Use Sign in.");
  }

  const body = await readJson<Record<string, unknown>>(context.request);
  const email = requireEmail(body.email);
  const password = requirePassword(body.password);
  const displayName = requireString(body.display_name, "display_name", 64);

  const user = await createLocalUser(email, password, displayName);

  // §1 Identity: email verification. The token is logged rather than mailed
  // until a mail provider is configured; see README.
  await issueAuthToken(user.id, "email_verify");

  const value = await createSession(user.id, context.request);
  return created({ user: userToWire(user) }, context.requestId, {
    "set-cookie": sessionCookie(value),
  });
});
