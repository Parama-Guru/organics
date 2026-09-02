import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { DEFAULT_LOCALE, type Locale } from "./i18n/config";
import type { ProductSort } from "./product-query-schema";
import { prisma } from "./prisma";

// A listing is public only if its farm has passed verification. Every product has
// a farm, so there is no first-party escape hatch: a pending or suspended farm
// cannot get its product pages indexed. Applied to EVERY public read.
export function publicProductWhere(now = new Date()): Prisma.ProductWhereInput {
  return {
    isActive: true,
    farmer: {
      status: "VERIFIED",
      certifiedUntil: { gte: now },
    },
  };
}

export const productSummarySelect = {
  id: true,
  name: true,
  nameTa: true,
  slug: true,
  description: true,
  descriptionTa: true,
  priceCents: true,
  unit: true,
  emoji: true,
  imageUrl: true,
  region: { select: { slug: true, name: true, nameTa: true } },
  stock: true,
  category: { select: { name: true, nameTa: true, slug: true } },
  farmer: {
    select: {
      id: true,
      slug: true,
      farmName: true,
      verifiedAt: true,
      region: { select: { slug: true, name: true, nameTa: true } },
    },
  },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  ...productSummarySelect,
  images: {
    select: { id: true, url: true, alt: true },
    orderBy: { position: "asc" as const },
  },
  farmer: {
    select: {
      id: true,
      slug: true,
      farmName: true,
      contactName: true,
      phone: true,
      region: { select: { slug: true, name: true, nameTa: true } },
      about: true,
      aboutTa: true,
      photoUrl: true,
      verifiedAt: true,
      certifier: true,
      certificateNo: true,
      certifiedUntil: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type ProductSummary = Prisma.ProductGetPayload<{
  select: typeof productSummarySelect;
}>;

export type ProductDetail = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

/**
 * Cached: the same rows for every visitor, and each uncached read costs a full
 * round trip to a database that is not in the same region as the app.
 */
export const getFeaturedProducts = unstable_cache(
  async (limit = 4) =>
    prisma.product.findMany({
      where: { ...publicProductWhere(), isFeatured: true },
      select: productSummarySelect,
      orderBy: { name: "asc" },
      take: limit,
    }),
  ["featured-products"],
  { revalidate: 120, tags: ["catalog"] },
);

/** Other listings from the same farm, so a product page is not a dead end. */
export function getMoreFromFarm(farmerSlug: string, excludeSlug: string, limit = 4) {
  return prisma.product.findMany({
    where: { ...publicProductWhere(), farmer: { slug: farmerSlug }, slug: { not: excludeSlug } },
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
//
// Every branch searches the Tamil column as well as the English one. Omitting
// them meant a Tamil-only site could not find its own produce: "தக்காளி"
// returned nothing while நாட்டுத் தக்காளி sat on the page behind the search box.
async function searchProductIds(term: string): Promise<string[]> {
  const pattern = likePattern(term);

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product"
      WHERE "isActive"
        AND (name ILIKE ${pattern} OR description ILIKE ${pattern}
          OR "nameTa" ILIKE ${pattern} OR "descriptionTa" ILIKE ${pattern})
    UNION
    SELECT p.id FROM "Product" p
      JOIN "Region" r ON r.id = p."regionId"
      WHERE p."isActive" AND (r.name ILIKE ${pattern} OR r."nameTa" ILIKE ${pattern})
    UNION
    SELECT p.id FROM "Product" p
      JOIN "Farmer" f ON f.id = p."farmerId"
      WHERE p."isActive" AND f."farmName" ILIKE ${pattern}
    UNION
    SELECT p.id FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      WHERE p."isActive" AND (c.name ILIKE ${pattern} OR c."nameTa" ILIKE ${pattern})
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
  sort?: ProductSort;
  limit?: number;
  locale?: Locale;
}) {
  const { categorySlug, region, search, sort = "name", limit = 60, locale = DEFAULT_LOCALE } = options;

  // The unfiltered shop is the single most requested view and is identical for
  // every visitor, so it is worth keeping. Filtered and searched views are not
  // cached: one entry per combination of chips and phrases would be unbounded.
  //
  // Safe to cache because the only Date in productSummarySelect is
  // farmer.verifiedAt, and checkedOn takes the string that survives JSON.
  if (!categorySlug && !region && !search?.trim() && sort === "name" && limit === 60) {
    return listProductsCached(locale);
  }

  return listProducts({ categorySlug, region, search, sort, limit, locale });
}

const listProductsCached = unstable_cache(
  (locale: Locale) => listProducts({ locale }),
  ["shop-products"],
  { revalidate: 120, tags: ["catalog"] },
);

async function listProducts(options: {
  categorySlug?: string;
  region?: string;
  search?: string;
  sort?: ProductSort;
  limit?: number;
  locale?: Locale;
}) {
  const { categorySlug, region, search, sort = "name", limit = 60, locale = DEFAULT_LOCALE } = options;

  const searchIds = search?.trim() ? await searchProductIds(search.trim()) : null;

  // An empty result short-circuits instead of sending `IN ()` to Postgres.
  if (searchIds !== null && searchIds.length === 0) return [];

  // The chip says "அகரவரிசை" — Tamil alphabetical order. Sorting by the English
  // `name` delivered A2, Bilona, Farm butter… which to a Tamil reader is random
  // noise, because the key being sorted is not the text on screen. Sort by the
  // column actually being displayed. `nameTa` is nullable, so fall back to the
  // English name for any listing that has not been translated yet.
  const nameOrder: Prisma.ProductOrderByWithRelationInput[] =
    locale === "ta" ? [{ nameTa: { sort: "asc", nulls: "last" } }, { name: "asc" }] : [{ name: "asc" }];

  // Grouping by category put every dairy line first, and one farm supplies all
  // of them — the grid opened with five identical farm names. Sorting by product
  // name interleaves farms and categories instead.
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ priceCents: "asc" }, ...nameOrder]
      : sort === "price-desc"
        ? [{ priceCents: "desc" }, ...nameOrder]
        : nameOrder;

  return prisma.product.findMany({
    where: {
      ...publicProductWhere(),
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(region ? { region: { slug: region } } : {}),
      ...(searchIds ? { id: { in: searchIds } } : {}),
    },
    select: productSummarySelect,
    orderBy,
    take: limit,
  });
}

// Facets are read on every shop request but only change when the catalogue does.
// Cached so clicking a filter does not pay for them again.
export const getRegions = unstable_cache(
  async () =>
    prisma.region.findMany({
      // Only districts that actually have something listed.
      where: { products: { some: publicProductWhere() } },
      select: { slug: true, name: true, nameTa: true },
      // Ordered by the Tamil name, because that is what the chips display. By
      // English name the row read குடகு, ஈரோடு, இமாசலம், நீலகிரி — sorted by a
      // key the reader cannot see.
      orderBy: [{ nameTa: { sort: "asc", nulls: "last" } }, { name: "asc" }],
    }),
  ["shop-regions"],
  { revalidate: 300, tags: ["catalog"] },
);

/**
 * Every district with a centre on the map. Public reference data, so it is safe
 * to hand to the browser, which is where the distance comparison happens.
 */
export const getLocatedRegions = unstable_cache(
  async () =>
    prisma.region.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: { slug: true, name: true, nameTa: true, latitude: true, longitude: true },
      orderBy: { name: "asc" },
    }),
  ["located-regions"],
  { revalidate: 300, tags: ["catalog"] },
);

/**
 * Route params arrive percent-encoded, unlike search params. An ASCII slug is
 * unchanged by encoding, so this went unnoticed until a Tamil slug existed:
 * the page looked up "%E0%AE%9A%E0%AF%8B..." and 404ed on its own link.
 */
export function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    // Malformed escapes: no slug can equal it anyway, so let the lookup miss
    // rather than throw a 500 at anyone who mistypes a URL.
    return raw;
  }
}

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { ...publicProductWhere(), slug: decodeSlug(slug) },
    select: productDetailSelect,
  });
}

export const getCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        nameTa: true,
        slug: true,
        description: true,
        descriptionTa: true,
        // One representative listing, so the category tiles show produce rather
        // than six identically shaped boxes of text.
        products: {
          where: publicProductWhere(),
          select: { imageUrl: true },
          orderBy: { name: "asc" },
          take: 1,
        },
        _count: { select: { products: { where: publicProductWhere() } } },
      },
      orderBy: { name: "asc" },
    }),
  ["shop-categories"],
  { revalidate: 300, tags: ["catalog"] },
);
