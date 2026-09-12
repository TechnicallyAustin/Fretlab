/** §1 Files: direct upload. Type and size are validated server side. */
import { route, requireUser } from "@/lib/http/handler";
import { created } from "@/lib/http/respond";
import { validationFailed } from "@/lib/http/errors";
import { fileObjectToWire } from "@/lib/api/serialize";
import { signedReadUrl, storeUpload } from "@/lib/api/files";
import { appUrl } from "@/lib/auth/mode";

export const POST = route(
  async (context) => {
    const user = requireUser(context);

    const form = await context.request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      throw validationFailed("Attach a file to upload.", "file");
    }

    const stored = await storeUpload(user.id, file);
    return created(
      {
        ...fileObjectToWire(stored),
        read_url: await signedReadUrl(stored, appUrl(context.request)),
      },
      context.requestId,
    );
  },
  { auth: true },
);
