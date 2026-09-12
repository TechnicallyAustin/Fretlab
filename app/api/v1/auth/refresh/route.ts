/** §2 `POST /api/v1/auth/refresh` -> rotates, both modes. */
import { route } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { unauthenticated } from "@/lib/http/errors";
import { rotateSession, sessionCookie } from "@/lib/auth/session";

export const POST = route(
  async (context) => {
    const value = await rotateSession(context.request);
    if (!value) throw unauthenticated("Your session expired. Sign in again.");
    return ok({ refreshed: true }, context.requestId, { "set-cookie": sessionCookie(value) });
  },
  // Rotation is naturally single-shot; requiring a key here would break the
  // silent refresh §1 asks for.
  { idempotent: false },
);
