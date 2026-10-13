import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { prisma } from "../src/lib/prisma";

const require = createRequire(import.meta.url);
const nextCache = require("next/cache");

test("public caches share small catalogue limits and recheck farmer expiry", async (context) => {
  const policies = new Map<string, { revalidate: number; tags: string[] }>();
  const entries = new Map<string, string>();
  context.mock.method(nextCache, "unstable_cache", (
    fetcher: (...args: unknown[]) => Promise<unknown>,
    keys: string[],
    options: { revalidate: number; tags: string[] },
  ) => {
    policies.set(keys.join(":"), options);
    return async (...args: unknown[]) => {
      const key = JSON.stringify([keys, args]);
      if (!entries.has(key)) entries.set(key, JSON.stringify(await fetcher(...args)));
      return JSON.parse(entries.get(key)!);
    };
  });

  const productQueries: { where: Record<string, unknown>; take: number }[] = [];
  const productRows = Array.from({ length: 8 }, (_, index) => ({ id: `product-${index}` }));
  const originalProductQuery = prisma.product.findMany;
  Object.assign(prisma.product, {
    findMany: async (query: { where: Record<string, unknown>; take: number }) => {
      productQueries.push(query);
      return productRows.slice(0, query.take);
    },
  });
  context.after(() => { Object.assign(prisma.product, { findMany: originalProductQuery }); });

  const { getProducts } = await import("../src/lib/products");
  assert.equal((await getProducts({ limit: 60 })).length, 8);
  assert.deepEqual((await getProducts({ limit: 6 })).map((product) => product.id), productRows.slice(0, 6).map((product) => product.id));
  assert.equal((await getProducts({ limit: 1 })).length, 1);
  assert.equal(productQueries.length, 1);
  assert.equal(productQueries[0].take, 60);
  await getProducts({ limit: 6, locale: "en" });
  await getProducts({ limit: 6, locale: "ta" });
  assert.equal(productQueries.length, 2);

  await getProducts({ limit: 6, categorySlug: "fresh-fruits" });
  assert.deepEqual(productQueries.at(-1)!.where.category, { slug: "fresh-fruits" });
  await getProducts({ limit: 6, produceItemId: "fresh-fruits-1" });
  assert.equal(productQueries.at(-1)!.where.produceItemId, "fresh-fruits-1");
  await getProducts({ limit: 61 });
  assert.equal(productQueries.at(-1)!.take, 61);
  assert.equal(productQueries.length, 5);
  assert.deepEqual(policies.get("shop-products"), { revalidate: 120, tags: ["catalog"] });

  const now = new Date("2030-01-01T00:00:00Z");
  context.mock.timers.enable({ apis: ["Date"], now });
  const farmerRows = [
    { id: "no-certificate", verifiedAt: now, certifiedUntil: null, certifier: null, certificateNo: null, certificateUrl: null },
    { id: "expiring", verifiedAt: now, certifiedUntil: new Date(now.getTime() + 1000), certifier: "Test certifier", certificateNo: "TEST-1", certificateUrl: null },
  ];
  let farmerQueries = 0;
  const originalFarmerQuery = prisma.farmer.findMany;
  Object.assign(prisma.farmer, { findMany: async () => { farmerQueries += 1; return farmerRows; } });
  context.after(() => { Object.assign(prisma.farmer, { findMany: originalFarmerQuery }); });

  const { getHomeFarmers, getVerifiedFarmers } = await import("../src/lib/farmers");
  const initial = await getHomeFarmers();
  assert.deepEqual(initial.map((farmer) => farmer.id), ["no-certificate", "expiring"]);
  assert.ok(initial[0].verifiedAt instanceof Date);
  assert.ok(initial[1].certifiedUntil instanceof Date);
  context.mock.timers.tick(2000);
  assert.deepEqual((await getHomeFarmers()).map((farmer) => farmer.id), ["no-certificate"]);
  assert.equal(farmerQueries, 1);
  await getVerifiedFarmers();
  assert.equal(farmerQueries, 2);
  assert.deepEqual(policies.get("home-farmers"), { revalidate: 120, tags: ["catalog"] });
});