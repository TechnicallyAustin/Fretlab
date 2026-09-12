/**
 * §9: "Tests: auth flows, one CRUD round trip, one upload, error envelope shape."
 *
 * These run against a live server with real D1 and R2 bindings:
 *
 *   npm run setup && npm run dev      # terminal 1
 *   npm run test:integration          # terminal 2
 *
 * When nothing is listening the whole suite skips rather than fails, so
 * `npm test` stays runnable without a database.
 */
import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.FRETLAB_URL ?? "http://localhost:3000";
const PASSWORD = "practice-every-day";

async function serverUp() {
  try {
    const response = await fetch(`${BASE}/api/v1/health`, { signal: AbortSignal.timeout(2000) });
    const body = await response.json();
    return body.database === "ok";
  } catch {
    return false;
  }
}

const up = await serverUp();
const options = up
  ? {}
  : { skip: `no server with a live database at ${BASE}; run npm run setup && npm run dev` };

/** Keeps one session's cookies across requests. */
function client() {
  let cookie = "";
  return async function call(path, init = {}) {
    const headers = new Headers(init.headers);
    if (cookie) headers.set("cookie", cookie);
    if (init.body && !headers.has("content-type") && !(init.body instanceof FormData)) {
      headers.set("content-type", "application/json");
    }
    // `omitIdempotencyKey` exists so a test can exercise the §3 requirement
    // itself; every other mutation gets a key automatically.
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(init.method ?? "GET") &&
      !headers.has("idempotency-key") &&
      !init.omitIdempotencyKey
    ) {
      headers.set("idempotency-key", crypto.randomUUID());
    }

    const response = await fetch(`${BASE}/api/v1${path}`, { ...init, headers, redirect: "manual" });
    const setCookie = response.headers.getSetCookie?.() ?? [];
    for (const entry of setCookie) {
      const pair = entry.split(";")[0];
      if (pair.startsWith("fretlab_session=")) cookie = pair;
    }
    return response;
  };
}

async function signedIn(email = "owner@fretlab.local") {
  const call = client();
  const response = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert.equal(response.status, 200, "seeded account must sign in; run npm run db:seed");
  return call;
}

