/** §1 Resource: detail, edit, delete. */
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { practiceSessions, type PracticeSession } from "@/db/schema";
import { route, readJson, requireUser } from "@/lib/http/handler";
import { noContent, ok } from "@/lib/http/respond";
import { notFound } from "@/lib/http/errors";
import { practiceSessionToWire } from "@/lib/api/serialize";
import {
  optionalEnum,
  optionalInteger,
  optionalString,
  optionalTags,
} from "@/lib/api/validate";
import { nowIso } from "@/lib/http/id";

function idFrom(pathname: string): string {
  return pathname.split("/").filter(Boolean).pop() ?? "";
}

async function findOwned(id: string, ownerId: string): Promise<PracticeSession> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.id, id),
        eq(practiceSessions.ownerId, ownerId),
        isNull(practiceSessions.deletedAt),
      ),
    )
    .limit(1);

  // A row owned by someone else is reported as missing rather than forbidden,
  // so the endpoint cannot be used to probe for ids.
  if (!row) throw notFound("That practice session no longer exists. It may have been deleted.");
  return row;
}

export const GET = route(
  async (context) => {
    const user = requireUser(context);
    const row = await findOwned(idFrom(context.url.pathname), user.id);
    return ok({ data: practiceSessionToWire(row) }, context.requestId);
  },
  { auth: true },
);

export const PATCH = route(
  async (context) => {
    const user = requireUser(context);
    const existing = await findOwned(idFrom(context.url.pathname), user.id);
    const body = await readJson<Record<string, unknown>>(context.request);

    const patch: Partial<typeof practiceSessions.$inferInsert> = { updatedAt: nowIso() };

    const title = optionalString(body.title, "title", 120);
    if (title !== undefined) patch.title = title;

    const text = optionalString(body.body, "body", 4000);
    if (text !== undefined) patch.body = text;

    const status = optionalEnum(body.status, "status", ["draft", "active", "archived"] as const);
    if (status !== undefined) patch.status = status;

    const tags = optionalTags(body.tags);
    if (tags !== undefined) patch.tags = tags;

    const drillId = optionalString(body.drill_id, "drill_id", 64);
    if (drillId !== undefined) patch.drillId = drillId;

    const musicKey = optionalString(body.music_key, "music_key", 8);
    if (musicKey !== undefined) patch.musicKey = musicKey;

    const bpm = optionalInteger(body.bpm, "bpm", 20, 320);
    if (bpm !== undefined) patch.bpm = bpm;

    const accuracy = optionalInteger(body.accuracy, "accuracy", 0, 100);
    if (accuracy !== undefined) patch.accuracy = accuracy;

    const reps = optionalInteger(body.reps, "reps", 0, 100_000);
    if (reps !== undefined) patch.reps = reps;

    const duration = optionalInteger(body.duration_seconds, "duration_seconds", 0, 86_400);
    if (duration !== undefined) patch.durationSeconds = duration;

    const [updated] = await getDb()
      .update(practiceSessions)
      .set(patch)
      .where(eq(practiceSessions.id, existing.id))
      .returning();

    return ok({ data: practiceSessionToWire(updated) }, context.requestId);
  },
  { auth: true },
);

/** §4: soft delete via `deleted_at` on Item. */
export const DELETE = route(
  async (context) => {
    const user = requireUser(context);
    const existing = await findOwned(idFrom(context.url.pathname), user.id);

    await getDb()
      .update(practiceSessions)
      .set({ deletedAt: nowIso(), updatedAt: nowIso() })
      .where(eq(practiceSessions.id, existing.id));

    return noContent(context.requestId);
  },
  { auth: true },
);
