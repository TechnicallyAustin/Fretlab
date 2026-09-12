/** §1 Account: read own profile, update own profile, delete account. */
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { route, readJson, requireUser } from "@/lib/http/handler";
import { noContent, ok } from "@/lib/http/respond";
import { conflict, validationFailed } from "@/lib/http/errors";
import { userToWire } from "@/lib/api/serialize";
import { optionalString } from "@/lib/api/validate";
import { requireEmail } from "@/lib/api/validate";
import { findByEmail } from "@/lib/auth/users";
import { clearedSessionCookie, revokeAllSessions } from "@/lib/auth/session";
import { isLocalMode } from "@/lib/auth/mode";
import { nowIso } from "@/lib/http/id";

export const GET = route(
  async (context) => ok({ data: userToWire(requireUser(context)) }, context.requestId),
  { auth: true },
);

export const PATCH = route(
  async (context) => {
    const user = requireUser(context);
    const body = await readJson<Record<string, unknown>>(context.request);

    const displayName = optionalString(body.display_name, "display_name", 64);
    if (displayName !== undefined && displayName.length === 0) {
      throw validationFailed("Display name cannot be empty.", "display_name");
    }

    const patch: Partial<typeof users.$inferInsert> = { updatedAt: nowIso() };
    if (displayName !== undefined) patch.displayName = displayName;

    // Email is owned by the IdP under oidc; only local accounts may change it.
    if (body.email !== undefined && isLocalMode()) {
      const email = requireEmail(body.email);
      if (email !== user.email) {
        const taken = await findByEmail(email);
        if (taken) throw conflict("That email is already in use.", "email");
        patch.email = email;
        // A new address is unverified until it is confirmed.
        patch.emailVerifiedAt = null;
      }
    }

    const db = getDb();
    const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
    return ok({ data: userToWire(updated) }, context.requestId);
  },
  { auth: true },
);

/** §4: soft delete via `deleted_at` on User. Sessions are revoked immediately. */
export const DELETE = route(
  async (context) => {
    const user = requireUser(context);
    const db = getDb();

    await db
      .update(users)
      .set({ deletedAt: nowIso(), updatedAt: nowIso() })
      .where(eq(users.id, user.id));
    await revokeAllSessions(user.id);

    return noContent(context.requestId, { "set-cookie": clearedSessionCookie() });
  },
  { auth: true },
);
