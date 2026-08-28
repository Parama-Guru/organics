import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

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
} satisfies Prisma.ProductSelect;

export type ProductSummary = Prisma.ProductGetPayload<{
  select: typeof productSummarySelect;
}>;

export function getFeaturedProducts(limit = 4) {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
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
  const { categorySlug, region, search, limit = 50 } = options;

  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(region ? { region: { equals: region, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { region: { contains: search, mode: "insensitive" } },
              { category: { name: { contains: search, mode: "insensitive" } } },
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
    where: { isActive: true, region: { not: null } },
    select: { region: true },
    distinct: ["region"],
    orderBy: { region: "asc" },
  });

  return rows.flatMap((row) => (row.region ? [row.region] : []));
}

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    select: productSummarySelect,
  });
}

export function getCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });
}
