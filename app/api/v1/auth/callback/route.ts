/** §2 `GET /api/v1/auth/callback` -> oidc only, exchanges code, sets session. */
import { route } from "@/lib/http/handler";
import { malformed, notFound, unauthenticated } from "@/lib/http/errors";
import { authMode, appUrl } from "@/lib/auth/mode";
import { exchangeCode, OIDC_STATE_COOKIE } from "@/lib/auth/oidc";
import { createSession, sessionCookie } from "@/lib/auth/session";
import { upsertOidcUser } from "@/lib/auth/users";

export const GET = route(async (context) => {
  if (authMode() !== "oidc") throw notFound("This endpoint is only available under AUTH_MODE=oidc.");

  const code = context.url.searchParams.get("code");
  const state = context.url.searchParams.get("state");
  if (!code || !state) throw malformed("The sign-in response was incomplete. Start again from the sign-in screen.");

  const cookie = context.request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OIDC_STATE_COOKIE}=`))
    ?.slice(OIDC_STATE_COOKIE.length + 1);

  if (!cookie) throw unauthenticated("Your sign-in attempt expired. Start again from the sign-in screen.");

  const [expectedState, verifier] = cookie.split(".");
  if (!verifier || expectedState !== state) {
    throw unauthenticated("Your sign-in attempt could not be verified. Start again from the sign-in screen.");
  }

  const profile = await exchangeCode(code, `${appUrl(context.request)}/api/v1/auth/callback`, verifier);
  const user = await upsertOidcUser(profile);
  const value = await createSession(user.id, context.request);

  const headers = new Headers({ location: appUrl(context.request) + "/" });
  headers.append("set-cookie", sessionCookie(value));
  headers.append("set-cookie", `${OIDC_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`);
  headers.set("x-request-id", context.requestId);
  return new Response(null, { status: 302, headers });
});
