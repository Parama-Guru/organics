import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { dialNumber, showFarmerPhone, whatsappNumber } from "@/components/farmer-contact";
import { SaveButton } from "@/components/save-button";
import { ProductCard } from "@/components/product-card";
import { StickyCallBar } from "@/components/sticky-call-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getFarmerBySlug } from "@/lib/farmers";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { isFarmerSaved } from "@/lib/saved";
import { format, localePath } from "@/lib/i18n/config";
import { checkedOn } from "@/lib/i18n/dates";
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
  const accountsOn = accountsEnabled();
  const customer = accountsOn ? await getCustomer() : null;
  const saved = customer ? await isFarmerSaved(customer.id, farmer.id) : false;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pb-10">
      <Link
        href={localePath(locale, "/farmers")}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-bark-600 transition-colors hover:text-bark-900"
      >
        <ArrowLeftIcon /> {t.farmers.backToAll}
      </Link>

      <header className="glass mt-6 animate-rise overflow-hidden rounded-3xl">
        {/* Full-width banner rather than a side column: the scene is 8:5, and a
            narrow portrait column cropped the herd in half. */}
        <div className="relative aspect-[16/6] bg-leaf-50 sm:aspect-[16/5]">
          {farmer.photoUrl ? (
            <Image
              src={farmer.photoUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 1152px) 100vw, 72rem"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="leaf">
                <ShieldCheckIcon /> {t.farmers.verified}
              </Badge>
              <Badge tone="neutral">
                <MapPinIcon /> {regionLabel(locale, farmer.region)}
              </Badge>
            </div>

            <h1 className="mt-4 font-display text-3xl break-words sm:text-4xl">
              {farmer.farmName}
            </h1>
            <p className="mt-1 text-bark-600">{farmer.contactName}</p>

            {farmer.verifiedAt ? (
              <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl bg-leaf-50 px-3 py-2 text-sm font-medium text-leaf-800 ring-1 ring-inset ring-leaf-300">
                <ShieldCheckIcon className="text-base" />
                {format(t.contact.checkedOn, { date: checkedOn(farmer.verifiedAt, locale) })}
                <Link
                  href={localePath(locale, "/how-we-check")}
                  className="underline underline-offset-4"
                >
                  {t.product.howWeCheck}
                </Link>
              </p>
            ) : null}

            {farmer.about ? (
              <p className="mt-4 max-w-2xl leading-relaxed text-ink">
                {localisedOrNull(locale, farmer.about, farmer.aboutTa)}
              </p>
            ) : null}

            {/* "Certified organic" is a regulated claim, so the scheme, the number
                and the expiry are printed rather than implied by a green tick. */}
            {farmer.certifier ? (
              <dl className="mt-5 grid max-w-2xl gap-x-8 gap-y-3 rounded-2xl border border-leaf-200 bg-leaf-50/60 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm text-bark-600">{t.contact.certifier}</dt>
                  <dd className="font-medium text-ink">{farmer.certifier}</dd>
                </div>
                {farmer.certificateNo ? (
                  <div>
                    <dt className="text-sm text-bark-600">{t.contact.certificateNo}</dt>
                    <dd className="font-mono text-sm font-medium text-ink">
                      {farmer.certificateNo}
                    </dd>
                  </div>
                ) : null}
                {farmer.certifiedUntil ? (
                  <div>
                    <dt className="text-sm text-bark-600">{t.contact.certifiedUntil}</dt>
                    <dd className="font-medium text-ink">
                      {checkedOn(farmer.certifiedUntil, locale)}
                    </dd>
                  </div>
                ) : null}
                {/* A number you cannot check is still only an assertion. When the
                    farm has given us the document, link straight to it. */}
                {farmer.certificateUrl ? (
                  <div className="sm:col-span-2">
                    <a
                      href={farmer.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand underline underline-offset-4"
                    >
                      {t.contact.viewCertificate} <ArrowRightIcon />
                    </a>
                  </div>
                ) : null}
              </dl>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {showFarmerPhone() ? (
                <>
                  <Button as="a" href={`tel:${dialNumber(farmer.phone)}`} size="lg">
                    <PhoneIcon /> {farmer.phone}
                  </Button>
                  <Button
                    as="a"
                    href={`https://wa.me/${whatsappNumber(farmer.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                    size="lg"
                  >
                    <WhatsAppIcon /> {t.contact.whatsapp}
                  </Button>
                  <Badge tone="neutral">{t.contact.callWindow}</Badge>
                </>
              ) : null}
              {accountsOn ? (
                customer ? (
                  <SaveButton kind="farmer" id={farmer.id} initialSaved={saved} size="lg" />
                ) : (
                  <Button
                    as={Link}
                    href={localePath(locale, "/account/sign-in")}
                    variant="ghost"
                    size="lg"
                  >
                    {t.account.signInToSave}
                  </Button>
                )
              ) : null}
            </div>

            {showFarmerPhone() ? null : (
              <div className="mt-5 max-w-2xl rounded-2xl border border-bark-200 bg-bark-50/70 p-5">
                <p className="font-semibold text-ink">{t.contact.phoneSoon}</p>
                <p className="mt-1 leading-relaxed text-bark-600">{t.contact.phoneSoonNote}</p>
              </div>
            )}
        </div>
      </header>

      <h2 className="mt-12 font-display text-2xl sm:text-3xl">
        {t.farmers.fromThisFarm}
        <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-leaf-500" />
      </h2>

      {products.length === 0 ? (
        <p className="glass mt-5 rounded-3xl p-10 text-center text-bark-600">
          {t.farmers.nothingListed}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
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

      <StickyCallBar phone={farmer.phone} />
    </div>
  );
}
