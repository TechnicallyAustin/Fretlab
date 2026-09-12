/** §1 Files: signed read URL, and delete. */
import { route, requireUser } from "@/lib/http/handler";
import { noContent, ok } from "@/lib/http/respond";
import { fileObjectToWire } from "@/lib/api/serialize";
import { deleteFile, findOwnedFile, signedReadUrl } from "@/lib/api/files";
import { appUrl } from "@/lib/auth/mode";

function fileId(pathname: string): string {
  return pathname.split("/").filter(Boolean).pop() ?? "";
}

export const GET = route(
  async (context) => {
    const user = requireUser(context);
    const file = await findOwnedFile(fileId(context.url.pathname), user.id);
    return ok(
      { ...fileObjectToWire(file), read_url: await signedReadUrl(file, appUrl(context.request)) },
      context.requestId,
    );
  },
  { auth: true },
);

export const DELETE = route(
  async (context) => {
    const user = requireUser(context);
    const file = await findOwnedFile(fileId(context.url.pathname), user.id);
    await deleteFile(file);
    return noContent(context.requestId);
  },
  { auth: true },
);
