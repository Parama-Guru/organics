import type { MetadataRoute } from "next";

import { loadConfig } from "@conf/config";
import { DEFAULT_LOCALE, localePath } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import { publicProductWhere } from "@/lib/products";

// The catalog lives in Postgres, which is not reachable while the image builds.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = loadConfig().app.site_url.replace(/\/$/, "");

  // Only the locale actually served. Listing /en while the proxy redirects it
  // to /ta would spend the crawl budget on redirects.
  const url = (path: string) => `${base}${encodeURI(localePath(DEFAULT_LOCALE, path))}`;

  const [products, farmers, stores] = await Promise.all([
    prisma.product.findMany({
      where: publicProductWhere,
      select: { slug: true, updatedAt: true },
    }),
    prisma.farmer.findMany({
      where: { status: "VERIFIED" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.organicStore.findMany({
      where: { status: "VERIFIED" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const pages: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: url("/farmers"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/stores"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/sell"), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/stores/register"), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/contact"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/careers"), changeFrequency: "monthly", priority: 0.4 },
    { url: url("/how-we-check"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...pages,
    ...products.map((p) => ({
      url: url(`/products/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...farmers.map((f) => ({
      url: url(`/farmers/${f.slug}`),
      lastModified: f.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...stores.map((s) => ({
      url: url(`/stores/${s.slug}`),
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
