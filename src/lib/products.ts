import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

// A listing is public only if the shop owns it (farmerId null, first-party) or
// its farmer has passed verification. Applied to EVERY public read, so a pending
// or suspended farmer cannot get product pages indexed.
export const publicProductWhere = {
  isActive: true,
  OR: [{ farmerId: null }, { farmer: { status: "VERIFIED" as const } }],
} satisfies Prisma.ProductWhereInput;

export const productSummarySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  priceCents: true,
  unit: true,
  emoji: true,
  imageUrl: true,
  region: true,
  stock: true,
  category: { select: { name: true, slug: true } },
  farmer: { select: { slug: true, farmName: true, region: true } },
} satisfies Prisma.ProductSelect;

export const productDetailSelect = {
  ...productSummarySelect,
  images: {
    select: { id: true, url: true, alt: true },
    orderBy: { position: "asc" as const },
  },
  farmer: {
    select: {
      slug: true,
      farmName: true,
      contactName: true,
      phone: true,
      region: true,
      about: true,
      verifiedAt: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type ProductSummary = Prisma.ProductGetPayload<{
  select: typeof productSummarySelect;
}>;

export type ProductDetail = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

export function getFeaturedProducts(limit = 4) {
  return prisma.product.findMany({
    where: { ...publicProductWhere, isFeatured: true },
    select: productSummarySelect,
    orderBy: { name: "asc" },
    take: limit,
  });
}

export function getProducts(options: {
  categorySlug?: string;
  region?: string;
  search?: string;
  limit?: number;
}) {
  const { categorySlug, region, search, limit = 60 } = options;

  return prisma.product.findMany({
    where: {
      ...publicProductWhere,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(region ? { region: { equals: region, mode: "insensitive" } } : {}),
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                  { region: { contains: search, mode: "insensitive" } },
                  { category: { name: { contains: search, mode: "insensitive" } } },
                  { farmer: { farmName: { contains: search, mode: "insensitive" } } },
                ],
              },
            ],
          }
        : {}),
    },
    select: productSummarySelect,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    take: limit,
  });
}

// Facet for the shop filters. Distinct on a nullable column still returns the
// null bucket, so it is filtered out in the query rather than afterwards.
export async function getRegions(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { ...publicProductWhere, region: { not: null } },
    select: { region: true },
    distinct: ["region"],
    orderBy: { region: "asc" },
  });

  return rows.flatMap((row) => (row.region ? [row.region] : []));
}

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { ...publicProductWhere, slug },
    select: productDetailSelect,
  });
}

export function getCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });
}