test("§9 health reports a live database", options, async () => {
  const response = await fetch(`${BASE}/api/v1/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "ok");
  assert.equal(body.database, "ok");
  assert.ok(response.headers.get("x-request-id"));
});

test("§2 auth flow: anonymous 401, sign in, session, sign out", options, async () => {
  const call = client();

  const anonymous = await call("/auth/session");
  assert.equal(anonymous.status, 401);
  const envelope = await anonymous.json();
  assert.equal(envelope.error.code, "unauthenticated");
  assert.ok(envelope.error.request_id, "§3 requires request_id on every failure");

  const login = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "owner@fretlab.local", password: PASSWORD }),
  });
  assert.equal(login.status, 200);
  const { user } = await login.json();
  assert.equal(user.email, "owner@fretlab.local");
  assert.equal(user.role, "owner");
  assert.equal("password_hash" in user, false, "credentials must never reach the wire");

  const session = await call("/auth/session");
  assert.equal(session.status, 200);

  const out = await call("/auth/logout", { method: "POST" });
  assert.equal(out.status, 200);
});

test("§2 a wrong password does not enumerate accounts", options, async () => {
  const call = client();
  const wrongPassword = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "owner@fretlab.local", password: "not-the-password" }),
  });
  const unknownEmail = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "nobody@fretlab.local", password: "not-the-password" }),
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.deepEqual(
    (await wrongPassword.json()).error.message,
    (await unknownEmail.json()).error.message,
    "both branches must return identical copy",
  );
});

test("§1 CRUD round trip on the renamed Item", options, async () => {
  const call = await signedIn();

  const created = await call("/practice-sessions", {
    method: "POST",
    body: JSON.stringify({
      title: "Integration round trip",
      drill_id: "thirds",
      music_key: "G",
      bpm: 88,
      accuracy: 93,
      reps: 40,
      duration_seconds: 200,
      tags: ["G", "integration"],
    }),
  });
  assert.equal(created.status, 201, "§3 create is 201");
  const row = (await created.json()).data;
  assert.deepEqual(row.tags, ["G", "integration"]);
  assert.equal(row.duration_seconds, 200);

  const read = await call(`/practice-sessions/${row.id}`);
  assert.equal(read.status, 200);
  assert.equal((await read.json()).data.title, "Integration round trip");

  const list = await call("/practice-sessions?limit=5");
  assert.equal(list.status, 200);
  const page = await list.json();
  assert.ok(Array.isArray(page.data), "§3 collection envelope has data");
  assert.ok(typeof page.page.total === "number", "§3 collection envelope has page.total");

  const patched = await call(`/practice-sessions/${row.id}`, {
    method: "PATCH",
    body: JSON.stringify({ accuracy: 97, status: "archived" }),
  });
  assert.equal(patched.status, 200);
  const updated = (await patched.json()).data;
  assert.equal(updated.accuracy, 97);
  assert.equal(updated.status, "archived");

  const removed = await call(`/practice-sessions/${row.id}`, { method: "DELETE" });
  assert.equal(removed.status, 204, "§3 delete is 204");

  const gone = await call(`/practice-sessions/${row.id}`);
  assert.equal(gone.status, 404, "§4 soft delete hides the row");
});

test("§3 a replayed Idempotency-Key does not write twice", options, async () => {
  const call = await signedIn();
  const key = crypto.randomUUID();
  const body = JSON.stringify({ title: "Idempotent", drill_id: "thirds", music_key: "G" });

  const first = await call("/practice-sessions", { method: "POST", headers: { "idempotency-key": key }, body });
  const replay = await call("/practice-sessions", {
    method: "POST",
    headers: { "idempotency-key": key },
    body: JSON.stringify({ title: "DIFFERENT", drill_id: "thirds", music_key: "G" }),
  });

  assert.equal(first.status, 201);
  assert.equal(replay.headers.get("idempotent-replay"), "true");
  const original = (await first.json()).data;
  const replayed = (await replay.json()).data;
  assert.equal(replayed.id, original.id, "a replay must return the original row");
  assert.equal(replayed.title, "Idempotent", "a replay must not apply the new body");

  await call(`/practice-sessions/${original.id}`, { method: "DELETE" });
});

test("§3 a mutation without an Idempotency-Key is rejected", options, async () => {
  const call = await signedIn();
  // Signed in, so this reaches the idempotency check rather than the auth guard.
  const response = await call("/practice-sessions", {
    method: "POST",
    omitIdempotencyKey: true,
    body: JSON.stringify({ title: "x", drill_id: "y", music_key: "G" }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.field, "idempotency_key");
});

test("§3 validation failures name the field", options, async () => {
  const call = await signedIn();
  const response = await call("/practice-sessions", {
    method: "POST",
    body: JSON.stringify({ title: "x", drill_id: "y", music_key: "G", accuracy: 999 }),
  });
  assert.equal(response.status, 422);
  const { error } = await response.json();
  assert.equal(error.code, "validation_failed");
  assert.equal(error.field, "accuracy");
  assert.match(error.message, /between 0 and 100/);
});

test("§1 upload, signed read URL, and delete", options, async () => {
  const call = await signedIn();

  const bytes = new Uint8Array(520);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const form = new FormData();
  form.set("file", new Blob([bytes], { type: "image/png" }), "probe.png");

  const uploaded = await call("/files", { method: "POST", body: form });
  assert.equal(uploaded.status, 201);
  const file = await uploaded.json();
  assert.equal(file.content_type, "image/png");
  assert.equal(file.bytes, 520);
  assert.match(file.checksum, /^[0-9a-f]{64}$/);

  const read = await fetch(file.read_url);
  assert.equal(read.status, 200, "the signed URL must resolve without a session");
  assert.equal(read.headers.get("content-type"), "image/png");

  const tampered = await fetch(file.read_url.replace(/signature=./, "signature=0"));
  assert.equal(tampered.status, 403, "a tampered signature must be rejected");

  const removed = await call(`/files/${file.id}`, { method: "DELETE" });
  assert.equal(removed.status, 204);
});

test("§1 uploads are validated server side", options, async () => {
  const call = await signedIn();
  const form = new FormData();
  form.set("file", new Blob(["hello"], { type: "text/plain" }), "notes.txt");

  const response = await call("/files", { method: "POST", body: form });
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error.field, "file");
});

test("one member cannot read another's rows", options, async () => {
  const owner = await signedIn("owner@fretlab.local");
  const member = await signedIn("member@fretlab.local");

  const ownerRows = await (await owner("/practice-sessions?limit=1")).json();
  assert.ok(ownerRows.data.length > 0, "seed must create the owner's sessions");

  const memberRows = await (await member("/practice-sessions")).json();
  assert.equal(memberRows.page.total, 0, "the member owns nothing yet");

  // Reported as missing rather than forbidden, so ids cannot be probed.
  const probe = await member(`/practice-sessions/${ownerRows.data[0].id}`);
  assert.equal(probe.status, 404);
});

test("§1 notifications list, count, and mark all read", options, async () => {
  const call = await signedIn();

  const listed = await call("/notifications");
  assert.equal(listed.status, 200);
  const inbox = await listed.json();
  assert.ok(typeof inbox.unread_count === "number");
  assert.ok(inbox.page.total >= 3, "seed creates three notifications");

  const cleared = await call("/notifications/read-all", { method: "POST" });
  assert.equal(cleared.status, 200);
  assert.equal((await cleared.json()).unread_count, 0);

  const after = await (await call("/notifications")).json();
  assert.equal(after.unread_count, 0);
});

test("§1 notification preferences round trip", options, async () => {
  const call = await signedIn();

  const defaults = await (await call("/notifications/preferences")).json();
  assert.ok(defaults.data.every((entry) => typeof entry.enabled === "boolean"));

  const written = await call("/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify({ category: "streak", enabled: false }),
  });
  assert.equal(written.status, 200);

  const reread = await (await call("/notifications/preferences")).json();
  const streak = reread.data.find((entry) => entry.category === "streak");
  assert.equal(streak.enabled, false);

  await call("/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify({ category: "streak", enabled: true }),
  });
});
