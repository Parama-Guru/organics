import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { publicProductWhere, productSummarySelect, decodeSlug } from "./products";

const farmerCardSelect = {
  id: true,
  slug: true,
  farmName: true,
  contactName: true,
  phone: true,
  region: true,
  about: true,
  aboutTa: true,
  photoUrl: true,
  verifiedAt: true,
  certifier: true,
  certificateNo: true,
  certificateUrl: true,
  certifiedUntil: true,
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

export async function getFarmerBySlug(rawSlug: string) {
  // Route params arrive percent-encoded; see decodeSlug.
  const slug = decodeSlug(rawSlug);

  const farmer = await prisma.farmer.findFirst({
    where: { slug, status: "VERIFIED" },
    select: farmerCardSelect,
  });

  if (!farmer) return null;

  const products = await prisma.product.findMany({
    where: { ...publicProductWhere, farmer: { slug } },
    select: productSummarySelect,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return { farmer, products };
}
