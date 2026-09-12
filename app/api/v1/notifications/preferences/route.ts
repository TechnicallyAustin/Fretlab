/** §1 Notifications: per-category preferences on the settings screen. */
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { route, readJson, requireUser } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { validationFailed } from "@/lib/http/errors";
import { nowIso } from "@/lib/http/id";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/api/notifications";

export const GET = route(
  async (context) => {
    const user = requireUser(context);
    const rows = await getDb()
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id));

    const stored = new Map(rows.map((row) => [row.category, row.enabled]));

    // Unset categories default to on, so a new account gets every notification
    // until it opts out.
    return ok(
      {
        data: CATEGORIES.map((category) => ({
          category: category.id,
          label: category.label,
          enabled: stored.get(category.id) ?? true,
        })),
      },
      context.requestId,
    );
  },
  { auth: true },
);

export const PUT = route(
  async (context) => {
    const user = requireUser(context);
    const body = await readJson<{ category?: unknown; enabled?: unknown }>(context.request);

    if (typeof body.category !== "string" || !CATEGORY_IDS.has(body.category)) {
      throw validationFailed(
        `Category must be one of: ${[...CATEGORY_IDS].join(", ")}.`,
        "category",
      );
    }
    if (typeof body.enabled !== "boolean") {
      throw validationFailed("Enabled must be true or false.", "enabled");
    }

    const db = getDb();
    await db
      .insert(notificationPreferences)
      .values({ userId: user.id, category: body.category, enabled: body.enabled })
      .onConflictDoUpdate({
        target: [notificationPreferences.userId, notificationPreferences.category],
        set: { enabled: body.enabled, updatedAt: nowIso() },
      });

    return ok({ data: { category: body.category, enabled: body.enabled } }, context.requestId);
  },
  // Writing the same preference twice lands on the same state.
  { idempotent: false, auth: true },
);
