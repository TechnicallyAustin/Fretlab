/** §2 `GET /api/v1/auth/session` -> current user or 401. */
import { route, requireUser } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { userToWire } from "@/lib/api/serialize";
import { authMode } from "@/lib/auth/mode";

export const GET = route(
  async (context) =>
    ok({ user: userToWire(requireUser(context)), auth_mode: authMode() }, context.requestId),
  { auth: true },
);
