import Link from "next/link";
import { notFound } from "next/navigation";

import { dialNumber, showFarmerPhone, whatsappNumber } from "@/components/farmer-contact";
import { JsonLd } from "@/components/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { format, localePath } from "@/lib/i18n/config";
import { localisedOrNull, regionLabel } from "@/lib/i18n/content";
import { checkedOn } from "@/lib/i18n/dates";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getStoreBySlug } from "@/lib/stores";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/stores/[slug]">) {
  const { slug } = await params;
  const [store, t] = await Promise.all([getStoreBySlug(slug), getDictionary()]);

  if (!store) return { title: t.meta.storeNotFound };

  return { title: store.storeName, description: store.about ?? store.storeName };
}

export default async function StorePage({ params }: PageProps<"/[lang]/stores/[slug]">) {
  const { slug } = await params;
  const [store, locale, t] = await Promise.all([
    getStoreBySlug(slug),
    getLocale(),
    getDictionary(),
  ]);

  if (!store) notFound();

  // A search, not a dropped pin: we hold no coordinates and guessing one would
  // send somebody to the wrong street with our name on it.
  const mapsQuery = encodeURIComponent(`${store.storeName}, ${store.addressLine}, ${store.region.name}`);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6 sm:pb-10">
      {/* A shop with an address is a local business, and saying so is what gets
          it shown as one rather than as a page of text. The phone is included
          only once it is public. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "GroceryStore",
          name: store.storeName,
          description: store.about ?? undefined,
          address: {
            "@type": "PostalAddress",
            streetAddress: store.addressLine,
            addressLocality: store.region.name,
            addressRegion: "Tamil Nadu",
            addressCountry: "IN",
          },
          ...(showFarmerPhone() ? { telephone: store.phone } : {}),
        }}
      />

      <Link
        href={localePath(locale, "/stores")}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-bark-600 transition-colors hover:text-bark-900"
      >
        <ArrowLeftIcon /> {t.stores.backToAll}
      </Link>

      <header className="glass mt-6 animate-rise rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="leaf">
            <ShieldCheckIcon /> {t.stores.verified}
          </Badge>
          <Badge tone="neutral">
            <MapPinIcon /> {regionLabel(locale, store.region)}
          </Badge>
        </div>

        <h1 className="mt-4 font-display text-3xl break-words sm:text-4xl">{store.storeName}</h1>
        <p className="mt-1 text-bark-600">{store.contactName}</p>

        {store.verifiedAt ? (
          <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl bg-leaf-50 px-3 py-2 text-sm font-medium text-leaf-800 ring-1 ring-inset ring-leaf-300">
            <ShieldCheckIcon className="text-base" />
            {format(t.contact.checkedOn, { date: checkedOn(store.verifiedAt, locale) })}
            <Link href={localePath(locale, "/how-we-check")} className="underline underline-offset-4">
              {t.product.howWeCheck}
            </Link>
          </p>
        ) : null}

        {store.about ? (
          <p className="mt-4 max-w-2xl leading-relaxed text-ink">
            {localisedOrNull(locale, store.about, store.aboutTa)}
          </p>
        ) : null}

        <section className="mt-6 max-w-2xl rounded-2xl border border-bark-200 bg-white/70 p-5">
          <h2 className="font-display text-lg">{t.stores.addressHeading}</h2>
          <p className="mt-2 leading-relaxed text-ink">{store.addressLine}</p>
          <p className="text-bark-600">{regionLabel(locale, store.region)}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand underline underline-offset-4"
          >
            {t.stores.openInMaps} <ArrowRightIcon />
          </a>
        </section>

        {/* A licence number nobody can read is only an assertion, so the FSSAI
            number and the organic scheme are printed rather than implied. */}
        {store.fssaiNumber || store.certifier ? (
          <dl className="mt-5 grid max-w-2xl gap-x-8 gap-y-3 rounded-2xl border border-leaf-200 bg-leaf-50/60 p-5 sm:grid-cols-2">
            {store.fssaiNumber ? (
              <div>
                <dt className="text-sm text-bark-600">{t.stores.fssai}</dt>
                <dd className="font-mono text-sm font-medium text-ink">{store.fssaiNumber}</dd>
              </div>
            ) : null}
            {store.certifier ? (
              <div>
                <dt className="text-sm text-bark-600">{t.contact.certifier}</dt>
                <dd className="font-medium text-ink">{store.certifier}</dd>
              </div>
            ) : null}
            {store.certificateNo ? (
              <div>
                <dt className="text-sm text-bark-600">{t.contact.certificateNo}</dt>
                <dd className="font-mono text-sm font-medium text-ink">{store.certificateNo}</dd>
              </div>
            ) : null}
            {store.certifiedUntil ? (
              <div>
                <dt className="text-sm text-bark-600">{t.contact.certifiedUntil}</dt>
                <dd className="font-medium text-ink">{checkedOn(store.certifiedUntil, locale)}</dd>
              </div>
            ) : null}
            {store.certificateUrl ? (
              <div className="sm:col-span-2">
                <a
                  href={store.certificateUrl}
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

        {showFarmerPhone() ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button as="a" href={`tel:${dialNumber(store.phone)}`} size="lg">
              <PhoneIcon /> {store.phone}
            </Button>
            <Button
              as="a"
              href={`https://wa.me/${whatsappNumber(store.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="lg"
            >
              <WhatsAppIcon /> {t.contact.whatsapp}
            </Button>
          </div>
        ) : (
          <div className="mt-6 max-w-2xl rounded-2xl border border-bark-200 bg-bark-50/70 p-5">
            <p className="font-semibold text-ink">{t.contact.phoneSoon}</p>
            <p className="mt-1 leading-relaxed text-bark-600">{t.contact.phoneSoonNote}</p>
          </div>
        )}
      </header>
    </div>
  );
}
