/**
 * The single entry point every /api/v1 route is wrapped in, so §3 holds
 * everywhere by construction rather than by discipline:
 *
 *   - every response carries `X-Request-Id`
 *   - every failure is the §3 error envelope, with no exceptions
 *   - every mutating request carries `Idempotency-Key`, and a replay of the
 *     same key returns the original response instead of acting twice
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { idempotencyKeys, type Role, type User } from "@/db/schema";
import { ApiError, malformed, unauthenticated, unauthorized } from "./errors";
import { failure } from "./respond";
import { ulid } from "./id";
import { hasRole, resolveSession, type ResolvedSession } from "@/lib/auth/session";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type Context = {
  request: Request;
  url: URL;
  requestId: string;
  /** Present only inside `authed`/`roleGuarded` handlers. */
  session: ResolvedSession | null;
};

export type Handler = (context: Context) => Promise<Response>;

/**
 * §3 idempotency. Anonymous callers are keyed by IP so an unauthenticated
 * register/reset replay is also caught.
 */
function idempotencyOwner(context: Context): string {
  if (context.session) return context.session.user.id;
  return (
    context.request.headers.get("cf-connecting-ip") ??
    context.request.headers.get("x-forwarded-for") ??
    "anonymous"
  );
}

async function replayOrRun(context: Context, handler: Handler): Promise<Response> {
  const key = context.request.headers.get("idempotency-key");
  if (!key) {
    throw malformed(
      "This request needs an Idempotency-Key header. Send a unique value per attempt.",
      "idempotency_key",
    );
  }

  const db = getDb();
  const owner = idempotencyOwner(context);
  const path = context.url.pathname;
  const method = context.request.method;

  const [existing] = await db
    .select()
    .from(idempotencyKeys)
    .where(and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.userId, owner)))
    .limit(1);

  if (existing) {
    if (existing.method !== method || existing.path !== path) {
      throw new ApiError(
        "conflict",
        "That Idempotency-Key was already used for a different request. Send a new one.",
        "idempotency_key",
      );
    }
    return new Response(existing.statusCode === 204 ? null : existing.responseBody, {
      status: existing.statusCode,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "x-request-id": context.requestId,
        "idempotent-replay": "true",
      },
    });
  }

  const response = await handler(context);

  // Only successful mutations are worth replaying; a failure should be retryable.
  if (response.status < 400) {
    const body = response.status === 204 ? "" : await response.clone().text();
    await db
      .insert(idempotencyKeys)
      .values({ key, userId: owner, method, path, statusCode: response.status, responseBody: body })
      .onConflictDoNothing();
  }

  return response;
}

type RouteOptions = {
  /** Require a signed-in user (§1 protected routes). */
  auth?: boolean;
  /** Require at least this role (§1 role-gated routes, §2 resolved role). */
  role?: Role;
  /** Opt out of §3 idempotency for mutations that are already naturally idempotent. */
  idempotent?: boolean;
};

export function route(handler: Handler, options: RouteOptions = {}) {
  return async (request: Request): Promise<Response> => {
    const requestId = ulid();
    const url = new URL(request.url);
    const context: Context = { request, url, requestId, session: null };

    try {
      if (options.auth || options.role) {
        const session = await resolveSession(request);
        if (!session) throw unauthenticated();
        if (options.role && !hasRole(session.user, options.role)) throw unauthorized();
        context.session = session;
      } else {
        // Still resolve when present, so handlers can vary on sign-in state.
        context.session = await resolveSession(request).catch(() => null);
      }

      if (MUTATING.has(request.method) && options.idempotent !== false) {
        return await replayOrRun(context, handler);
      }

      return await handler(context);
    } catch (error) {
      if (error instanceof ApiError) return failure(error, requestId);

      // Unknown failures never leak internals; §3 requires the same envelope
      // and the request id is what ties this to the server log line.
      console.error(`[${requestId}] ${request.method} ${url.pathname}`, error);
      return failure(
        new ApiError("internal_error", "Something failed on our side. Try again in a moment."),
        requestId,
      );
    }
  };
}

/** Narrows `context.session` for handlers declared with `auth: true`. */
export function requireUser(context: Context): User {
  if (!context.session) throw unauthenticated();
  return context.session.user;
}

export async function readJson<T>(request: Request): Promise<T> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw malformed("Send this request as application/json.");
  }
  try {
    return (await request.json()) as T;
  } catch {
    throw malformed("The request body is not valid JSON.");
  }
}
