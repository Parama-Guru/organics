import Image from "next/image";
import Link from "next/link";

import { dialNumber, showFarmerPhone } from "@/components/farmer-contact";
import { GlassPanel } from "@/components/glass-panel";
import { PhoneSoonNotice } from "@/components/phone-soon-notice";
import { SponsoredCardTracker } from "@/components/sponsored-card-tracker";
import { Reveal } from "@/components/reveal";
import { StorefrontPlaceholder } from "@/components/storefront-placeholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { getCustomerAccess } from "@/lib/customer-access";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { format, localePath } from "@/lib/i18n/config";
import { localisedOrNull, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getVerifiedStores } from "@/lib/stores";
import { activeSponsoredIds, sponsoredFirst } from "@/lib/sponsorships";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.storesTitle, description: t.meta.storesDescription };
}

export default async function StoresPage({ searchParams }: PageProps<"/[lang]/stores">) {
  const [params, locale, t] = await Promise.all([searchParams, getLocale(), getDictionary()]);
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";

  const [baseStores, sponsorships] = await Promise.all([
    getVerifiedStores(query),
    activeSponsoredIds(),
  ]);
  const stores = sponsoredFirst(baseStores, sponsorships.store);
  const phoneShown = showFarmerPhone();
  const customer = accountsEnabled() ? await getCustomer() : null;
  const access = customer ? await getCustomerAccess(customer.id) : null;
  const canContact = phoneShown && Boolean(access?.allowed);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="grid grid-cols-[minmax(0,1fr)] gap-6 border-b border-bark-200 pb-10 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:items-end lg:pb-14">
        <p className="section-kicker"><CheckIcon /> {t.stores.badge}</p>
        <div>
          <h1 className="editorial-heading">{t.stores.heading}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600 sm:text-xl">
            {phoneShown ? t.stores.intro : t.stores.introSoon}
          </p>
          <PhoneSoonNotice className="mt-5 max-w-2xl" />
        </div>
      </header>

      {/* A plain GET form: the result is a URL an admin or a buyer can share,
          and it works with JavaScript off. */}
      <form method="get" className="editorial-panel mt-8 flex flex-wrap gap-2 rounded-[1.75rem] p-4 sm:p-5">
        <label className="min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">{t.stores.searchPlaceholder}</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t.stores.searchPlaceholder}
            className="min-h-12 w-full rounded-full border border-bark-200 bg-bark-50 px-5 focus:border-leaf-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-leaf-400/20"
          />
        </label>
        <Button type="submit" variant="dark">
          {t.stores.search}
        </Button>
        {query ? (
          <Button as={Link} href={localePath(locale, "/stores")} variant="secondary">
            {t.stores.clear}
          </Button>
        ) : null}
      </form>

      <p className="mt-4 text-sm text-bark-600">
        {stores.length === 1
          ? t.stores.countOne
          : format(t.stores.countMany, { count: stores.length })}
      </p>

      {stores.length === 0 ? (
        <div className="glass mt-8 rounded-3xl p-12 text-center">
          <p className="font-display text-xl">{query ? t.stores.emptySearch : t.stores.empty}</p>
          <Button as={Link} href={localePath(locale, "/stores/register")} className="mt-5">
            {t.stores.registerCtaButton}
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {stores.map((store, index) => (
            <Reveal key={store.id} delay={Math.min(index, 8) * 60}>
              <SponsoredCardTracker placementId={store.sponsorshipId}>
                <GlassPanel
                  as="article"
                  surface="card"
                  className="card-lift grid h-full overflow-hidden rounded-[2rem] sm:grid-cols-[0.85fr_1.15fr]"
                >
                <div className="relative min-h-56 bg-leaf-50 sm:min-h-full">
                  {store.photoUrl ? (
                    <Image
                      src={store.photoUrl}
                      alt=""
                      fill
                      priority={index < 3}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <StorefrontPlaceholder compact />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {store.sponsored ? (
                      <Badge tone="marigold">{t.stores.sponsored}</Badge>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 font-semibold text-leaf-700">
                      <CheckIcon /> {t.stores.verified}
                    </span>
                    <span className="inline-flex items-center gap-1 text-bark-600">
                      <MapPinIcon /> {regionLabel(locale, store.region)}
                    </span>
                  </p>

                  <h2 className="mt-4 font-display text-3xl font-medium leading-none break-words">
                    <Link
                      href={localePath(locale, `/stores/${store.slug}`)}
                      className="decoration-marigold-500 decoration-2 underline-offset-4 hover:underline"
                    >
                      {store.storeName}
                    </Link>
                  </h2>

                  {store.about ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-bark-600">
                      {localisedOrNull(locale, store.about, store.aboutTa)}
                    </p>
                  ) : null}

                  <div className="mt-auto flex flex-wrap gap-2 border-t border-bark-200/60 pt-4">
                    {canContact ? (
                      <Button as="a" href={`tel:${dialNumber(store.phone)}`} size="sm">
                        <PhoneIcon /> {store.phone}
                      </Button>
                    ) : null}
                    <Button
                      as={Link}
                      href={localePath(locale, `/stores/${store.slug}`)}
                      size="sm"
                      variant="secondary"
                    >
                      {t.stores.viewStore}
                      <ArrowRightIcon />
                    </Button>
                  </div>
                </div>
                </GlassPanel>
              </SponsoredCardTracker>
            </Reveal>
          ))}
        </div>
      )}

      <aside className="mt-20 grid grid-cols-[minmax(0,1fr)] gap-6 rounded-[2rem] bg-bark-900 p-7 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
        <p className="section-kicker !text-marigold-400 before:!bg-marigold-400">{t.storeApplication.badge}</p>
        <h2 className="mt-5 font-display text-4xl text-white">{t.stores.registerCta}</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-bark-100">{t.stores.registerCtaBody}</p>
        </div>
        <Button as={Link} href={localePath(locale, "/stores/register")} className="mt-5">
          {t.stores.registerCtaButton}
          <ArrowRightIcon />
        </Button>
      </aside>
    </div>
  );
}
