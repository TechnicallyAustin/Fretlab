/** §1 Account: upload and remove avatar. */
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { route, requireUser } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { validationFailed } from "@/lib/http/errors";
import { userToWire } from "@/lib/api/serialize";
import { deleteFile, findOwnedFile, signedReadUrl, storeUpload } from "@/lib/api/files";
import { appUrl } from "@/lib/auth/mode";
import { nowIso } from "@/lib/http/id";

export const POST = route(
  async (context) => {
    const user = requireUser(context);

    const form = await context.request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw validationFailed("Choose an image to upload.", "file");
    if (!file.type.startsWith("image/")) {
      throw validationFailed("An avatar must be an image. Choose a PNG, JPEG, or WebP.", "file");
    }

    const stored = await storeUpload(user.id, file);

    const db = getDb();
    const [updated] = await db
      .update(users)
      .set({ avatarFileId: stored.id, updatedAt: nowIso() })
      .where(eq(users.id, user.id))
      .returning();

    // Replacing an avatar leaves no orphan behind.
    if (user.avatarFileId) {
      const previous = await findOwnedFile(user.avatarFileId, user.id).catch(() => null);
      if (previous) await deleteFile(previous);
    }

    return ok(
      {
        data: userToWire(updated),
        avatar_url: await signedReadUrl(stored, appUrl(context.request)),
      },
      context.requestId,
    );
  },
  { auth: true },
);

export const DELETE = route(
  async (context) => {
    const user = requireUser(context);
    const db = getDb();

    const [updated] = await db
      .update(users)
      .set({ avatarFileId: null, updatedAt: nowIso() })
      .where(eq(users.id, user.id))
      .returning();

    if (user.avatarFileId) {
      const previous = await findOwnedFile(user.avatarFileId, user.id).catch(() => null);
      if (previous) await deleteFile(previous);
    }

    return ok({ data: userToWire(updated) }, context.requestId);
  },
  { auth: true },
);
