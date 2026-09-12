/**
 * User lookup and provisioning, shared by both §2 auth modes so that a local
 * account and an Authentik-backed account land in the same table with the same
 * resolved role.
 */
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { users, type Role, type User } from "@/db/schema";
import { nowIso, ulid } from "@/lib/http/id";
import { conflict } from "@/lib/http/errors";
import { hashPassword } from "./crypto";
import type { OidcProfile } from "./oidc";

export async function findByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function findById(id: string): Promise<User | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  return row ?? null;
}

/** §2 local mode registration. The first account to register becomes the owner. */
export async function createLocalUser(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const db = getDb();
  if (await findByEmail(email)) {
    throw conflict("An account already exists for that email. Sign in instead.", "email");
  }

  const [firstExisting] = await db.select({ id: users.id }).from(users).limit(1);
  const role: Role = firstExisting ? "member" : "owner";

  const [row] = await db
    .insert(users)
    .values({
      id: ulid(),
      email: email.toLowerCase(),
      displayName,
      passwordHash: await hashPassword(password),
      role,
    })
    .returning();

  return row;
}

/**
 * §2 oidc mode. Matched on the OIDC subject first so an email change at the IdP
 * does not orphan the account; falls back to email for first-time linking.
 */
export async function upsertOidcUser(profile: OidcProfile): Promise<User> {
  const db = getDb();

  const [bySubject] = await db
    .select()
    .from(users)
    .where(eq(users.externalId, profile.subject))
    .limit(1);

  const existing = bySubject ?? (await findByEmail(profile.email));

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        email: profile.email,
        displayName: profile.displayName,
        externalId: profile.subject,
        role: profile.role,
        emailVerifiedAt: profile.emailVerified ? (existing.emailVerifiedAt ?? nowIso()) : null,
        updatedAt: nowIso(),
        deletedAt: null,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [row] = await db
    .insert(users)
    .values({
      id: ulid(),
      email: profile.email,
      displayName: profile.displayName,
      externalId: profile.subject,
      role: profile.role,
      emailVerifiedAt: profile.emailVerified ? nowIso() : null,
    })
    .returning();

  return row;
}
