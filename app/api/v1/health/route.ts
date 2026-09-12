/** §9: "Health endpoint, structured logs with request ids." */
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { route } from "@/lib/http/handler";
import { ok } from "@/lib/http/respond";
import { authMode } from "@/lib/auth/mode";

export const GET = route(async (context) => {
  let database: "ok" | "unavailable" = "ok";
  try {
    await getDb().run(sql`select 1`);
  } catch {
    database = "unavailable";
  }

  return ok(
    {
      status: database === "ok" ? "ok" : "degraded",
      database,
      auth_mode: authMode(),
      time: new Date().toISOString(),
    },
    context.requestId,
  );
});

export const dynamic = "force-dynamic";
