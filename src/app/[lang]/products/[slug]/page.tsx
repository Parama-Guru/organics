import Link from "next/link";
import { notFound } from "next/navigation";

import { FarmerContact } from "@/components/farmer-contact";
import { ProductGallery } from "@/components/product-gallery";
import { Button } from "@/components/ui/button";
import { format, localePath } from "@/lib/i18n/config";
import { localised, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { getProductBySlug } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">) {
  const { slug } = await params;
  const [product, locale, t] = await Promise.all([
    getProductBySlug(slug),
    getLocale(),
    getDictionary(),
  ]);

  if (!product) return { title: t.meta.productNotFound };

  return {
    title: localised(locale, product.name, product.nameTa),
    description: localised(locale, product.description, product.descriptionTa),
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  const { slug } = await params;
  const [product, locale, t] = await Promise.all([
    getProductBySlug(slug),
    getLocale(),
    getDictionary(),
  ]);

  if (!product) notFound();

  const inStock = product.stock > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href={localePath(locale, "/products")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-bark-600 transition-colors hover:text-bark-900"
      >
        <span aria-hidden>&larr;</span> {t.product.backToShop}
      </Link>

      <div className="mt-6 grid animate-rise gap-8 sm:grid-cols-2">
        <ProductGallery
          images={product.images}
          name={localised(locale, product.name, product.nameTa)}
          emoji={product.emoji}
        />

        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-leaf-700">
            {localised(locale, product.category.name, product.category.nameTa)}
            {product.region ? (
              <span className="text-bark-600">
                {" "}
                &middot; {format(t.product.grownIn, { region: regionLabel(locale, product.region) })}
              </span>
            ) : null}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight break-words sm:text-4xl">
            {localised(locale, product.name, product.nameTa)}
          </h1>

          <p className="mt-4 text-bark-600">
            {localised(locale, product.description, product.descriptionTa)}
          </p>

          <div className="mt-6 flex items-end gap-3">
            <p className="font-display text-3xl leading-none">{formatMoney(product.priceCents)}</p>
            <p className="pb-1 text-sm text-bark-600">
              {format(t.products.perUnit, { unit: product.unit })}
            </p>
          </div>

          <p
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              inStock ? "bg-leaf-100 text-leaf-800" : "bg-bark-100 text-bark-600"
            }`}
          >
            {inStock
              ? format(t.product.inStock, { count: product.stock })
              : t.product.unavailable}
          </p>

          <Button as="a" href="#contact" size="lg" className="mt-6">
            {format(t.product.contactFarm, { farm: product.farmer.farmName })}
            <span aria-hidden>&darr;</span>
          </Button>
        </div>
      </div>

      <FarmerContact farmer={product.farmer} />
    </div>
  );
}
