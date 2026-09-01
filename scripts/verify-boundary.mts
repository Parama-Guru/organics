/**
 * Scratch harness: proves the farmer portal's authorization boundary.
 *
 * Not part of the app. Run with:
 *   npx tsx --conditions=react-server scripts/verify-boundary.mts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

import { loadConfig } from "../conf/config";

// tsx runs this directly, so prisma.config.ts never loads.
const postgres = loadConfig().database.postgres;
process.env.DATABASE_URL ||= postgres.url;
process.env.DIRECT_URL ||= postgres.direct_url || postgres.url;

const {
  createFarmerProduct,
  deleteFarmerProduct,
  getFarmerProduct,
  listFarmerProducts,
  setFarmerProductActive,
  updateFarmerProduct,
} = await import("../src/lib/farmer-products");

const prisma = new PrismaClient();

let failures = 0;
function check(label: string, passed: boolean) {
  if (!passed) failures += 1;
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
}

const [a, b] = await prisma.farmer.findMany({
  where: { status: "VERIFIED" },
  orderBy: { farmName: "asc" },
  take: 2,
  select: { id: true, slug: true, farmName: true },
});

if (!a || !b) throw new Error("Need two verified farms in the database.");
console.log(`Farm A: ${a.farmName}\nFarm B: ${b.farmName}\n`);

const category = await prisma.category.findFirstOrThrow({ select: { id: true } });

const base = {
  nameTa: "எல்லைச் சோதனை",
  name: "Boundary Test Gourd",
  descriptionTa: "சோதனைக்காக உருவாக்கப்பட்டது.",
  description: "Created by the authorization boundary harness and deleted again.",
  price: "42.50",
  unit: "kg",
  categoryId: category.id,
  regionId: "",
  stock: "5",
  isActive: "on",
} as const;

// Farm B publishes something. Farm A will now try every way in.
const victim = await createFarmerProduct(b.id, b.slug, { ...base });
console.log(`Farm B listing: ${victim.id}\n`);

check("A cannot read B's listing", (await getFarmerProduct(a.id, victim.id)) === null);
check("B can read its own listing", (await getFarmerProduct(b.id, victim.id)) !== null);

check(
  "A cannot edit B's listing",
  (await updateFarmerProduct(a.id, victim.id, { ...base, name: "HIJACKED", price: "1.00" })) ===
    false,
);

const afterEdit = await prisma.product.findUniqueOrThrow({
  where: { id: victim.id },
  select: { name: true, priceCents: true, farmerId: true },
});
check("B's listing is untouched", afterEdit.name === base.name && afterEdit.priceCents === 4250);
check("B's listing still belongs to B", afterEdit.farmerId === b.id);

check(
  "A cannot hide B's listing",
  (await setFarmerProductActive(a.id, victim.id, false)) === false,
);
const afterHide = await prisma.product.findUniqueOrThrow({
  where: { id: victim.id },
  select: { isActive: true },
});
check("B's listing is still visible", afterHide.isActive === true);

check("A cannot delete B's listing", (await deleteFarmerProduct(a.id, victim.id)) === false);
check(
  "B's listing still exists",
  (await prisma.product.count({ where: { id: victim.id } })) === 1,
);

const aList = await listFarmerProducts(a.id);
check("A's list does not contain B's listing", !aList.some((p) => p.id === victim.id));

// A new listing is stamped with the caller's farm, not anything from the input.
const mine = await createFarmerProduct(a.id, a.slug, { ...base, name: "Boundary Test Own" });
const mineRow = await prisma.product.findUniqueOrThrow({
  where: { id: mine.id },
  select: { farmerId: true },
});
check("A's new listing belongs to A", mineRow.farmerId === a.id);
check("B can edit its own listing", (await updateFarmerProduct(b.id, victim.id, {
  ...base,
  name: "Boundary Test Gourd Edited",
})) === true);
check("B can delete its own listing", (await deleteFarmerProduct(b.id, victim.id)) === true);
check("A can delete its own listing", (await deleteFarmerProduct(a.id, mine.id)) === true);

await prisma.product.deleteMany({ where: { id: { in: [victim.id, mine.id] } } });
await prisma.$disconnect();

console.log(failures === 0 ? "\nAll boundary checks passed." : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
