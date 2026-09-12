/** §2 `POST /api/v1/auth/password/reset/confirm` — complete the reset. */
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { route, readJson } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { notFound, validationFailed } from "@/lib/http/errors";
import { isLocalMode } from "@/lib/auth/mode";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/crypto";
import { revokeAllSessions } from "@/lib/auth/session";
import { requirePassword, requireString } from "@/lib/api/validate";
import { nowIso } from "@/lib/http/id";

export const POST = route(async (context) => {
  if (!isLocalMode()) {
    throw notFound("Passwords are managed by your identity provider. Reset it there.");
  }

  const body = await readJson<Record<string, unknown>>(context.request);
  const token = requireString(body.token, "token", 128);
  const password = requirePassword(body.password);

  const userId = await consumeAuthToken(token, "password_reset");
  if (!userId) {
    throw validationFailed("That reset link expired or was already used. Request a new one.", "token");
  }

  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: nowIso() })
    .where(eq(users.id, userId));

  // A password change invalidates every existing session, including the one
  // that requested the reset.
  await revokeAllSessions(userId);

  return ok({ message: "Password changed. Sign in with your new password." }, context.requestId);
});
