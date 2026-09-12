/**
 * Password and token hashing.
 *
 * Workers has no native bcrypt/argon2, so local mode uses PBKDF2-HMAC-SHA256
 * through WebCrypto. Stored format is `pbkdf2$<iterations>$<salt>$<hash>`,
 * which keeps the iteration count upgradable without invalidating old hashes.
 */
const ITERATIONS = 210_000; // OWASP 2023 guidance for PBKDF2-HMAC-SHA256
const KEY_LENGTH = 32;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    KEY_LENGTH * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** Constant-time compare so verification does not leak the hash byte by byte. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a[index] ^ b[index];
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, iterationText, saltText, hashText] = stored.split("$");
  if (scheme !== "pbkdf2") return false;
  const iterations = Number(iterationText);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  const expected = fromBase64(hashText);
  const actual = await derive(password, fromBase64(saltText), iterations);
  return timingSafeEqual(actual, expected);
}

/**
 * SHA-256 of an opaque token. Session refresh tokens and emailed links are
 * stored only as hashes, so a database read cannot be replayed as a login.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
