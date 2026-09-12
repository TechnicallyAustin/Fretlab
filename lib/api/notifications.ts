/**
 * §1 Notifications: categories, preference lookup, and the create path used by
 * anything that wants to notify a user.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationPreferences, notifications, type Notification } from "@/db/schema";
import { ulid } from "@/lib/http/id";

/** The categories FretLab can notify about. Copy follows §7: plain, user-named. */
export const CATEGORIES = [
  { id: "practice_reminder", label: "Practice reminders" },
  { id: "streak", label: "Streak updates" },
  { id: "milestone", label: "Milestones reached" },
  { id: "account", label: "Account and security" },
] as const;

export const CATEGORY_IDS = new Set<string>(CATEGORIES.map((category) => category.id));

/** Unset categories default to on; a new account gets everything until it opts out. */
export async function isCategoryEnabled(userId: string, category: string): Promise<boolean> {
  const [row] = await getDb()
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.category, category),
      ),
    )
    .limit(1);
  return row ? row.enabled : true;
}

/** Respects the user's per-category preference; returns null when suppressed. */
export async function notify(
  userId: string,
  category: string,
  title: string,
  body = "",
  link: string | null = null,
): Promise<Notification | null> {
  if (!(await isCategoryEnabled(userId, category))) return null;

  const [row] = await getDb()
    .insert(notifications)
    .values({ id: ulid(), userId, category, title, body, link })
    .returning();

  return row;
}
