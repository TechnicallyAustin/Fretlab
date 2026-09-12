/** §1 Notifications: mark one read. */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { route, requireUser } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { notFound } from "@/lib/http/errors";
import { notificationToWire } from "@/lib/api/serialize";
import { nowIso } from "@/lib/http/id";

export const PATCH = route(
  async (context) => {
    const user = requireUser(context);
    const id = context.url.pathname.split("/").filter(Boolean).pop() ?? "";

    const db = getDb();
    const [row] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
      .limit(1);

    if (!row) throw notFound("That notification no longer exists.");

    // Marking an already-read notification read again is not an error.
    const [updated] = await db
      .update(notifications)
      .set({ readAt: row.readAt ?? nowIso() })
      .where(eq(notifications.id, row.id))
      .returning();

    return ok({ data: notificationToWire(updated) }, context.requestId);
  },
  { auth: true },
);
