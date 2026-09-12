/**
 * App Template Contract v1 §4 — data model baseline.
 *
 * Five entities. Field names are snake_case on the wire and in the column
 * names, per §4 ("Consistency beats each ecosystem's habit").
 *
 * D1 is SQLite, so two shapes differ from the Postgres/Mongo templates:
 *   - timestamps are stored as UTC ISO-8601 text, which is also the wire format (§3)
 *   - `tags[]` is stored as a JSON array in a text column and is an array on the wire
 *
 * §4 names the resource entity `Item` and says it "exists to be renamed. It is
 * the seam where a real project starts." FretLab has performed that rename:
 * `Item` is `practice_sessions`. Every scaffolding field from §4 is kept so the
 * wire contract still matches the other templates; the domain columns are added
 * after them.
 */
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const nowIso = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/** §4 User. `password_hash` is local-mode only; `external_id` is the OIDC subject. */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    emailVerifiedAt: text("email_verified_at"),
    displayName: text("display_name").notNull(),
    avatarFileId: text("avatar_file_id"),
    role: text("role", { enum: ["owner", "admin", "member"] })
      .notNull()
      .default("member"),
    externalId: text("external_id"),
    passwordHash: text("password_hash"),
    createdAt: text("created_at").notNull().default(nowIso),
    updatedAt: text("updated_at").notNull().default(nowIso),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_external_id_unique").on(table.externalId),
  ],
);

/** §4 Session. Hard delete. The refresh token is stored only as a hash. */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: text("expires_at").notNull(),
    revokedAt: text("revoked_at"),
    createdAt: text("created_at").notNull().default(nowIso),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    uniqueIndex("sessions_refresh_token_hash_unique").on(table.refreshTokenHash),
  ],
);

/**
 * §4 Item, renamed to the FretLab resource.
 *
 * One logged practice attempt. The `Progress` and `DrillHistory` screens read
 * from this table; before the contract was applied they rendered hardcoded
 * arrays.
 */
export const practiceSessions = sqliteTable(
  "practice_sessions",
  {
    // §4 scaffolding, unchanged across templates
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    status: text("status", { enum: ["draft", "active", "archived"] })
      .notNull()
      .default("active"),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    createdAt: text("created_at").notNull().default(nowIso),
    updatedAt: text("updated_at").notNull().default(nowIso),
    deletedAt: text("deleted_at"),

    // FretLab domain columns
    drillId: text("drill_id").notNull(),
    musicKey: text("music_key").notNull(),
    bpm: integer("bpm"),
    accuracy: integer("accuracy"),
    reps: integer("reps"),
    durationSeconds: integer("duration_seconds"),
  },
  (table) => [
    index("practice_sessions_owner_id_idx").on(table.ownerId),
    index("practice_sessions_owner_created_idx").on(table.ownerId, table.createdAt),
    index("practice_sessions_drill_id_idx").on(table.drillId),
  ],
);

/** §4 FileObject. Hard delete. */
export const fileObjects = sqliteTable(
  "file_objects",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bucketKey: text("bucket_key").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    bytes: integer("bytes").notNull(),
    checksum: text("checksum").notNull(),
    createdAt: text("created_at").notNull().default(nowIso),
  },
  (table) => [
    index("file_objects_owner_id_idx").on(table.ownerId),
    uniqueIndex("file_objects_bucket_key_unique").on(table.bucketKey),
  ],
);

/** §4 Notification. */
export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    link: text("link"),
    readAt: text("read_at"),
    createdAt: text("created_at").notNull().default(nowIso),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_user_read_idx").on(table.userId, table.readAt),
  ],
);

/** §1 Notifications: per-category preferences on the settings screen. */
export const notificationPreferences = sqliteTable(
  "notification_preferences",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    updatedAt: text("updated_at").notNull().default(nowIso),
  },
  (table) => [uniqueIndex("notification_preferences_pk").on(table.userId, table.category)],
);

/** §3 "Every mutating request carries `Idempotency-Key`." Replay store. */
export const idempotencyKeys = sqliteTable(
  "idempotency_keys",
  {
    key: text("key").notNull(),
    userId: text("user_id").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    statusCode: integer("status_code").notNull(),
    responseBody: text("response_body").notNull(),
    createdAt: text("created_at").notNull().default(nowIso),
  },
  (table) => [uniqueIndex("idempotency_keys_pk").on(table.key, table.userId)],
);

/** §1 Identity: password reset and email verification tokens. */
export const authTokens = sqliteTable(
  "auth_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose", { enum: ["password_reset", "email_verify"] }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    consumedAt: text("consumed_at"),
    createdAt: text("created_at").notNull().default(nowIso),
  },
  (table) => [
    uniqueIndex("auth_tokens_token_hash_unique").on(table.tokenHash),
    index("auth_tokens_user_purpose_idx").on(table.userId, table.purpose),
  ],
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type FileObject = typeof fileObjects.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Role = User["role"];
