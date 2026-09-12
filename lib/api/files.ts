/**
 * §1 Files: "Direct upload with progress. Type and size validation server side.
 * Signed read URLs, delete."
 *
 * R2 is reached through a Worker binding, which has no presign call, so read
 * URLs are signed here with HMAC-SHA256 over `bucket_key + expiry` and verified
 * on the way back out. The signature is short-lived and carries no session, so
 * a leaked URL expires on its own.
 */
import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { fileObjects, type FileObject } from "@/db/schema";
import { notFound, validationFailed } from "@/lib/http/errors";
import { ulid } from "@/lib/http/id";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
]);

const SIGNED_URL_TTL_SECONDS = 300;
const encoder = new TextEncoder();

function signingKey(): string {
  return env.AUTH_SECRET ?? "fretlab-development-secret";
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signedReadUrl(file: FileObject, origin: string): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
  const signature = await sign(`${file.id}:${expires}`);
  return `${origin}/api/v1/files/${file.id}/content?expires=${expires}&signature=${signature}`;
}

export async function verifyReadSignature(
  fileId: string,
  expires: string | null,
  signature: string | null,
): Promise<boolean> {
  if (!expires || !signature) return false;
  const expiryNumber = Number(expires);
  if (!Number.isInteger(expiryNumber) || expiryNumber < Math.floor(Date.now() / 1000)) return false;

  const expected = await sign(`${fileId}:${expires}`);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return diff === 0;
}

function bucket(): R2Bucket {
  if (!env.R2) {
    throw notFound(
      "File storage is not configured. Set \"r2\" to \"R2\" in .openai/hosting.json and redeploy.",
    );
  }
  return env.R2;
}

/** Validation happens server side per §1, never only in the picker. */
export async function storeUpload(
  ownerId: string,
  file: File,
): Promise<FileObject> {
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw validationFailed(
      "That file type is not supported. Upload a PNG, JPEG, WebP, GIF, or an audio recording.",
      "file",
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw validationFailed("That file is over 10 MB. Choose a smaller one.", "file");
  }
  if (file.size === 0) {
    throw validationFailed("That file is empty. Choose another one.", "file");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  const checksum = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const id = ulid();
  const bucketKey = `users/${ownerId}/${id}`;

  await bucket().put(bucketKey, bytes as unknown as ArrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  const db = getDb();
  const [row] = await db
    .insert(fileObjects)
    .values({
      id,
      ownerId,
      bucketKey,
      filename: file.name || "upload",
      contentType: file.type,
      bytes: file.size,
      checksum,
    })
    .returning();

  return row;
}

export async function findOwnedFile(fileId: string, ownerId: string): Promise<FileObject> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(fileObjects)
    .where(and(eq(fileObjects.id, fileId), eq(fileObjects.ownerId, ownerId)))
    .limit(1);
  if (!row) throw notFound("That file no longer exists. It may have been deleted.");
  return row;
}

export async function findFile(fileId: string): Promise<FileObject> {
  const db = getDb();
  const [row] = await db.select().from(fileObjects).where(eq(fileObjects.id, fileId)).limit(1);
  if (!row) throw notFound("That file no longer exists. It may have been deleted.");
  return row;
}

/** §4: hard delete on FileObject. The object goes with the row. */
export async function deleteFile(file: FileObject): Promise<void> {
  await bucket().delete(file.bucketKey);
  const db = getDb();
  await db.delete(fileObjects).where(eq(fileObjects.id, file.id));
}

export async function readFileBody(file: FileObject): Promise<R2ObjectBody> {
  const object = await bucket().get(file.bucketKey);
  if (!object) throw notFound("That file is no longer stored. Upload it again.");
  return object;
}
