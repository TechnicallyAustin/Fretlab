/** §2 `POST /api/v1/auth/logout` -> clears session, oidc also hits end_session. */
import { route } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { authMode, appUrl } from "@/lib/auth/mode";
import { endSessionUrl } from "@/lib/auth/oidc";
import { clearedSessionCookie, resolveSession, revokeSession } from "@/lib/auth/session";

export const POST = route(
  async (context) => {
    const session = await resolveSession(context.request);
    if (session) await revokeSession(session.sessionId);

    let endSession: string | null = null;
    if (authMode() === "oidc") {
      endSession = await endSessionUrl(appUrl(context.request)).catch(() => null);
    }

    return ok({ end_session_url: endSession }, context.requestId, {
      "set-cookie": clearedSessionCookie(),
    });
  },
  // Signing out twice is the same as signing out once.
  { idempotent: false },
);
