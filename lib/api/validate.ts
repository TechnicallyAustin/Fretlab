/**
 * Field validation. Messages follow §7: they state what happened and the next
 * move, they do not apologize, and they name the field the client should mark.
 */
import { validationFailed } from "@/lib/http/errors";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireString(value: unknown, field: string, max: number, min = 1): string {
  if (typeof value !== "string") throw validationFailed(`${label(field)} is required.`, field);
  const trimmed = value.trim();
  if (trimmed.length < min) throw validationFailed(`${label(field)} is required.`, field);
  if (trimmed.length > max) {
    throw validationFailed(`${label(field)} must be under ${max} characters.`, field);
  }
  return trimmed;
}

export function optionalString(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireString(value, field, max, 0);
}

export function requireEmail(value: unknown): string {
  const email = requireString(value, "email", 254).toLowerCase();
  if (!EMAIL.test(email)) throw validationFailed("Enter a valid email address.", "email");
  return email;
}

export function requirePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 12) {
    throw validationFailed("Use a password of at least 12 characters.", "password");
  }
  if (value.length > 256) {
    throw validationFailed("Passwords must be under 256 characters.", "password");
  }
  return value;
}

export function optionalInteger(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isInteger(value)) {
    throw validationFailed(`${label(field)} must be a whole number.`, field);
  }
  const numeric = value as number;
  if (numeric < min || numeric > max) {
    throw validationFailed(`${label(field)} must be between ${min} and ${max}.`, field);
  }
  return numeric;
}

export function optionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw validationFailed(`${label(field)} must be one of: ${allowed.join(", ")}.`, field);
  }
  return value as T;
}

export function optionalTags(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw validationFailed("Tags must be a list.", "tags");
  if (value.length > 20) throw validationFailed("Use 20 tags or fewer.", "tags");
  return value.map((tag, index) => requireString(tag, `tags.${index}`, 40));
}

function label(field: string): string {
  const name = field.split(".")[0].replace(/_/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}
