/** §1 Notifications: in-app list with unread count. */
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { route, requireUser } from "@/lib/http/handler";
import { collection } from "@/lib/http/respond";
import { notificationToWire } from "@/lib/api/serialize";
import { parseListQuery } from "@/lib/http/query";

export const GET = route(
  async (context) => {
    const user = requireUser(context);
    const query = parseListQuery(context.url, ["created_at"]);
    const db = getDb();

    const filters = [eq(notifications.userId, user.id)];
    if (context.url.searchParams.get("unread") === "true") {
      filters.push(isNull(notifications.readAt));
    }
    const where = and(...filters);

    const rows = await db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(notifications)
      .where(where);

    const [{ unread }] = await db
      .select({ unread: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

    const response = collection(
      rows.map(notificationToWire),
      { limit: query.limit, offset: query.offset, total: Number(total) },
      context.requestId,
    );

    // The unread count rides along so the badge never needs a second request.
    const body = await response.json();
    return new Response(JSON.stringify({ ...(body as object), unread_count: Number(unread) }), {
      status: 200,
      headers: response.headers,
    });
  },
  { auth: true },
);
