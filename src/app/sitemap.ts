import type { MetadataRoute } from "next";

import { loadConfig } from "@conf/config";
import { DEFAULT_LOCALE, ENABLED_LOCALES, localePath } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import { publicProductWhere } from "@/lib/products";

// The catalog lives in Postgres, which is not reachable while the image builds.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = loadConfig().app.site_url.replace(/\/$/, "");
  const href = (locale: string, path: string) =>
    `${base}${encodeURI(localePath(locale as never, path))}`;

  /**
   * One entry per path, canonical in the default locale, with every other
   * enabled locale declared as an alternate. Emitting each locale as its own
   * top-level entry instead would offer the same page several times over and
   * leave Google to guess which is canonical.
   */
  const entry = (path: string, extra: Omit<MetadataRoute.Sitemap[number], "url">) => ({
    url: href(DEFAULT_LOCALE, path),
    ...extra,
    alternates: {
      languages: Object.fromEntries(ENABLED_LOCALES.map((l) => [l, href(l, path)])),
    },
  });

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

  return [
    entry("/", { changeFrequency: "daily", priority: 1 }),
    entry("/products", { changeFrequency: "daily", priority: 0.9 }),
    entry("/farmers", { changeFrequency: "weekly", priority: 0.9 }),
    entry("/stores", { changeFrequency: "weekly", priority: 0.9 }),
    entry("/sell", { changeFrequency: "monthly", priority: 0.7 }),
    entry("/stores/register", { changeFrequency: "monthly", priority: 0.7 }),
    entry("/contact", { changeFrequency: "monthly", priority: 0.6 }),
    entry("/careers", { changeFrequency: "monthly", priority: 0.4 }),
    entry("/how-we-check", { changeFrequency: "monthly", priority: 0.6 }),
    entry("/privacy", { changeFrequency: "yearly", priority: 0.3 }),
    ...products.map((p) =>
      entry(`/products/${p.slug}`, {
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    ),
    ...farmers.map((f) =>
      entry(`/farmers/${f.slug}`, {
        lastModified: f.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    ),
    ...stores.map((s) =>
      entry(`/stores/${s.slug}`, {
        lastModified: s.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    ),
  ];
}
