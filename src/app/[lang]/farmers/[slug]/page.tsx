import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFarmerBySlug } from "@/lib/farmers";
import { localePath } from "@/lib/i18n/config";
import { localisedOrNull, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/farmers/[slug]">) {
  const { slug } = await params;
  const [result, t] = await Promise.all([getFarmerBySlug(slug), getDictionary()]);

  if (!result) return { title: t.meta.farmNotFound };

  return {
    title: result.farmer.farmName,
    description: result.farmer.about ?? result.farmer.farmName,
  };
}

export default async function FarmerPage({ params }: PageProps<"/[lang]/farmers/[slug]">) {
  const { slug } = await params;
  const [result, locale, t] = await Promise.all([
    getFarmerBySlug(slug),
    getLocale(),
    getDictionary(),
  ]);

  if (!result) notFound();

  const { farmer, products } = result;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href={localePath(locale, "/farmers")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-bark-600 transition-colors hover:text-bark-900"
      >
        <span aria-hidden>&larr;</span> {t.farmers.backToAll}
      </Link>

      <header className="glass mt-6 animate-rise rounded-3xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="leaf">
                <span aria-hidden>&#10003;</span> {t.farmers.verified}
              </Badge>
              <Badge tone="neutral">{regionLabel(locale, farmer.region)}</Badge>
            </div>
            <h1 className="mt-4 font-display text-3xl break-words sm:text-4xl">
              {farmer.farmName}
            </h1>
            <p className="mt-1 text-bark-600">{farmer.contactName}</p>
          </div>

          <Button as="a" href={`tel:${farmer.phone.replace(/[^\d+]/g, "")}`} size="lg">
            <span aria-hidden>&#9742;</span> {farmer.phone}
          </Button>
        </div>

        {farmer.about ? (
          <p className="mt-5 max-w-3xl text-bark-600">
            {localisedOrNull(locale, farmer.about, farmer.aboutTa)}
          </p>
        ) : null}
      </header>

      <h2 className="mt-12 font-display text-2xl">
        {t.farmers.fromThisFarm}
        <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-leaf-500" />
      </h2>

      {products.length === 0 ? (
        <p className="glass mt-5 rounded-3xl p-10 text-center text-bark-600">
          {t.farmers.nothingListed}
        </p>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
              className="animate-rise"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
