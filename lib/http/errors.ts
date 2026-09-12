/**
 * App Template Contract v1 §3 — the error envelope.
 *
 * Every failure, no exceptions:
 *
 *   { "error": { "code", "message", "field", "request_id" } }
 *
 * `code` is a stable machine string the client switches on. `message` is
 * user-facing copy written per §7: it states what happened and the next move,
 * it does not apologize, and it is never vague.
 */
export const ERROR_STATUS = {
  malformed: 400,
  unauthenticated: 401,
  unauthorized: 403,
  not_found: 404,
  conflict: 409,
  validation_failed: 422,
  throttled: 429,
  internal_error: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly field?: string;

  constructor(code: ErrorCode, message: string, field?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.field = field;
  }
}

export const malformed = (message: string, field?: string) =>
  new ApiError("malformed", message, field);

export const unauthenticated = (message = "Sign in to continue.") =>
  new ApiError("unauthenticated", message);

export const unauthorized = (message = "You do not have access to this. Ask an owner for permission.") =>
  new ApiError("unauthorized", message);

export const notFound = (message = "That item no longer exists. It may have been deleted.") =>
  new ApiError("not_found", message);

export const conflict = (message: string, field?: string) =>
  new ApiError("conflict", message, field);

export const validationFailed = (message: string, field?: string) =>
  new ApiError("validation_failed", message, field);

export const throttled = (message = "Too many attempts. Wait a minute and try again.") =>
  new ApiError("throttled", message);
