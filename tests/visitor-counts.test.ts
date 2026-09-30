import assert from "node:assert/strict";
import test, { after } from "node:test";
import { PrismaClient } from "@prisma/client";
import { loadConfig } from "../conf/config";
import { recordVisitor, visitorDay } from "../src/lib/visitor-counts";

process.env.DATABASE_URL ||= loadConfig().database.postgres.url;
const database = process.env.DATABASE_URL ? new PrismaClient() : null;
after(async () => { await database?.$disconnect(); });

test("visitor day switches at India midnight", () => {
  assert.equal(visitorDay(new Date("2026-09-28T18:29:59Z")), "2026-09-28");
  assert.equal(visitorDay(new Date("2026-09-28T18:30:00Z")), "2026-09-29");
});

test("browser counts deduplicate repeats and persist total across days", { skip: !database }, async () => {
  await database!.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe('CREATE TEMP TABLE "VisitorBrowser" ("id" TEXT PRIMARY KEY, "lastDay" TEXT NOT NULL) ON COMMIT DROP');
    await transaction.$executeRawUnsafe('CREATE TEMP TABLE "VisitorCount" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL DEFAULT 0) ON COMMIT DROP');
    assert.deepEqual(await recordVisitor(transaction, "browser-one", "2026-09-28"), { today: 1, total: 1 });
    assert.deepEqual(await recordVisitor(transaction, "browser-one", "2026-09-28"), { today: 1, total: 1 });
    assert.deepEqual(await recordVisitor(transaction, "browser-two", "2026-09-28"), { today: 2, total: 2 });
    assert.deepEqual(await recordVisitor(transaction, "browser-one", "2026-09-29"), { today: 1, total: 2 });
    assert.deepEqual(await recordVisitor(transaction, "browser-one", "2026-09-28"), { today: 2, total: 2 });
    const stored = await transaction.$queryRaw<{ id: string }[]>`SELECT "id" FROM "VisitorBrowser"`;
    assert.ok(stored.every((row) => /^[a-f0-9]{64}$/.test(row.id)));
  }, { timeout: 30000 });
});