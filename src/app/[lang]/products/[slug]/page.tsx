import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { FarmerContact, dialNumber, showFarmerPhone } from "@/components/farmer-contact";
import { ProductGallery } from "@/components/product-gallery";
import { SaveButton } from "@/components/save-button";
import { StickyCallBar } from "@/components/sticky-call-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, BookmarkIcon, LeafMark, MapPinIcon, PhoneIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { format, localePath } from "@/lib/i18n/config";
import { localised, regionLabel, unitLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { getMoreFromFarm, getProductBySlug } from "@/lib/products";
import { isProductSaved } from "@/lib/saved";

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
  const name = localised(locale, product.name, product.nameTa);
  const accountsOn = accountsEnabled();
  const customer = accountsOn ? await getCustomer() : null;
  const phoneShown = showFarmerPhone();
  const [more, saved] = await Promise.all([
    getMoreFromFarm(product.farmer.slug, product.slug, 4),
    customer ? isProductSaved(customer.id, product.id) : Promise.resolve(false),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pb-10">
      <Link
        href={localePath(locale, "/products")}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-bark-600 transition-colors hover:text-bark-900"
      >
        <ArrowLeftIcon /> {t.product.backToShop}
      </Link>

      <div className="mt-6 grid animate-rise gap-8 md:grid-cols-2 md:gap-10">
        <ProductGallery images={product.images} name={name} emoji={product.emoji} />

        <div className="flex flex-col">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-leaf-700">
            <span>{localised(locale, product.category.name, product.category.nameTa)}</span>
            {product.region ? (
              <span className="inline-flex items-center gap-1 text-bark-600">
                <MapPinIcon />
                {format(t.product.grownIn, { region: regionLabel(locale, product.region) })}
              </span>
            ) : null}
          </p>

          <h1 className="mt-2 font-display text-[2rem] leading-tight break-words sm:text-[2.75rem]">
            {name}
          </h1>

          {/* Who you are about to phone, named before the price rather than two
              thirds of the way down the page. */}
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-lg">
            <LeafMark aria-hidden className="text-leaf-600" />
            <span className="text-bark-600">{t.products.listedBy}</span>
            <Link
              href={localePath(locale, `/farmers/${product.farmer.slug}`)}
              className="font-semibold text-bark-900 decoration-marigold-500 decoration-2 underline-offset-4 hover:underline"
            >
              {product.farmer.farmName}
            </Link>
          </p>

          <p className="mt-4 leading-relaxed text-ink">
            {localised(locale, product.description, product.descriptionTa)}
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="whitespace-nowrap font-display text-4xl leading-tight">
              {formatMoney(product.priceCents)}
            </p>
            <p className="pb-1 text-bark-600">
              {format(t.products.perUnit, { unit: unitLabel(locale, product.unit) })}
            </p>
          </div>

          <p
            className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 font-medium ${
              inStock ? "bg-leaf-100 text-leaf-800" : "bg-bark-100 text-bark-600"
            }`}
          >
            {inStock ? (phoneShown ? t.product.inStock : t.product.inStockSoon) : t.product.unavailable}
          </p>

          {/* The point of the site is the call, so the number is the button rather
              than an anchor that scrolls to one. */}
          <div className="mt-7 flex flex-wrap gap-3">
            {showFarmerPhone() ? (
              <Button as="a" href={`tel:${dialNumber(product.farmer.phone)}`} size="lg">
                <PhoneIcon /> {product.farmer.phone}
              </Button>
            ) : null}
            <Button
              as="a"
              href="#contact"
              variant={showFarmerPhone() ? "secondary" : "primary"}
              size="lg"
            >
              {format(t.product.aboutFarm, { farm: product.farmer.farmName })}
            </Button>
            {accountsOn ? (
              customer ? (
                <SaveButton kind="product" id={product.id} initialSaved={saved} size="lg" />
              ) : (
                <Button
                  as={Link}
                  href={localePath(locale, "/account/sign-in")}
                  variant="ghost"
                  size="lg"
                >
                  <BookmarkIcon /> {t.account.signInToSave}
                </Button>
              )
            ) : null}
          </div>

          {product.farmer.verifiedAt ? (
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-bark-600">
              <ShieldCheckIcon className="text-base text-leaf-700" />
              {format(t.product.soldBy, { farm: product.farmer.farmName })}
              <Link
                href={localePath(locale, "/how-we-check")}
                className="inline-flex min-h-11 items-center font-medium text-bark-900 underline-offset-4 hover:underline"
              >
                {t.product.howWeCheck}
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      <FarmerContact farmer={product.farmer} />

      {more.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-display text-2xl sm:text-3xl">
            {format(t.product.moreFromFarm, { farm: product.farmer.farmName })}
            <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-leaf-500" />
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {more.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <StickyCallBar phone={product.farmer.phone} />
    </div>
  );
}
