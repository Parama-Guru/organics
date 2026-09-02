import assert from "node:assert/strict";
import test, { after } from "node:test";

import { PrismaClient } from "@prisma/client";

import { loadConfig } from "../conf/config";
import { getFarmerBySlug, getVerifiedFarmers } from "../src/lib/farmers";
import { getStoreBySlug, getVerifiedStores } from "../src/lib/stores";

const configuredDatabase = loadConfig().database.postgres.url;
process.env.DATABASE_URL ||= configuredDatabase;
const databaseAvailable = Boolean(process.env.DATABASE_URL);
const prisma = databaseAvailable ? new PrismaClient() : null;

after(async () => {
  await prisma?.$disconnect();
});

test("public farmer queries exclude pending and expired records", { skip: !databaseAvailable }, async () => {
  const pending = await prisma!.farmer.findFirst({ where: { status: "PENDING" }, select: { slug: true } });
  if (pending) assert.equal(await getFarmerBySlug(pending.slug), null);

  const farmers = await getVerifiedFarmers();
  assert.ok(farmers.length > 0, "seed should publish at least one current farm");
  assert.ok(farmers.every((farmer) => farmer.certifiedUntil && farmer.certifiedUntil > new Date()));
});

test("public farmer search matches a public district", { skip: !databaseAvailable }, async () => {
  const farmers = await getVerifiedFarmers("Erode");
  assert.ok(farmers.length > 0);
  assert.ok(farmers.every((farmer) => farmer.region.name === "Erode" || farmer.farmName.toLowerCase().includes("erode")));
});

test("public store queries exclude unverified records and support search", { skip: !databaseAvailable }, async () => {
  const pending = await prisma!.organicStore.findFirst({ where: { status: "PENDING" }, select: { slug: true } });
  if (pending) assert.equal(await getStoreBySlug(pending.slug), null);

  const stores = await getVerifiedStores("Coimbatore");
  assert.ok(stores.length > 0);
  assert.ok(stores.every((store) => store.region.name === "Coimbatore" || store.storeName.toLowerCase().includes("coimbatore")));
});
