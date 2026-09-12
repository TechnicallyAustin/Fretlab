/**
 * ULID generation. §3 shows request ids as ULIDs ("01J8..."), and §4 entity ids
 * use the same format so ids sort by creation time.
 */
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function encodeTime(now: number): string {
  let out = "";
  for (let index = TIME_LEN - 1; index >= 0; index -= 1) {
    out = ENCODING[now % 32] + out;
    now = Math.floor(now / 32);
  }
  return out;
}

function encodeRandom(): string {
  const bytes = new Uint8Array(RANDOM_LEN);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += ENCODING[byte % 32];
  return out;
}

export function ulid(now = Date.now()): string {
  return encodeTime(now) + encodeRandom();
}

/** An opaque, high-entropy token for sessions and emailed links. */
export function secureToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return [...buffer].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** §4 timestamps are UTC ISO-8601 everywhere, in storage and on the wire. */
export function nowIso(): string {
  return new Date().toISOString();
}
