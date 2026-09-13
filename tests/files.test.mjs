/**
 * A signed read URL lets its bearer past auth, so it has to be right.
 *
 * `lib/api/files.ts` was one of the eight modules no test imported. Signature
 * verification is exactly the kind of code that is only ever exercised by its
 * happy path in manual use: a forged or expired signature is not something
 * anyone tries by hand, and a check that always returns true looks identical
 * from the outside.
 */
import assert from "node:assert/strict";
import test from "node:test";

const files = await import("../lib/api/files.ts");
const { signedReadUrl, verifyReadSignature, MAX_UPLOAD_BYTES, ALLOWED_CONTENT_TYPES } = files;

const FILE = { id: "file-abc123", ownerId: "user-1", contentType: "image/png", size: 100 };

/** Pull the query values back out of a signed URL. */
function parts(url) {
  const query = new URL(url).searchParams;
  return { expires: query.get("expires"), signature: query.get("signature") };
}

test("a freshly signed URL verifies", async () => {
  const url = await signedReadUrl(FILE, "https://example.test");
  const { expires, signature } = parts(url);
  assert.ok(expires && signature, "the URL carries no signature");
  assert.equal(await verifyReadSignature(FILE.id, expires, signature), true);
});

test("a signature does not work for another file", async () => {
  // The failure that matters: one shared link reading every file in the bucket.
  const url = await signedReadUrl(FILE, "https://example.test");
  const { expires, signature } = parts(url);
  assert.equal(
    await verifyReadSignature("file-someone-else", expires, signature),
    false,
    "a signature for one file verified against another",
  );
});

test("an expired link stops working", async () => {
  const past = String(Math.floor(Date.now() / 1000) - 1);
  const url = await signedReadUrl(FILE, "https://example.test");
  const { signature } = parts(url);
  assert.equal(await verifyReadSignature(FILE.id, past, signature), false);
});

test("a tampered expiry does not extend the link", async () => {
  const url = await signedReadUrl(FILE, "https://example.test");
  const { expires, signature } = parts(url);
  const later = String(Number(expires) + 86_400);
  assert.equal(
    await verifyReadSignature(FILE.id, later, signature),
    false,
    "moving the expiry forward kept the signature valid",
  );
});

test("a forged or absent signature is refused", async () => {
  const url = await signedReadUrl(FILE, "https://example.test");
  const { expires, signature } = parts(url);

  assert.equal(await verifyReadSignature(FILE.id, expires, null), false);
  assert.equal(await verifyReadSignature(FILE.id, null, signature), false);
  assert.equal(await verifyReadSignature(FILE.id, expires, ""), false);
  assert.equal(await verifyReadSignature(FILE.id, expires, "0".repeat(signature.length)), false);
  // One character changed.
  const flipped = (signature[0] === "a" ? "b" : "a") + signature.slice(1);
  assert.equal(await verifyReadSignature(FILE.id, expires, flipped), false);
});

test("a non-numeric expiry is refused rather than coerced", async () => {
  const url = await signedReadUrl(FILE, "https://example.test");
  const { signature } = parts(url);
  for (const bad of ["soon", "", "1e99", "Infinity", "9007199254740993.5"]) {
    assert.equal(
      await verifyReadSignature(FILE.id, bad, signature),
      false,
      `"${bad}" was accepted as an expiry`,
    );
  }
});

test("the upload limits are stated, not left to the picker", async () => {
  // §1: validation happens server side, so the bounds have to exist here.
  assert.equal(MAX_UPLOAD_BYTES, 10 * 1024 * 1024);
  assert.ok(ALLOWED_CONTENT_TYPES.size > 0, "nothing may be uploaded at all");
  for (const type of ALLOWED_CONTENT_TYPES) {
    assert.match(type, /^[a-z]+\/[a-z0-9.+-]+$/, `"${type}" is not a media type`);
  }
  // The obvious dangerous ones are not on the list.
  for (const type of ["text/html", "application/javascript", "image/svg+xml"]) {
    assert.ok(!ALLOWED_CONTENT_TYPES.has(type), `${type} should not be uploadable`);
  }
});
