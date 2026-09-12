"use client";

/**
 * The typed API client.
 *
 * §5 names this explicitly as something L3 may never import; the boundary lint
 * enforces that, because `lib/api` is classified as server-tier.
 *
 * It speaks the §3 wire format: the session cookie rides along automatically,
 * mutations carry an `Idempotency-Key`, and any failure arrives as an
 * `ApiClientError` carrying the envelope's `code`, `message` and `field` so a
 * screen can put the message straight on a form field.
 */

export type ErrorCode =
  | "malformed"
  | "unauthenticated"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "validation_failed"
  | "throttled"
  | "internal_error"
  | "network";

export class ApiClientError extends Error {
  readonly code: ErrorCode;
  readonly field?: string;
  readonly requestId?: string;
  readonly status: number;

  constructor(code: ErrorCode, message: string, status: number, field?: string, requestId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.field = field;
    this.requestId = requestId;
  }
}

export type Page = { limit: number; offset: number; total: number };

const BASE = "/api/v1";
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  /** Reuse a key to make a retry idempotent rather than a second write. */
  idempotencyKey?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};

  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (MUTATING.has(method)) {
    headers["idempotency-key"] = options.idempotencyKey ?? crypto.randomUUID();
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      // §2: the session is an httpOnly cookie, so it must be sent explicitly.
      credentials: "same-origin",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new ApiClientError("network", "Cannot reach FretLab. Check your connection and try again.", 0);
  }

  if (response.status === 204) return undefined as T;

  const requestId = response.headers.get("x-request-id") ?? undefined;
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const envelope = (payload as { error?: { code?: ErrorCode; message?: string; field?: string } } | null)?.error;
    throw new ApiClientError(
      envelope?.code ?? "internal_error",
      envelope?.message ?? "Something failed on our side. Try again in a moment.",
      response.status,
      envelope?.field,
      requestId,
    );
  }

  return payload as T;
}

/** §4 PracticeSession, as it arrives on the wire. */
export type PracticeSessionWire = {
  id: string;
  owner_id: string;
  title: string;
  body: string;
  status: "draft" | "active" | "archived";
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  drill_id: string;
  music_key: string;
  bpm: number | null;
  accuracy: number | null;
  reps: number | null;
  duration_seconds: number | null;
};

export type UserWire = {
  id: string;
  email: string;
  display_name: string;
  role: "owner" | "admin" | "member";
  email_verified_at: string | null;
  avatar_file_id: string | null;
};

export const api = {
  session: (signal?: AbortSignal) =>
    request<{ user: UserWire; auth_mode: "local" | "oidc" }>("/auth/session", { signal }),

  login: (email: string, password: string) =>
    request<{ user?: UserWire; authorize_url?: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  register: (email: string, password: string, displayName: string) =>
    request<{ user: UserWire }>("/auth/register", {
      method: "POST",
      body: { email, password, display_name: displayName },
    }),

  logout: () => request<{ end_session_url: string | null }>("/auth/logout", { method: "POST" }),

  listPracticeSessions: (
    params: { limit?: number; drillId?: string; musicKey?: string; sort?: string; direction?: "asc" | "desc" } = {},
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.musicKey) query.set("music_key", params.musicKey);
    if (params.sort) query.set("sort", params.sort);
    if (params.direction) query.set("direction", params.direction);
    // `drill_id` is not a list filter on the server; it is matched through
    // search, which covers title, body and drill id.
    if (params.drillId) query.set("search", params.drillId);
    const suffix = query.toString() ? `?${query}` : "";
    return request<{ data: PracticeSessionWire[]; page: Page }>(`/practice-sessions${suffix}`, { signal });
  },

  createPracticeSession: (
    input: {
      title: string;
      drill_id: string;
      music_key: string;
      bpm?: number;
      accuracy?: number;
      reps?: number;
      duration_seconds?: number;
      tags?: string[];
    },
    idempotencyKey?: string,
  ) =>
    request<{ data: PracticeSessionWire }>("/practice-sessions", {
      method: "POST",
      body: input,
      idempotencyKey,
    }),
};
