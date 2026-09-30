import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

export function visitorDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export async function recordVisitor(transaction: Prisma.TransactionClient, token: string, day: string) {
  const id = createHash("sha256").update(token).digest("hex");
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
  const previous = await transaction.$queryRaw<{ lastDay: string }[]>`
    SELECT "lastDay" FROM "VisitorBrowser" WHERE "id" = ${id}`;
  const keys = previous.length === 0 ? ["total", day] : previous[0].lastDay < day ? [day] : [];
  if (keys.length) {
    await transaction.$executeRaw`
      INSERT INTO "VisitorBrowser" ("id", "lastDay") VALUES (${id}, ${day})
      ON CONFLICT ("id") DO UPDATE SET "lastDay" = EXCLUDED."lastDay"`;
    for (const key of keys) {
      await transaction.$executeRaw`
        INSERT INTO "VisitorCount" ("key", "count") VALUES (${key}, 1)
        ON CONFLICT ("key") DO UPDATE SET "count" = "VisitorCount"."count" + 1`;
    }
  }
  const counts = await transaction.$queryRaw<{ key: string; count: number }[]>`
    SELECT "key", "count" FROM "VisitorCount" WHERE "key" IN ('total', ${day})`;
  return {
    today: counts.find((entry) => entry.key === day)?.count ?? 0,
    total: counts.find((entry) => entry.key === "total")?.count ?? 0,
  };
}