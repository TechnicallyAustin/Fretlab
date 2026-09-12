/**
 * App Template Contract v1 conformance.
 *
 * §9 requires tests for "auth flows, one CRUD round trip, one upload, error
 * envelope shape". The envelope, wire format, validation and password handling
 * are exercised directly here. The CRUD and upload round trips need a live D1
 * and R2 binding, so they live in tests/integration.test.mjs and run against
 * `wrangler dev`; see the README.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

const { ApiError, ERROR_STATUS, validationFailed, notFound, conflict } = await import(
  "../lib/http/errors.ts"
);
const { failure, ok, created, noContent, collection } = await import("../lib/http/respond.ts");
const { hashPassword, verifyPassword, hashToken } = await import("../lib/auth/crypto.ts");
const { userToWire, practiceSessionToWire } = await import("../lib/api/serialize.ts");
const { requireEmail, requirePassword, requireString, optionalTags } = await import(
  "../lib/api/validate.ts"
);
const { parseListQuery } = await import("../lib/http/query.ts");
const { ulid } = await import("../lib/http/id.ts");

test("§3 every failure uses the error envelope", async () => {
  const response = failure(validationFailed("Display name must be under 64 characters.", "display_name"), "01J8TEST");
  assert.equal(response.status, 422);
  assert.equal(response.headers.get("x-request-id"), "01J8TEST");

  const body = await response.json();
  assert.deepEqual(Object.keys(body), ["error"]);
  assert.equal(body.error.code, "validation_failed");
  assert.equal(body.error.message, "Display name must be under 64 characters.");
  assert.equal(body.error.field, "display_name");
  assert.equal(body.error.request_id, "01J8TEST");
});

test("§3 status codes map to the contract", () => {
  assert.deepEqual(ERROR_STATUS, {
    malformed: 400,
    unauthenticated: 401,
    unauthorized: 403,
    not_found: 404,
    conflict: 409,
    validation_failed: 422,
    throttled: 429,
    internal_error: 500,
  });
  assert.equal(new ApiError("conflict", "x").status, 409);
  assert.equal(notFound().status, 404);
  assert.equal(conflict("x").status, 409);
});

test("§3 read, create and delete use 200, 201 and 204", async () => {
  assert.equal(ok({}, "r").status, 200);
  assert.equal(created({}, "r").status, 201);

  const deleted = noContent("r");
  assert.equal(deleted.status, 204);
  assert.equal(deleted.headers.get("x-request-id"), "r");
  assert.equal(await deleted.text(), "");
});

test("§3 collection envelope carries data and page", async () => {
  const response = collection([{ id: "a" }], { limit: 25, offset: 0, total: 184 }, "r");
  const body = await response.json();
  assert.deepEqual(body, { data: [{ id: "a" }], page: { limit: 25, offset: 0, total: 184 } });
});

test("§3 every response carries X-Request-Id", () => {
  for (const response of [ok({}, "rid"), created({}, "rid"), noContent("rid"), collection([], { limit: 1, offset: 0, total: 0 }, "rid"), failure(notFound(), "rid")]) {
    assert.equal(response.headers.get("x-request-id"), "rid");
  }
});

test("§2 passwords hash with PBKDF2 and verify", async () => {
  const hash = await hashPassword("practice-every-day");
  assert.match(hash, /^pbkdf2\$210000\$/);
  assert.equal(await verifyPassword("practice-every-day", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
  assert.equal(await verifyPassword("practice-every-day", null), false);

  // Two hashes of the same password differ: the salt is per hash.
  assert.notEqual(hash, await hashPassword("practice-every-day"));
});

test("§2 tokens are stored only as hashes", async () => {
  const digest = await hashToken("a-session-token");
  assert.match(digest, /^[0-9a-f]{64}$/);
  assert.equal(digest, await hashToken("a-session-token"));
  assert.notEqual(digest, await hashToken("a-different-token"));
});

test("§4 the wire is snake_case and never leaks credentials", () => {
  const wire = userToWire({
    id: "u1", email: "a@b.c", emailVerifiedAt: null, displayName: "A",
    avatarFileId: null, role: "owner", externalId: null,
    passwordHash: "pbkdf2$secret", createdAt: "t", updatedAt: "t", deletedAt: null,
  });

  assert.ok("display_name" in wire);
  assert.ok("email_verified_at" in wire);
  assert.ok("avatar_file_id" in wire);
  assert.equal("password_hash" in wire, false);
  assert.equal("passwordHash" in wire, false);
  for (const key of Object.keys(wire)) assert.doesNotMatch(key, /[A-Z]/, `camelCase on the wire: ${key}`);
});

test("§4 the renamed Item keeps its scaffolding fields", () => {
  const wire = practiceSessionToWire({
    id: "p1", ownerId: "u1", title: "T", body: "", status: "active", tags: ["G"],
    createdAt: "t", updatedAt: "t", deletedAt: null,
    drillId: "position-one", musicKey: "G", bpm: 84, accuracy: 94, reps: 120, durationSeconds: 242,
  });

  for (const field of ["id", "owner_id", "title", "body", "status", "tags", "created_at", "updated_at", "deleted_at"]) {
    assert.ok(field in wire, `§4 Item field missing: ${field}`);
  }
  assert.deepEqual(wire.tags, ["G"]);
  assert.equal(wire.music_key, "G");
  assert.equal(wire.duration_seconds, 242);
});

test("§7 validation messages state the next move and name the field", () => {
  assert.throws(() => requireEmail("not-an-email"), (error) => {
    assert.equal(error.field, "email");
    assert.equal(error.message, "Enter a valid email address.");
    return true;
  });

  assert.throws(() => requirePassword("short"), (error) => {
    assert.match(error.message, /at least 12 characters/);
    assert.doesNotMatch(error.message, /sorry|oops|unfortunately/i);
    return true;
  });

  assert.throws(() => requireString("x".repeat(200), "display_name", 64), (error) => {
    assert.equal(error.field, "display_name");
    assert.match(error.message, /under 64 characters/);
    return true;
  });

  assert.deepEqual(optionalTags(["a", "b"]), ["a", "b"]);
  assert.throws(() => optionalTags("nope"));
});

test("§7 no shipped error copy uses an em dash or apologises", async () => {
  const { malformed, unauthenticated, unauthorized, throttled } = await import("../lib/http/errors.ts");
  for (const error of [malformed("x"), unauthenticated(), unauthorized(), notFound(), throttled()]) {
    assert.doesNotMatch(error.message, /—/, `em dash in: ${error.message}`);
    assert.doesNotMatch(error.message, /\b(sorry|oops|unfortunately)\b/i, error.message);
  }
});

test("§1 lists paginate, search and sort", () => {
  const query = parseListQuery(
    new URL("http://x/api/v1/practice-sessions?limit=10&offset=20&search=triad&sort=bpm&direction=asc"),
    ["created_at", "bpm"],
  );
  assert.deepEqual(query, { limit: 10, offset: 20, search: "triad", sort: "bpm", direction: "asc" });

  // Limit is capped, and an unknown sort column is rejected rather than ignored.
  assert.equal(parseListQuery(new URL("http://x/?limit=9999"), ["created_at"]).limit, 100);
  assert.throws(() => parseListQuery(new URL("http://x/?sort=password_hash"), ["created_at"]));
  assert.throws(() => parseListQuery(new URL("http://x/?limit=-1"), ["created_at"]));
});

test("ids are ULIDs and sort by creation time", () => {
  const early = ulid(0);
  const late = ulid(60_000);
  assert.match(early, /^[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.ok(early < late, "ULIDs must sort lexicographically by time");
});

test("§2 the auth surface is complete", async () => {
  const expected = [
    "auth/session", "auth/login", "auth/callback", "auth/refresh", "auth/logout",
    "auth/register", "auth/password/reset", "auth/password/reset/confirm",
    "auth/verify/resend", "auth/verify/[token]",
  ];
  const present = [];
  async function walk(dir, prefix) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) await walk(join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      else if (entry.name === "route.ts") present.push(prefix);
    }
  }
  await walk(join(ROOT, "app/api/v1"), "");
  for (const route of expected) assert.ok(present.includes(route), `§2 endpoint missing: /api/v1/${route}`);
});
