/**
 * §1 Resource: list and create.
 * §4 `Item`, renamed to the FretLab practice session.
 *
 * "Pagination, search, sort on the list."
 */
import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { practiceSessions } from "@/db/schema";
import { route, readJson, requireUser } from "@/lib/http/handler";
import { collection, created } from "@/lib/http/respond";
import { practiceSessionToWire } from "@/lib/api/serialize";
import { parseListQuery } from "@/lib/http/query";
import {
  optionalEnum,
  optionalInteger,
  optionalString,
  optionalTags,
  requireString,
} from "@/lib/api/validate";
import { ulid } from "@/lib/http/id";

const SORTABLE = ["created_at", "updated_at", "title", "bpm", "accuracy"] as const;

const COLUMN = {
  created_at: practiceSessions.createdAt,
  updated_at: practiceSessions.updatedAt,
  title: practiceSessions.title,
  bpm: practiceSessions.bpm,
  accuracy: practiceSessions.accuracy,
} as const;

export const GET = route(
  async (context) => {
    const user = requireUser(context);
    const query = parseListQuery(context.url, SORTABLE);
    const db = getDb();

    // §4 soft delete: deleted rows never appear in a collection.
    const filters = [eq(practiceSessions.ownerId, user.id), isNull(practiceSessions.deletedAt)];

    const status = optionalEnum(
      context.url.searchParams.get("status") ?? undefined,
      "status",
      ["draft", "active", "archived"] as const,
    );
    if (status) filters.push(eq(practiceSessions.status, status));

    const musicKey = context.url.searchParams.get("music_key");
    if (musicKey) filters.push(eq(practiceSessions.musicKey, musicKey));

    if (query.search) {
      const term = `%${query.search}%`;
      filters.push(
        or(
          like(practiceSessions.title, term),
          like(practiceSessions.body, term),
          like(practiceSessions.drillId, term),
        )!,
      );
    }

    const where = and(...filters);
    const direction = query.direction === "asc" ? asc : desc;

    const rows = await db
      .select()
      .from(practiceSessions)
      .where(where)
      .orderBy(direction(COLUMN[query.sort as keyof typeof COLUMN]))
      .limit(query.limit)
      .offset(query.offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(practiceSessions)
      .where(where);

    return collection(rows.map(practiceSessionToWire), {
      limit: query.limit,
      offset: query.offset,
      total: Number(total),
    }, context.requestId);
  },
  { auth: true },
);

export const POST = route(
  async (context) => {
    const user = requireUser(context);
    const body = await readJson<Record<string, unknown>>(context.request);

    const [row] = await getDb()
      .insert(practiceSessions)
      .values({
        id: ulid(),
        ownerId: user.id,
        title: requireString(body.title, "title", 120),
        body: optionalString(body.body, "body", 4000) ?? "",
        status: optionalEnum(body.status, "status", ["draft", "active", "archived"] as const) ?? "active",
        tags: optionalTags(body.tags) ?? [],
        drillId: requireString(body.drill_id, "drill_id", 64),
        musicKey: requireString(body.music_key, "music_key", 8),
        bpm: optionalInteger(body.bpm, "bpm", 20, 320) ?? null,
        accuracy: optionalInteger(body.accuracy, "accuracy", 0, 100) ?? null,
        reps: optionalInteger(body.reps, "reps", 0, 100_000) ?? null,
        durationSeconds: optionalInteger(body.duration_seconds, "duration_seconds", 0, 86_400) ?? null,
      })
      .returning();

    return created({ data: practiceSessionToWire(row) }, context.requestId);
  },
  { auth: true },
);
