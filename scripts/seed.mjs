/**
 * §9: "Seed script creates one owner, one member, twelve items, three
 * notifications."
 *
 * Emits SQL on stdout so the same script can target local Miniflare state or a
 * real D1 database:
 *
 *   npm run db:seed          # local
 *   npm run db:seed:remote   # deployed D1
 *
 * Password hashes are produced with the same PBKDF2 parameters as
 * lib/auth/crypto.ts, so seeded accounts sign in through the normal flow.
 */
import { webcrypto as crypto } from "node:crypto";

const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const SEED_PASSWORD = "practice-every-day";

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function ulid(offsetMs = 0) {
  let now = Date.now() + offsetMs;
  let time = "";
  for (let index = 9; index >= 0; index -= 1) {
    time = ENCODING[now % 32] + time;
    now = Math.floor(now / 32);
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let random = "";
  for (const byte of bytes) random += ENCODING[byte % 32];
  return time + random;
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    KEY_LENGTH * 8,
  );
  const b64 = (bytes) => Buffer.from(bytes).toString("base64");
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

const quote = (value) =>
  value === null || value === undefined ? "NULL" : `'${String(value).replace(/'/g, "''")}'`;

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

const DRILLS = [
  ["position-one", "Position one ascending", "G", 84, 94, 120, 242],
  ["position-one", "Position one descending", "G", 80, 96, 110, 258],
  ["octave-leaps", "Octave leaps across strings", "G", 76, 89, 96, 271],
  ["triad-shapes", "Triad shapes, top three strings", "C", 72, 86, 88, 287],
  ["circle-of-fifths", "Circle of fifths, two bars each", "C", 68, 91, 72, 310],
  ["interval-training", "Thirds and sixths", "D", 88, 93, 132, 226],
  ["interval-training", "Fourths across the neck", "D", 92, 88, 124, 233],
  ["position-shifts", "Position one to position five", "A", 80, 90, 104, 264],
  ["chord-tones", "Arpeggiating the I chord", "A", 76, 95, 92, 279],
  ["chord-tones", "Arpeggiating the IV and V", "E", 72, 87, 84, 295],
  ["scale-sequences", "Scale in groups of three", "E", 96, 84, 144, 218],
  ["scale-sequences", "Scale in groups of four", "G", 100, 82, 156, 205],
];

const NOTIFICATIONS = [
  ["milestone", "You cleared 84 bpm in G", "Position one held above 90% accuracy at the new tempo.", "/progress"],
  ["streak", "Four sessions this week", "One more keeps the streak going into next week.", "/today"],
  ["practice_reminder", "Your G major routine is ready", "Twelve minutes, four drills.", "/routines"],
];

async function main() {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const ownerId = ulid(0);
  const memberId = ulid(1);
  const lines = [];

  // Idempotent: re-running the seed replaces the seeded rows rather than
  // stacking duplicates. Practice sessions and notifications go with the user
  // rows through ON DELETE CASCADE.
  lines.push(`DELETE FROM users WHERE email IN ('owner@fretlab.local', 'member@fretlab.local');`);

  for (const [id, email, name, role] of [
    [ownerId, "owner@fretlab.local", "Practice owner", "owner"],
    [memberId, "member@fretlab.local", "Practice member", "member"],
  ]) {
    lines.push(
      `INSERT INTO users (id, email, email_verified_at, display_name, role, password_hash, created_at, updated_at) VALUES (${quote(id)}, ${quote(email)}, ${quote(iso(30))}, ${quote(name)}, ${quote(role)}, ${quote(passwordHash)}, ${quote(iso(30))}, ${quote(iso(30))});`,
    );
  }

  DRILLS.forEach(([drillId, title, key, bpm, accuracy, reps, duration], index) => {
    const when = iso(DRILLS.length - index);
    lines.push(
      `INSERT INTO practice_sessions (id, owner_id, title, body, status, tags, created_at, updated_at, drill_id, music_key, bpm, accuracy, reps, duration_seconds) VALUES (${quote(ulid(index + 2))}, ${quote(ownerId)}, ${quote(title)}, ${quote("")}, 'active', ${quote(JSON.stringify([key, drillId]))}, ${quote(when)}, ${quote(when)}, ${quote(drillId)}, ${quote(key)}, ${bpm}, ${accuracy}, ${reps}, ${duration});`,
    );
  });

  NOTIFICATIONS.forEach(([category, title, body, link], index) => {
    const when = iso(index);
    lines.push(
      `INSERT INTO notifications (id, user_id, category, title, body, link, read_at, created_at) VALUES (${quote(ulid(index + 20))}, ${quote(ownerId)}, ${quote(category)}, ${quote(title)}, ${quote(body)}, ${quote(link)}, NULL, ${quote(when)});`,
    );
  });

  process.stdout.write(lines.join("\n") + "\n");
  process.stderr.write(
    `Seeded 2 users, ${DRILLS.length} practice sessions, ${NOTIFICATIONS.length} notifications.\n` +
      `Sign in as owner@fretlab.local or member@fretlab.local with: ${SEED_PASSWORD}\n`,
  );
}

await main();
