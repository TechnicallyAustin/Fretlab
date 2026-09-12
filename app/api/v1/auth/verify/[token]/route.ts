/** §2 `GET /api/v1/auth/verify/:token` — complete email verification. */
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { route } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { notFound, validationFailed } from "@/lib/http/errors";
import { isLocalMode } from "@/lib/auth/mode";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { nowIso } from "@/lib/http/id";

export const GET = route(async (context) => {
  if (!isLocalMode()) {
    throw notFound("Email verification is handled by your identity provider.");
  }

  const token = context.url.pathname.split("/").pop() ?? "";
  const userId = await consumeAuthToken(token, "email_verify");
  if (!userId) {
    throw validationFailed("That verification link expired or was already used. Request a new one.", "token");
  }

  const db = getDb();
  await db
    .update(users)
    .set({ emailVerifiedAt: nowIso(), updatedAt: nowIso() })
    .where(eq(users.id, userId));

  return ok({ message: "Email verified." }, context.requestId);
});
