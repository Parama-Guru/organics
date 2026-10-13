import assert from "node:assert/strict";
import test, { after } from "node:test";

import { PrismaClient } from "@prisma/client";

import { loadConfig } from "../conf/config";
import { getFarmerBySlug, getVerifiedFarmers } from "../src/lib/farmers";
import { getStoreBySlug, getVerifiedStores } from "../src/lib/stores";
import { productGalleryImages } from "../src/lib/products";
import { publicProductWhere } from "../src/lib/products";
import { hasAcceptableFarmerCertificate, publicFarmerWhere } from "../src/lib/farmer-certification";
import { randomUUID } from "node:crypto";

const configuredDatabase = loadConfig().database.postgres.url;
process.env.DATABASE_URL ||= configuredDatabase;
const databaseAvailable = Boolean(process.env.DATABASE_URL);
const prisma = databaseAvailable ? new PrismaClient() : null;

after(async () => {
  await prisma?.$disconnect();
});

test("product detail gallery leads with the current primary image without duplicates", () => {
  const oldImage = { id: "old", url: "/products/old.webp", alt: "Old image" };
  const imageUrl = "https://res.cloudinary.com/test-cloud/image/upload/v1/new.webp";
  const product = { id: "test", imageUrl, images: [oldImage] };
  assert.deepEqual(productGalleryImages(product).map((image) => image.url), [imageUrl, oldImage.url]);
  assert.equal(productGalleryImages({ ...product, images: [] })[0].url, imageUrl);
  const existing = { id: "new", url: imageUrl, alt: "Primary image" };
  assert.deepEqual(productGalleryImages({ ...product, images: [oldImage, existing] }), [existing, oldImage]);
  assert.deepEqual(productGalleryImages({ ...product, imageUrl: null }), [oldImage]);
  assert.deepEqual(product.images, [oldImage]);
});

test("public farmer queries exclude pending and expired records", { skip: !databaseAvailable }, async () => {
  const pending = await prisma!.farmer.findFirst({ where: { status: "PENDING" }, select: { slug: true } });
  if (pending) assert.equal(await getFarmerBySlug(pending.slug), null);

  const farmers = await getVerifiedFarmers();
  assert.ok(farmers.length > 0, "seed should publish at least one current farm");
  assert.ok(farmers.every((farmer) => hasAcceptableFarmerCertificate(farmer)));
});

test("approved uncertified farms publish and taxonomy items filter listings without cross-category matches", { skip: !databaseAvailable }, async () => {
  const rollback = new Error("rollback-test-fixture");
  await assert.rejects(prisma!.$transaction(async (transaction) => {
    const region = await transaction.region.findFirstOrThrow({ select: { id: true } });
    const item = await transaction.produceItem.findUniqueOrThrow({ where: { id: "fresh-fruits-1" } });
    const unique = randomUUID();
    const farmer = await transaction.farmer.create({ data: {
      farmName: "Test optional certificate", contactName: "Test", slug: `test-${unique}`,
      email: `${unique}@example.test`, phone: "+919876543210", regionId: region.id,
      status: "VERIFIED", produceItemId: item.id,
    } });
    assert.equal(await transaction.farmer.count({ where: { id: farmer.id, ...publicFarmerWhere() } }), 1);
    const product = await transaction.product.create({ data: {
      name: item.nameTa, nameTa: item.nameTa, slug: `test-product-${unique}`, description: "Test only",
      priceCents: 100, unit: "kg", farmerId: farmer.id, categoryId: item.categoryId, produceItemId: item.id,
    } });
    assert.equal(await transaction.product.count({ where: { id: product.id, produceItemId: item.id, ...publicProductWhere() } }), 1);
    assert.equal(await transaction.product.count({ where: { id: product.id, produceItemId: "fresh-vegetables-1", ...publicProductWhere() } }), 0);
    await transaction.farmer.update({ where: { id: farmer.id }, data: { certifier: "Test certifier", certificateNo: "TEST-1", certifiedUntil: new Date("2000-01-01") } });
    assert.equal(await transaction.farmer.count({ where: { id: farmer.id, ...publicFarmerWhere() } }), 0);
    assert.equal(await transaction.product.count({ where: { id: product.id, ...publicProductWhere() } }), 0);
    await transaction.farmer.update({ where: { id: farmer.id }, data: { certifier: null, certificateNo: null, certifiedUntil: null, status: "PENDING" } });
    assert.equal(await transaction.farmer.count({ where: { id: farmer.id, ...publicFarmerWhere() } }), 0);
    throw rollback;
  }, { timeout: 30000 }), (error) => error === rollback);
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
