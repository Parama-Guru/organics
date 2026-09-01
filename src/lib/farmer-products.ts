import "server-only";

import { z } from "zod";

import { prisma } from "./prisma";
import { regionIdFromExisting } from "./regions";

/**
 * Every function here takes `farmerId` and puts it in the WHERE clause, so a
 * caller cannot address another farm's row even by guessing an id. That is the
 * whole authorisation boundary for the portal: the id comes from the session
 * and never from the request body.
 */

export const farmerProductSchema = z.object({
  // Tamil is what a shopper actually reads, so it is the required copy and the
  // English columns are the optional extra — not the other way round. A farm
  // that types only Tamil gets a complete listing.
  nameTa: z.string().trim().min(2, "name is too short").max(120),
  name: z.string().trim().max(120).optional(),
  descriptionTa: z.string().trim().min(10, "describe it in a sentence").max(600),
  description: z.string().trim().max(600).optional(),
  // Entered in rupees, stored in paise: floats lose money.
  price: z
    .string()
    .trim()
    .regex(/^\d{1,7}(\.\d{1,2})?$/, "enter a price like 149 or 149.50"),
  unit: z.string().trim().min(1, "give a unit").max(40),
  categoryId: z.string().trim().min(1, "choose a category"),
  // A district id from the list, never free text: hand-typed districts both
  // invented duplicate browsing facets and, in Tamil, crashed on a slug clash.
  regionId: z.string().trim().max(60).optional(),
  // How much is ready to sell. The public page reads stock to decide whether a
  // listing says "available now", so leaving this off the form published every
  // farmer-made listing as unavailable.
  stock: z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, "enter a whole number")
    .optional(),
  isActive: z.union([z.literal("on"), z.literal("")]).optional(),
});

export type FarmerProductInput = z.infer<typeof farmerProductSchema>;

// The English columns are NOT NULL and feed English search, so a blank one
// mirrors the Tamil rather than storing an empty string.
function englishName(input: FarmerProductInput): string {
  return input.name || input.nameTa;
}

function englishDescription(input: FarmerProductInput): string {
  return input.description || input.descriptionTa;
}

function stockOf(input: FarmerProductInput): number {
  return input.stock ? Number(input.stock) : 0;
}

export function priceToPaise(price: string): number {
  const [whole, fraction = ""] = price.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

export function paiseToPrice(paise: number): string {
  return (paise / 100).toFixed(2).replace(/\.00$/, "");
}

/** Slug is derived once and kept, so a rename never breaks a shared link. */
async function uniqueSlug(name: string, farmSlug: string): Promise<string> {
  // NFC, and combining marks kept. NFKD plus a letters-only filter tears the
  // vowel signs off Tamil — "சோதனை" came out as "ச-தன" — because those signs
  // are marks, not letters.
  const base =
    name
      .toLowerCase()
      .normalize("NFC")
      .replace(/[^\p{Letter}\p{Mark}\p{Number}]+/gu, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "listing";

  for (let attempt = 0; attempt < 40; attempt++) {
    const slug = attempt === 0 ? `${base}-${farmSlug}` : `${base}-${farmSlug}-${attempt + 1}`;
    const clash = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!clash) return slug;
  }

  return `${base}-${Date.now()}`;
}

export function listFarmerProducts(farmerId: string) {
  return prisma.product.findMany({
    where: { farmerId },
    select: {
      id: true,
      name: true,
      nameTa: true,
      slug: true,
      priceCents: true,
      unit: true,
      stock: true,
      imageUrl: true,
      isActive: true,
      createdAt: true,
      category: { select: { id: true, name: true, nameTa: true } },
      region: { select: { name: true, nameTa: true } },
      _count: { select: { savedBy: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getFarmerProduct(farmerId: string, productId: string) {
  return prisma.product.findFirst({
    where: { id: productId, farmerId },
    select: {
      id: true,
      name: true,
      nameTa: true,
      description: true,
      descriptionTa: true,
      priceCents: true,
      unit: true,
      stock: true,
      isActive: true,
      categoryId: true,
      regionId: true,
    },
  });
}

export async function createFarmerProduct(
  farmerId: string,
  farmSlug: string,
  input: FarmerProductInput,
) {
  const regionId = await regionIdFromExisting(input.regionId);

  return prisma.product.create({
    data: {
      farmerId,
      slug: await uniqueSlug(englishName(input), farmSlug),
      name: englishName(input),
      nameTa: input.nameTa,
      description: englishDescription(input),
      descriptionTa: input.descriptionTa,
      priceCents: priceToPaise(input.price),
      unit: input.unit,
      categoryId: input.categoryId,
      regionId,
      stock: stockOf(input),
      isActive: input.isActive === "on",
      // Only staff decide what is promoted on the home page.
      isFeatured: false,
    },
    select: { id: true },
  });
}

export async function updateFarmerProduct(
  farmerId: string,
  productId: string,
  input: FarmerProductInput,
) {
  const regionId = await regionIdFromExisting(input.regionId);

  // updateMany, not update: it takes a WHERE, so a mismatched farmerId changes
  // nothing instead of throwing after the fact.
  const result = await prisma.product.updateMany({
    where: { id: productId, farmerId },
    data: {
      name: englishName(input),
      nameTa: input.nameTa,
      description: englishDescription(input),
      descriptionTa: input.descriptionTa,
      priceCents: priceToPaise(input.price),
      unit: input.unit,
      categoryId: input.categoryId,
      regionId,
      stock: stockOf(input),
      isActive: input.isActive === "on",
    },
  });

  return result.count === 1;
}

export async function deleteFarmerProduct(farmerId: string, productId: string): Promise<boolean> {
  const result = await prisma.product.deleteMany({ where: { id: productId, farmerId } });
  return result.count === 1;
}

export async function setFarmerProductActive(
  farmerId: string,
  productId: string,
  isActive: boolean,
): Promise<boolean> {
  const result = await prisma.product.updateMany({
    where: { id: productId, farmerId },
    data: { isActive },
  });
  return result.count === 1;
}
