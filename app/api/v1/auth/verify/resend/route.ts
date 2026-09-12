/** §2 `POST /api/v1/auth/verify/resend` — reissue the verification link. */
import { route, requireUser } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { conflict, notFound } from "@/lib/http/errors";
import { isLocalMode } from "@/lib/auth/mode";
import { issueAuthToken } from "@/lib/auth/tokens";

export const POST = route(
  async (context) => {
    if (!isLocalMode()) {
      throw notFound("Email verification is handled by your identity provider.");
    }

    const user = requireUser(context);
    if (user.emailVerifiedAt) throw conflict("That email is already verified.", "email");

    await issueAuthToken(user.id, "email_verify");
    return ok({ message: "Verification link sent. Check your inbox." }, context.requestId);
  },
  { auth: true },
);
