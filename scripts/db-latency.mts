/**
 * Measures where page time actually goes: network round trip to the database,
 * then the real queries a page makes. Run with:
 *   npx tsx scripts/db-latency.mts
 */
import "dotenv/config";

import { loadConfig } from "../conf/config";

const pg = loadConfig().database.postgres;
process.env.DATABASE_URL ||= pg.url;
process.env.DIRECT_URL ||= pg.direct_url || pg.url;

const { prisma } = await import("../src/lib/prisma");

function stats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    median: sorted[Math.floor(sorted.length / 2)],
    max: sorted.at(-1),
  };
}

async function time<T>(fn: () => Promise<T>): Promise<number> {
  const t0 = Date.now();
  await fn();
  return Date.now() - t0;
}

console.log("db host:", new URL(pg.url).host);

// Warm the pool so the first connection handshake is not counted.
await prisma.$queryRaw`SELECT 1`;

const pings: number[] = [];
for (let i = 0; i < 12; i++) {
  pings.push(await time(() => prisma.$queryRaw`SELECT 1`));
}
console.log("SELECT 1 round trip ms:", JSON.stringify(stats(pings)), pings.join(","));

const catalogue = await time(() =>
  prisma.product.findMany({
    take: 40,
    include: { farmer: { include: { region: true } }, region: true, category: true },
  }),
);
console.log("product list with joins ms:", catalogue);

const counts = await time(() =>
  Promise.all([prisma.farmer.count(), prisma.organicStore.count(), prisma.customer.count()]),
);
console.log("three counts in parallel ms:", counts);

const sequential = await time(async () => {
  await prisma.farmer.count();
  await prisma.organicStore.count();
  await prisma.customer.count();
});
console.log("same three sequentially ms:", sequential);

await prisma.$disconnect();
