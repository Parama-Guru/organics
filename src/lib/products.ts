import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

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

// `%` and `_` are LIKE wildcards. Left unescaped, typing "%" matches the entire
// catalogue and defeats the index.
function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

// Postgres cannot use an index for an OR that spans two tables, so the obvious
// single query with `OR farmer.farmName ILIKE ...` degrades to a sequential scan
// (measured: 87ms at 20k rows vs 0.4ms for this form). A UNION lets the planner
// pick the trigram index for each branch independently.
async function searchProductIds(term: string): Promise<string[]> {
  const pattern = likePattern(term);

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product"
      WHERE "isActive"
        AND (name ILIKE ${pattern} OR description ILIKE ${pattern} OR region ILIKE ${pattern})
    UNION
    SELECT p.id FROM "Product" p
      JOIN "Farmer" f ON f.id = p."farmerId"
      WHERE p."isActive" AND f."farmName" ILIKE ${pattern}
    UNION
    SELECT p.id FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      WHERE p."isActive" AND c.name ILIKE ${pattern}
    -- Bounded so a term matching most of the catalogue cannot build a huge IN list.
    -- Past this size the answer is pagination, not a longer list.
    LIMIT 5000
  `;

  return rows.map((row) => row.id);
}

export async function getProducts(options: {
  categorySlug?: string;
  region?: string;
  search?: string;
  limit?: number;
}) {
  const { categorySlug, region, search, limit = 60 } = options;

  const searchIds = search?.trim() ? await searchProductIds(search.trim()) : null;

  // An empty result short-circuits instead of sending `IN ()` to Postgres.
  if (searchIds !== null && searchIds.length === 0) return [];

  return prisma.product.findMany({
    where: {
      ...publicProductWhere,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(region ? { region: { equals: region, mode: "insensitive" } } : {}),
      ...(searchIds ? { id: { in: searchIds } } : {}),
    },
    select: productSummarySelect,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    take: limit,
  });
}

// Facets are read on every shop request but only change when the catalogue does,
// and the distinct-region query scans the whole table. Cached so clicking a
// filter does not pay for them again.
export const getRegions = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await prisma.product.findMany({
      where: { ...publicProductWhere, region: { not: null } },
      select: { region: true },
      distinct: ["region"],
      orderBy: { region: "asc" },
    });

    return rows.flatMap((row) => (row.region ? [row.region] : []));
  },
  ["shop-regions"],
  { revalidate: 300, tags: ["catalog"] },
);

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { ...publicProductWhere, slug },
    select: productDetailSelect,
  });
}

export const getCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, description: true },
      orderBy: { name: "asc" },
    }),
  ["shop-categories"],
  { revalidate: 300, tags: ["catalog"] },
);
