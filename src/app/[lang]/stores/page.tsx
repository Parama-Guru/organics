import Link from "next/link";

import { dialNumber, showFarmerPhone } from "@/components/farmer-contact";
import { GlassPanel } from "@/components/glass-panel";
import { PhoneSoonNotice } from "@/components/phone-soon-notice";
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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Badge tone="leaf">
        <CheckIcon /> {t.stores.badge}
      </Badge>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">{t.stores.heading}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink">
        {phoneShown ? t.stores.intro : t.stores.introSoon}
      </p>
      <PhoneSoonNotice className="mt-4 max-w-2xl" />

      {/* A plain GET form: the result is a URL an admin or a buyer can share,
          and it works with JavaScript off. */}
      <form method="get" className="mt-8 flex flex-wrap gap-2">
        <label className="min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">{t.stores.searchPlaceholder}</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t.stores.searchPlaceholder}
            className="min-h-11 w-full rounded-xl border border-bark-200 bg-white/80 px-3.5 focus:border-marigold-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-marigold-400/25"
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
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store, index) => (
            <GlassPanel
              key={store.id}
              as="article"
              surface="card"
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              className="card-lift flex animate-rise flex-col rounded-3xl p-6"
            >
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {store.sponsored ? <Badge tone="marigold">{t.stores.sponsored}</Badge> : null}
                <span className="inline-flex items-center gap-1.5 font-semibold text-leaf-700">
                  <CheckIcon /> {t.stores.verified}
                </span>
                <span className="inline-flex items-center gap-1 text-bark-600">
                  <MapPinIcon /> {regionLabel(locale, store.region)}
                </span>
              </p>

              <h2 className="mt-2 font-display text-xl break-words">
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
            </GlassPanel>
          ))}
        </div>
      )}

      <aside className="mt-14 rounded-3xl border border-leaf-200 bg-leaf-50/70 p-8">
        <h2 className="font-display text-2xl">{t.stores.registerCta}</h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-ink">{t.stores.registerCtaBody}</p>
        <Button as={Link} href={localePath(locale, "/stores/register")} className="mt-5">
          {t.stores.registerCtaButton}
          <ArrowRightIcon />
        </Button>
      </aside>
    </div>
  );
}
