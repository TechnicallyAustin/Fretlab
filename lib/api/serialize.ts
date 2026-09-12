/**
 * §4: "Field names are snake_case on the wire in all four templates, including
 * MERN. Consistency beats each ecosystem's habit."
 *
 * Drizzle gives us camelCase objects, so every entity crosses the boundary
 * through one of these. `password_hash` and `refresh_token_hash` are never
 * serialized.
 */
import type { FileObject, Notification, PracticeSession, User } from "@/db/schema";

export function userToWire(user: User) {
  return {
    id: user.id,
    email: user.email,
    email_verified_at: user.emailVerifiedAt,
    display_name: user.displayName,
    avatar_file_id: user.avatarFileId,
    role: user.role,
    external_id: user.externalId,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    deleted_at: user.deletedAt,
  };
}

/** §4 Item, renamed. Scaffolding fields first, FretLab domain fields after. */
export function practiceSessionToWire(row: PracticeSession) {
  return {
    id: row.id,
    owner_id: row.ownerId,
    title: row.title,
    body: row.body,
    status: row.status,
    tags: row.tags ?? [],
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt,

    drill_id: row.drillId,
    music_key: row.musicKey,
    bpm: row.bpm,
    accuracy: row.accuracy,
    reps: row.reps,
    duration_seconds: row.durationSeconds,
  };
}

export function notificationToWire(row: Notification) {
  return {
    id: row.id,
    user_id: row.userId,
    category: row.category,
    title: row.title,
    body: row.body,
    link: row.link,
    read_at: row.readAt,
    created_at: row.createdAt,
  };
}

export function fileObjectToWire(row: FileObject) {
  return {
    id: row.id,
    owner_id: row.ownerId,
    bucket_key: row.bucketKey,
    filename: row.filename,
    content_type: row.contentType,
    bytes: row.bytes,
    checksum: row.checksum,
    created_at: row.createdAt,
  };
}
