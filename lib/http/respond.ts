/**
 * App Template Contract v1 §3 — wire format.
 *
 * Base path /api/v1. JSON only. UTC ISO-8601 timestamps.
 * Status codes: 200 read, 201 create, 204 delete, 400 malformed,
 * 401 unauthenticated, 403 unauthorized, 404 missing, 409 conflict,
 * 422 validation, 429 throttled.
 *
 * Every response carries `X-Request-Id`.
 */
import { ApiError } from "./errors";

export type Page = { limit: number; offset: number; total: number };

function headersFor(requestId: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-request-id", requestId);
  return headers;
}

/** 200 read. */
export function ok(data: unknown, requestId: string, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: headersFor(requestId, extra) });
}

/** 201 create. */
export function created(data: unknown, requestId: string, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(data), { status: 201, headers: headersFor(requestId, extra) });
}

/** 204 delete. Carries the request id but no body. */
export function noContent(requestId: string, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  headers.set("x-request-id", requestId);
  return new Response(null, { status: 204, headers });
}

/** §3 collection envelope: `{ data, page: { limit, offset, total } }`. */
export function collection(
  data: readonly unknown[],
  page: Page,
  requestId: string,
  extra?: HeadersInit,
): Response {
  return new Response(JSON.stringify({ data, page }), {
    status: 200,
    headers: headersFor(requestId, extra),
  });
}

/** §3 error envelope. The only shape any failure is allowed to take. */
export function failure(error: ApiError, requestId: string, extra?: HeadersInit): Response {
  const body = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.field ? { field: error.field } : {}),
      request_id: requestId,
    },
  };
  return new Response(JSON.stringify(body), {
    status: error.status,
    headers: headersFor(requestId, extra),
  });
}
