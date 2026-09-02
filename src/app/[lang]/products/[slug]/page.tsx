import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { FarmerEnquiryForm } from "@/components/farmer-enquiry-form";
import { FarmerContact, dialNumber, showFarmerPhone } from "@/components/farmer-contact";
import { MemberGate } from "@/components/member-gate";
import { ProductGallery } from "@/components/product-gallery";
import { SaveButton } from "@/components/save-button";
import { StickyCallBar } from "@/components/sticky-call-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, BookmarkIcon, LeafMark, MapPinIcon, PhoneIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { getCustomerAccess } from "@/lib/customer-access";
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
  const returnPath = localePath(locale, `/products/${product.slug}`);
  const [more, saved, access] = await Promise.all([
    getMoreFromFarm(product.farmer.slug, product.slug, 4),
    customer ? isProductSaved(customer.id, product.id) : Promise.resolve(false),
    customer ? getCustomerAccess(customer.id) : Promise.resolve(null),
  ]);
  const sellerUnlocked = Boolean(customer && access?.allowed);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 sm:pb-14 sm:pt-14">
      <Link
        href={localePath(locale, "/products")}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-bark-600 transition-colors hover:text-bark-900"
      >
        <ArrowLeftIcon /> {t.product.backToShop}
      </Link>

      <div className="mt-6 grid animate-rise gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-10">
        <ProductGallery
          images={product.images}
          name={name}
          emptyLabel={t.products.noPhotograph}
        />

        <div className="editorial-panel flex flex-col rounded-[2rem] p-6 sm:p-9 lg:sticky lg:top-28">
          <p className="section-kicker flex-wrap">
            <span>{localised(locale, product.category.name, product.category.nameTa)}</span>
            {product.region ? (
              <span className="inline-flex items-center gap-1 text-bark-600">
                <MapPinIcon />
                {format(t.product.grownIn, { region: regionLabel(locale, product.region) })}
              </span>
            ) : null}
          </p>

          <h1 className="mt-6 font-display text-[2.75rem] font-medium leading-[0.98] break-words sm:text-[4rem]">
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

          <p className="mt-6 text-lg leading-relaxed text-bark-600">
            {localised(locale, product.description, product.descriptionTa)}
          </p>

          <div className="mt-8 flex flex-wrap items-end gap-x-3 gap-y-1 border-t border-bark-200 pt-6">
            <p className="whitespace-nowrap font-display text-5xl font-medium leading-tight text-bark-900">
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
            {sellerUnlocked && phoneShown ? (
              <Button as="a" href={`tel:${dialNumber(product.farmer.phone)}`} size="lg">
                <PhoneIcon /> {product.farmer.phone}
              </Button>
            ) : null}
            <Button
              as="a"
              href="#contact"
              variant={sellerUnlocked && phoneShown ? "secondary" : "primary"}
              size="lg"
            >
              {format(t.product.aboutFarm, { farm: product.farmer.farmName })}
            </Button>
            {accountsOn ? (
              customer ? (
                <SaveButton kind="product" id={product.id} initialSaved={saved} size="lg" />
              ) : (
                // Without the return path, signing in lands on the account page
                // and the listing they meant to save is gone.
                <Button
                  as={Link}
                  href={`${localePath(locale, "/account/sign-in")}?next=${encodeURIComponent(
                    localePath(locale, `/products/${product.slug}`),
                  )}`}
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

      {sellerUnlocked ? (
        <>
          <FarmerContact farmer={product.farmer} />
          <FarmerEnquiryForm
            recipientType="FARMER"
            recipientId={product.farmer.id}
            recipientName={product.farmer.farmName}
            canShareEmail={Boolean(customer?.emailVerifiedAt)}
          />
        </>
      ) : (
        <div id="contact" className="scroll-mt-24">
          <MemberGate locale={locale} t={t} returnPath={returnPath} />
        </div>
      )}

      {more.length > 0 ? (
        <section className="mt-20 border-t border-bark-200 pt-10 sm:mt-28 sm:pt-14">
          <p className="section-kicker">{product.farmer.farmName}</p>
          <h2 className="mt-5 font-display text-4xl font-medium leading-none sm:text-5xl">
            {format(t.product.moreFromFarm, { farm: product.farmer.farmName })}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      {sellerUnlocked ? <StickyCallBar phone={product.farmer.phone} /> : null}
    </div>
  );
}
