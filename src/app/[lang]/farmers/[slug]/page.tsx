import Link from "next/link";
import { notFound } from "next/navigation";

import { dialNumber, showFarmerPhone, whatsappNumber } from "@/components/farmer-contact";
import { FarmerEnquiryForm } from "@/components/farmer-enquiry-form";
import { ImageField } from "@/components/image-field";
import { JsonLd } from "@/components/json-ld";
import { SaveButton } from "@/components/save-button";
import { ProductCard } from "@/components/product-card";
import { StickyCallBar } from "@/components/sticky-call-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getFarmerBySlug } from "@/lib/farmers";
import { isFarmerSaved } from "@/lib/saved";
import { format, localePath } from "@/lib/i18n/config";
import { checkedOn } from "@/lib/i18n/dates";
import { localisedOrNull, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { requireMemberAccess } from "@/lib/member-access";
import { isFarmerSponsored } from "@/lib/sponsorships";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/farmers/[slug]">) {
  const { slug } = await params;
  const [result, t] = await Promise.all([getFarmerBySlug(slug), getDictionary()]);

  if (!result) return { title: t.meta.farmNotFound };

  return {
    title: t.account.detailGateTitle,
    description: t.account.detailGateBody,
    robots: { index: false, follow: false },
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
  const returnPath = localePath(locale, `/farmers/${farmer.slug}`);
  const { customer } = await requireMemberAccess(locale, returnPath);
  const [saved, sponsored] = await Promise.all([
    isFarmerSaved(customer.id, farmer.id),
    isFarmerSponsored(farmer.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 sm:pb-14 sm:pt-14">
      {/* Says what this page is to a crawler: a real farm in a named district,
          not an article about one. The phone is included only once it is
          public, so the markup never carries what the page itself withholds. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Farm",
          name: farmer.farmName,
          description: farmer.about ?? undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: farmer.region.name,
            addressRegion: "Tamil Nadu",
            addressCountry: "IN",
          },
          ...(showFarmerPhone() ? { telephone: farmer.phone } : {}),
        }}
      />

      <Link
        href={localePath(locale, "/farmers")}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-bark-600 transition-colors hover:text-bark-900"
      >
        <ArrowLeftIcon /> {t.farmers.backToAll}
      </Link>

      <header className="editorial-panel mt-6 animate-rise overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
        {/* Full-width banner rather than a side column: the scene is 8:5, and a
            narrow portrait column cropped the herd in half. */}
        <div className="relative min-h-72 sm:aspect-[16/7]">
          <ImageField
            src={farmer.photoUrl}
            alt=""
            priority
            sizes="(max-width: 1152px) 100vw, 72rem"
            fallbackLabel={t.products.noPhotograph}
            className="h-full w-full"
          />
        </div>

        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:p-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {sponsored ? <Badge tone="marigold">{t.farmers.sponsored}</Badge> : null}
              <Badge tone="leaf">
                <ShieldCheckIcon /> {t.farmers.verified}
              </Badge>
              <Badge tone="neutral">
                <MapPinIcon /> {regionLabel(locale, farmer.region)}
              </Badge>
            </div>

            <h1 className="mt-6 font-display text-5xl font-medium leading-[0.95] break-words sm:text-7xl">
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
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600">
                {localisedOrNull(locale, farmer.about, farmer.aboutTa)}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3">
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
              <SaveButton kind="farmer" id={farmer.id} initialSaved={saved} size="lg" />
            </div>

            {showFarmerPhone() ? null : (
              <div className="mt-6 max-w-2xl rounded-2xl border border-bark-200 bg-canvas-2 p-5">
                <p className="font-semibold text-ink">{t.contact.phoneSoon}</p>
                <p className="mt-1 leading-relaxed text-bark-600">{t.contact.phoneSoonNote}</p>
              </div>
            )}
          </div>

            {/* "Certified organic" is a regulated claim, so the scheme, the number
                and the expiry are printed rather than implied by a green tick. */}
            {farmer.certifier ? (
              <dl className="h-fit grid gap-x-8 gap-y-5 rounded-[1.75rem] border border-leaf-200 bg-leaf-50 p-6 sm:grid-cols-2 lg:p-8">
                <div className="sm:col-span-2">
                  <p className="section-kicker">Verification dossier</p>
                </div>
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

        </div>
      </header>

      <FarmerEnquiryForm
        recipientType="FARMER"
        recipientId={farmer.id}
        recipientName={farmer.farmName}
        canShareEmail={customer.emailVerifiedAt !== null}
      />

      <p className="section-kicker mt-20">{farmer.farmName}</p>
      <h2 className="mt-5 font-display text-4xl font-medium leading-none sm:text-5xl">
        {t.farmers.fromThisFarm}
      </h2>

      {products.length === 0 ? (
        <p className="glass mt-5 rounded-3xl p-10 text-center text-bark-600">
          {t.farmers.nothingListed}
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
