/**
 * §1 Identity: password reset request/completion and email verification.
 *
 * Tokens are single-use, time-boxed, and stored only as SHA-256 hashes.
 *
 * Delivery is a seam. FretLab has no mail provider configured, so `deliver`
 * writes the link to the structured log and the README documents how to read
 * it in development. Swapping in a real provider means changing this one
 * function; nothing else in the auth flow moves.
 */
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { authTokens } from "@/db/schema";
import { nowIso, secureToken, ulid } from "@/lib/http/id";
import { hashToken } from "./crypto";

type Purpose = "password_reset" | "email_verify";

const TTL_MINUTES: Record<Purpose, number> = {
  password_reset: 60,
  email_verify: 60 * 24 * 7,
};

export async function issueAuthToken(userId: string, purpose: Purpose): Promise<string> {
  const db = getDb();

  // Only one live token per purpose, so an earlier email cannot still be used.
  await db
    .update(authTokens)
    .set({ consumedAt: nowIso() })
    .where(
      and(
        eq(authTokens.userId, userId),
        eq(authTokens.purpose, purpose),
        isNull(authTokens.consumedAt),
      ),
    );

  const token = secureToken();
  await db.insert(authTokens).values({
    id: ulid(),
    userId,
    purpose,
    tokenHash: await hashToken(token),
    expiresAt: new Date(Date.now() + TTL_MINUTES[purpose] * 60 * 1000).toISOString(),
  });

  deliver(purpose, token);
  return token;
}

/** Returns the user id the token belongs to, and burns it. */
export async function consumeAuthToken(token: string, purpose: Purpose): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, await hashToken(token)),
        eq(authTokens.purpose, purpose),
        isNull(authTokens.consumedAt),
      ),
    )
    .limit(1);

  if (!row || row.expiresAt <= nowIso()) return null;

  await db.update(authTokens).set({ consumedAt: nowIso() }).where(eq(authTokens.id, row.id));
  return row.userId;
}

function deliver(purpose: Purpose, token: string): void {
  const path =
    purpose === "email_verify" ? `/api/v1/auth/verify/${token}` : `/reset-password?token=${token}`;
  console.info(JSON.stringify({ event: "auth_token_issued", purpose, path }));
}
