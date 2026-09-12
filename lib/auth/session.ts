/**
 * App Template Contract v1 §2 — token handling on web.
 *
 * "The backend is the confidential client. Access and refresh tokens stay
 * server side; the browser holds an httpOnly, SameSite=Lax session cookie.
 * No tokens in `localStorage`, ever."
 *
 * The cookie carries an opaque `<session_id>.<secret>` pair. Only the SHA-256
 * of that pair is stored, in `sessions.refresh_token_hash`, so the database
 * never holds anything replayable as a login.
 */
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users, type Role, type User } from "@/db/schema";
import { nowIso, secureToken, ulid } from "@/lib/http/id";
import { hashToken } from "./crypto";

export const SESSION_COOKIE = "fretlab_session";

/** Refresh window. §1 requires silent refresh on expiry, rotated on each use. */
const SESSION_TTL_DAYS = 30;

export type ResolvedSession = { user: User; sessionId: string };

function expiryIso(days = SESSION_TTL_DAYS): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function cookieAttributes(maxAgeSeconds: number): string {
  // Secure is omitted on localhost so `npm run dev` works over http; every
  // other host gets it. SameSite=Lax per §2.
  const parts = [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
    `Secure`,
  ];
  return parts.join("; ");
}

export function sessionCookie(value: string): string {
  return `${SESSION_COOKIE}=${value}; ${cookieAttributes(SESSION_TTL_DAYS * 24 * 60 * 60)}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; ${cookieAttributes(0)}`;
}

export function readSessionCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=") || null;
  }
  return null;
}

/** Issues a new session row and returns the cookie value to hand the browser. */
export async function createSession(
  userId: string,
  request: Request,
): Promise<string> {
  const db = getDb();
  const sessionId = ulid();
  const secret = secureToken();
  const value = `${sessionId}.${secret}`;

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    refreshTokenHash: await hashToken(value),
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for"),
    expiresAt: expiryIso(),
  });

  return value;
}

/** Resolves the cookie to a live user, or null. Expired and revoked rows miss. */
export async function resolveSession(request: Request): Promise<ResolvedSession | null> {
  const value = readSessionCookie(request);
  if (!value) return null;

  const db = getDb();
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.refreshTokenHash, await hashToken(value)), isNull(sessions.revokedAt)))
    .limit(1);

  if (!row) return null;
  if (row.session.expiresAt <= nowIso()) return null;
  if (row.user.deletedAt) return null;

  return { user: row.user, sessionId: row.session.id };
}

/**
 * §2 `POST /auth/refresh` — "rotates, both modes". The old hash is replaced, so
 * a stolen cookie stops working the moment the real client refreshes.
 */
export async function rotateSession(request: Request): Promise<string | null> {
  const existing = await resolveSession(request);
  if (!existing) return null;

  const db = getDb();
  const secret = secureToken();
  const value = `${existing.sessionId}.${secret}`;

  await db
    .update(sessions)
    .set({ refreshTokenHash: await hashToken(value), expiresAt: expiryIso() })
    .where(eq(sessions.id, existing.sessionId));

  return value;
}

export async function revokeSession(sessionId: string): Promise<void> {
  const db = getDb();
  await db.update(sessions).set({ revokedAt: nowIso() }).where(eq(sessions.id, sessionId));
}

export async function revokeAllSessions(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(sessions)
    .set({ revokedAt: nowIso() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/** §2 Roles. Route guards read the resolved role, never the raw claim. */
export const ROLE_RANK: Record<Role, number> = { member: 0, admin: 1, owner: 2 };

export function hasRole(user: User, required: Role): boolean {
  return ROLE_RANK[user.role] >= ROLE_RANK[required];
}
