import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { publicProductWhere, productSummarySelect, decodeSlug } from "./products";

const farmerCardSelect = () => ({
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
  _count: { select: { products: { where: publicProductWhere() } } },
}) satisfies Prisma.FarmerSelect;

export type FarmerCard = Prisma.FarmerGetPayload<{
  select: ReturnType<typeof farmerCardSelect>;
}>;

const publicFarmerWhere = (now = new Date()): Prisma.FarmerWhereInput => ({
  status: "VERIFIED",
  certifiedUntil: { gte: now },
});

// Only VERIFIED farms with a current certificate are ever listed. Search is
// deliberately limited to public fields; private email and phone data never
// become a discovery API while contact details are gated.
//
// Deliberately uncached: tests/database-boundaries.test.ts calls this directly
// to prove the boundary, and unstable_cache needs a request context it does not
// have. Caching here would mean testing a wrapper instead of the query.
export function getVerifiedFarmers(query = "") {
  const term = query.trim();
  return prisma.farmer.findMany({
    where: {
      ...publicFarmerWhere(),
      ...(term
        ? {
            OR: [
              { farmName: { contains: term, mode: "insensitive" } },
              { region: { name: { contains: term, mode: "insensitive" } } },
              { region: { nameTa: { contains: term, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: farmerCardSelect(),
    orderBy: { farmName: "asc" },
  });
}

export async function getFarmerBySlug(rawSlug: string) {
  // Route params arrive percent-encoded; see decodeSlug.
  const slug = decodeSlug(rawSlug);

  const farmer = await prisma.farmer.findFirst({
    where: { slug, ...publicFarmerWhere() },
    select: farmerCardSelect(),
  });

  if (!farmer) return null;

  const products = await prisma.product.findMany({
    where: { ...publicProductWhere(), farmer: { slug } },
    select: productSummarySelect,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return { farmer, products };
}
