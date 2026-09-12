/**
 * §1 Files: the signed read URL resolves here.
 *
 * Authorised by the HMAC signature rather than the session cookie, so the URL
 * can be used directly as an `<img src>` and still expires on its own.
 */
import { route } from "@/lib/http/handler";
import { unauthorized } from "@/lib/http/errors";
import { findFile, readFileBody, verifyReadSignature } from "@/lib/api/files";

export const GET = route(async (context) => {
  const parts = context.url.pathname.split("/").filter(Boolean);
  const id = parts[parts.length - 2] ?? "";

  const valid = await verifyReadSignature(
    id,
    context.url.searchParams.get("expires"),
    context.url.searchParams.get("signature"),
  );
  if (!valid) throw unauthorized("That link expired. Reload the page to get a fresh one.");

  const file = await findFile(id);
  const object = await readFileBody(file);

  return new Response(object.body, {
    status: 200,
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.bytes),
      "cache-control": "private, max-age=300",
      etag: file.checksum,
      "x-request-id": context.requestId,
    },
  });
});
