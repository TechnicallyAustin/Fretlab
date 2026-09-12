/** §1 Notifications: mark all read. */
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { route, requireUser } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { nowIso } from "@/lib/http/id";

export const POST = route(
  async (context) => {
    const user = requireUser(context);

    await getDb()
      .update(notifications)
      .set({ readAt: nowIso() })
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

    return ok({ unread_count: 0 }, context.requestId);
  },
  // Clearing an already-clear inbox is the same as clearing it once.
  { idempotent: false, auth: true },
);
