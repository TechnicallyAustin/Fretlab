/** §2 `POST /api/v1/auth/password/reset` — request a reset link. */
import { route, readJson } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { notFound } from "@/lib/http/errors";
import { isLocalMode } from "@/lib/auth/mode";
import { findByEmail } from "@/lib/auth/users";
import { issueAuthToken } from "@/lib/auth/tokens";
import { requireEmail } from "@/lib/api/validate";

export const POST = route(async (context) => {
  if (!isLocalMode()) {
    throw notFound("Passwords are managed by your identity provider. Reset it there.");
  }

  const body = await readJson<Record<string, unknown>>(context.request);
  const email = requireEmail(body.email);
  const user = await findByEmail(email);

  if (user) await issueAuthToken(user.id, "password_reset");

  // Always the same response, so this cannot be used to enumerate accounts.
  return ok(
    { message: "If that email has an account, a reset link is on its way." },
    context.requestId,
  );
});
