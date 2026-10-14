import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "./prisma";
import { publicProductWhere, productSummarySelect, decodeSlug } from "./products";
import { hasAcceptableFarmerCertificate, publicFarmerWhere } from "./farmer-certification";

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

// Only staff-approved farms with absent or current certificate evidence are listed. Search is
// deliberately limited to public fields; private email and phone data never
// become a discovery API while contact details are gated.
//
// Deliberately uncached: tests/database-boundaries.test.ts calls this directly
// to prove the boundary, and unstable_cache needs a request context it does not
// have. Caching here would mean testing a wrapper instead of the query.
export function getVerifiedFarmers(query = "", regionSlug = "") {
  const term = query.trim();
  return prisma.farmer.findMany({
    where: {
      ...publicFarmerWhere(),
      ...(regionSlug ? { region: { slug: regionSlug } } : {}),
      ...(term
        ? {
            AND: [{ OR: [
              { farmName: { contains: term, mode: "insensitive" } },
              { region: { name: { contains: term, mode: "insensitive" } } },
              { region: { nameTa: { contains: term, mode: "insensitive" } } },
            ] }],
          }
        : {}),
    },
    select: farmerCardSelect(),
    orderBy: { farmName: "asc" },
  });
}

const listHomeFarmersCached = unstable_cache(
  () => getVerifiedFarmers(),
  ["home-farmers"],
  { revalidate: 120, tags: ["catalog"] },
);

export async function getHomeFarmers() {
  const farmers = await listHomeFarmersCached();
  return farmers
    .map((farmer) => ({
      ...farmer,
      verifiedAt: farmer.verifiedAt ? new Date(farmer.verifiedAt) : null,
      certifiedUntil: farmer.certifiedUntil ? new Date(farmer.certifiedUntil) : null,
    }))
    .filter((farmer) => hasAcceptableFarmerCertificate(farmer));
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
    where: { ...publicProductWhere(), farmer: { ...publicFarmerWhere(), slug } },
    select: productSummarySelect,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return { farmer, products };
}
