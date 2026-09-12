/**
 * §1 Notifications: "Server push channel (SSE on web)."
 *
 * Workers cannot hold a subscription to D1, so the stream polls and emits only
 * when something actually changed. Heartbeats keep intermediaries from closing
 * an idle connection, and the whole stream stops on client disconnect.
 */
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { unauthenticated } from "@/lib/http/errors";
import { failure } from "@/lib/http/respond";
import { ulid } from "@/lib/http/id";
import { resolveSession } from "@/lib/auth/session";
import { notificationToWire } from "@/lib/api/serialize";

const POLL_MS = 5_000;
const HEARTBEAT_MS = 25_000;

export async function GET(request: Request): Promise<Response> {
  const requestId = ulid();

  const session = await resolveSession(request).catch(() => null);
  if (!session) return failure(unauthenticated(), requestId);
  const userId = session.user.id;

  const encoder = new TextEncoder();
  let cursor = new Date().toISOString();
  let lastUnread = -1;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // Already closed by the runtime; nothing to do.
        }
      };

      request.signal.addEventListener("abort", stop);

      const poll = async () => {
        if (closed) return;
        try {
          const db = getDb();

          const fresh = await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.userId, userId), gt(notifications.createdAt, cursor)))
            .orderBy(notifications.createdAt)
            .limit(20);

          if (fresh.length) {
            cursor = fresh[fresh.length - 1].createdAt;
            for (const row of fresh) send("notification", notificationToWire(row));
          }

          const [{ unread }] = await db
            .select({ unread: sql<number>`count(*)` })
            .from(notifications)
            .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

          if (Number(unread) !== lastUnread) {
            lastUnread = Number(unread);
            send("unread_count", { unread_count: lastUnread });
          }
        } catch (error) {
          console.error(`[${requestId}] notification stream`, error);
          send("error", {
            error: {
              code: "internal_error",
              message: "The live connection dropped. It will retry automatically.",
              request_id: requestId,
            },
          });
          stop();
        }
      };

      const pollTimer = setInterval(poll, POLL_MS);
      const heartbeatTimer = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, HEARTBEAT_MS);

      send("ready", { request_id: requestId });
      await poll();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-request-id": requestId,
    },
  });
}

export const dynamic = "force-dynamic";
