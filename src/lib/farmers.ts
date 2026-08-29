import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { publicProductWhere, productSummarySelect } from "./products";

export const farmerCardSelect = {
  id: true,
  slug: true,
  farmName: true,
  contactName: true,
  region: true,
  about: true,
  aboutTa: true,
  verifiedAt: true,
  _count: { select: { products: { where: publicProductWhere } } },
} satisfies Prisma.FarmerSelect;

export type FarmerCard = Prisma.FarmerGetPayload<{ select: typeof farmerCardSelect }>;

// Only VERIFIED farmers are ever listed; PENDING/REJECTED/SUSPENDED stay invisible.
export function getVerifiedFarmers() {
  return prisma.farmer.findMany({
    where: { status: "VERIFIED" },
    select: farmerCardSelect,
    orderBy: { farmName: "asc" },
  });
}

export async function getFarmerBySlug(slug: string) {
  const farmer = await prisma.farmer.findFirst({
    where: { slug, status: "VERIFIED" },
    select: { ...farmerCardSelect, phone: true },
  });

  if (!farmer) return null;

  const products = await prisma.product.findMany({
    where: { ...publicProductWhere, farmer: { slug } },
    select: productSummarySelect,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return { farmer, products };
}

export function getFarmerRegions() {
  return prisma.farmer.findMany({
    where: { status: "VERIFIED" },
    select: { region: true },
    distinct: ["region"],
    orderBy: { region: "asc" },
  });
}
