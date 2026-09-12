/**
 * §1 Resource: "Pagination, search, sort on the list."
 * Parsed once here so every collection endpoint behaves identically.
 */
import { malformed } from "./errors";

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

export type ListQuery = {
  limit: number;
  offset: number;
  search: string | null;
  sort: string;
  direction: "asc" | "desc";
};

function integerParam(params: URLSearchParams, name: string, fallback: number): number {
  const raw = params.get(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw malformed(`The ${name} parameter must be a whole number of 0 or more.`, name);
  }
  return value;
}

export function parseListQuery(url: URL, sortable: readonly string[]): ListQuery {
  const params = url.searchParams;
  const limit = Math.min(integerParam(params, "limit", DEFAULT_LIMIT), MAX_LIMIT);
  const offset = integerParam(params, "offset", 0);

  const sort = params.get("sort") ?? sortable[0];
  if (!sortable.includes(sort)) {
    throw malformed(`Sort by one of: ${sortable.join(", ")}.`, "sort");
  }

  const direction = params.get("direction") ?? "desc";
  if (direction !== "asc" && direction !== "desc") {
    throw malformed("Direction must be asc or desc.", "direction");
  }

  const search = params.get("search")?.trim() || null;

  return { limit, offset, search, sort, direction };
}
