import Link from "next/link";

import { ImageField } from "@/components/image-field";
import { dialNumber, showFarmerPhone } from "@/components/farmer-contact";
import { GlassPanel } from "@/components/glass-panel";
import { PhoneSoonNotice } from "@/components/phone-soon-notice";
import { SaveButton } from "@/components/save-button";
import { SponsoredCardTracker } from "@/components/sponsored-card-tracker";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { getVerifiedFarmers } from "@/lib/farmers";
import { NearMeButton } from "@/components/near-me-button";
import { byDistanceFrom, roundedKm } from "@/lib/geo";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { getCustomerAccess } from "@/lib/customer-access";
import { getLocatedRegions } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { format, localePath } from "@/lib/i18n/config";
import { localisedOrNull, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { activeSponsoredIds, sponsoredFirst } from "@/lib/sponsorships";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.farmersTitle, description: t.meta.farmersDescription };
}

export default async function FarmersPage({ searchParams }: PageProps<"/[lang]/farmers">) {
  const [params, locale, t, sponsorships, locatedRegions] = await Promise.all([
    searchParams,
    getLocale(),
    getDictionary(),
    activeSponsoredIds(),
    getLocatedRegions(),
  ]);
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const baseFarmers = await getVerifiedFarmers(query);

  // A district slug, never coordinates. Unknown values fall through to the
  // normal listing rather than erroring.
  const nearSlug = Array.isArray(params.near) ? params.near[0] : params.near;
  const origin = locatedRegions.find((region) => region.slug === nearSlug) ?? null;

  // Distance first, then sponsorship, because sponsoredFirst keeps the order it
  // is given inside each group. Paid placement still leads, and the rest is
  // nearest-first.
  const distances = new Map<string, number | null>();
  const orderedByDistance =
    origin && origin.latitude !== null && origin.longitude !== null
      ? byDistanceFrom(
          { latitude: origin.latitude, longitude: origin.longitude },
          baseFarmers,
          (farmer) => farmer.region,
        ).map(({ row, km }) => {
          distances.set(row.id, km);
          return row;
        })
      : baseFarmers;

  const farmers = sponsoredFirst(orderedByDistance, sponsorships.farmer);

  const customer = accountsEnabled() ? await getCustomer() : null;
  const accountsOn = accountsEnabled();
  const phoneShown = showFarmerPhone();
  const access = customer ? await getCustomerAccess(customer.id) : null;
  const canContact = phoneShown && Boolean(access?.allowed);
  // One query for the whole grid rather than one per card.
  const savedIds = customer
    ? new Set(
        (
          await prisma.savedFarmer.findMany({
            where: { customerId: customer.id, farmerId: { in: farmers.map((f) => f.id) } },
            select: { farmerId: true },
          })
        ).map((row) => row.farmerId),
      )
    : new Set<string>();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 border-b border-bark-200 pb-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end lg:pb-14">
        <div>
          <p className="section-kicker"><CheckIcon /> {t.farmers.everyFarmVerified}</p>
          <h1 className="editorial-heading mt-6">{t.farmers.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600 sm:text-xl">
            {phoneShown ? t.farmers.intro : t.farmers.introSoon}
          </p>
          <PhoneSoonNotice className="mt-4 max-w-2xl" />
          <dl className="mt-8 grid max-w-2xl grid-cols-3 border-y border-bark-200 py-5">
            <div>
              <dt className="text-sm text-bark-600">{t.home.statFarms}</dt>
              <dd className="mt-1 font-display text-4xl text-brand">{farmers.length}</dd>
            </div>
            <div className="border-l border-bark-200 pl-4 sm:pl-8">
              <dt className="text-sm text-bark-600">{t.home.statChecked}</dt>
              <dd className="mt-1 font-display text-4xl text-brand">100%</dd>
            </div>
            <div className="border-l border-bark-200 pl-4 sm:pl-8">
              <dt className="text-sm text-bark-600">{t.home.statCommission}</dt>
              <dd className="mt-1 font-display text-4xl text-brand">0%</dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-[2rem] bg-inverse p-7 text-white sm:p-9">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-marigold-400">Verification dossier</p>
          <h2 className="mt-4 font-display text-3xl text-white">{t.trust.heading}</h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink">
            {[t.trust.check1Title, t.trust.check2Title, t.trust.check3Title].map((line) => (
              <li key={line} className="flex gap-2.5 border-t border-white/15 py-3 text-bark-100">
                <CheckIcon className="mt-1 shrink-0 text-marigold-400" />
                {line}
              </li>
            ))}
          </ul>
          <Link
            href={localePath(locale, "/how-we-check")}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            {t.footer.howWeCheck} <ArrowRightIcon />
          </Link>
        </aside>
      </div>

      <form method="get" className="editorial-panel mt-8 flex flex-wrap gap-2 rounded-[1.75rem] p-4 sm:p-5">
        <label className="min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">{t.farmers.searchPlaceholder}</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t.farmers.searchPlaceholder}
            className="focus-ring min-h-12 w-full rounded-full border border-bark-200 bg-canvas-2 px-5 focus:bg-paper"
          />
        </label>
        <Button type="submit" variant="dark">
          {t.farmers.search}
        </Button>
        {query ? (
          <Button as={Link} href={localePath(locale, "/farmers")} variant="secondary">
            {t.farmers.clear}
          </Button>
        ) : null}
      </form>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <NearMeButton
          regions={locatedRegions}
          labels={{
            action: t.near.action,
            asking: t.near.asking,
            denied: t.near.denied,
            unavailable: t.near.unavailable,
            nowhere: t.near.nowhere,
            privacy: t.near.privacy,
          }}
        />

        {origin ? (
          <div className="min-w-0">
            <p className="font-display text-xl text-bark-900">
              {format(t.near.headingFarms, { region: regionLabel(locale, origin) })}
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-bark-600">{t.near.note}</p>
            <Link
              href={localePath(locale, "/farmers")}
              className="mt-1.5 inline-flex min-h-11 items-center text-sm font-semibold text-bark-900 underline-offset-4 hover:underline"
            >
              {t.near.clear}
            </Link>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-bark-600">
        {farmers.length === 1
          ? t.farmers.countOne
          : format(t.farmers.countMany, { count: farmers.length })}
      </p>

      {farmers.length === 0 ? (
        <div className="glass mt-10 rounded-3xl p-12 text-center">
          <p className="font-display text-xl">
            {query ? t.farmers.emptySearch : t.farmers.none}
          </p>
          <Button as={Link} href={localePath(locale, "/sell")} className="mt-5">
            {t.farmers.applyToList}
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {farmers.map((farmer, index) => (
            <Reveal key={farmer.id} delay={Math.min(index, 8) * 60}>
              <SponsoredCardTracker placementId={farmer.sponsorshipId}>
                <GlassPanel
                  as="article"
                  surface="card"
                  className="card-lift group grid h-full overflow-hidden rounded-[2rem] sm:grid-cols-[0.85fr_1.15fr]"
                >
                <div className="relative min-h-56 overflow-hidden sm:min-h-full">
                  <ImageField
                    src={farmer.photoUrl}
                    alt=""
                    priority={index < 3}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    fallbackLabel={t.products.noPhotograph}
                    className="h-full w-full"
                  />
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-8">
                {/* Below the picture rather than over it: these sat on the farm
                    scene and covered the part that says what the farm grows. */}
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {farmer.sponsored ? <Badge tone="marigold">{t.farmers.sponsored}</Badge> : null}
                  <span className="inline-flex items-center gap-1.5 font-semibold text-leaf-700">
                    <CheckIcon /> {t.farmers.verified}
                  </span>
                  <span className="inline-flex items-center gap-1 text-bark-600">
                    <MapPinIcon /> {regionLabel(locale, farmer.region)}
                  </span>
                  {distances.get(farmer.id) !== undefined && distances.get(farmer.id) !== null ? (
                    <span className="rule-label inline-flex items-center rounded-full bg-leaf-50 px-2.5 py-1 text-leaf-800">
                      {roundedKm(distances.get(farmer.id)!) === 0
                        ? t.near.here
                        : format(t.near.away, { km: roundedKm(distances.get(farmer.id)!) })}
                    </span>
                  ) : null}
                </p>

                <h2 className="mt-4 font-display text-3xl font-medium leading-none break-words">
                  <Link
                    href={localePath(locale, `/farmers/${farmer.slug}`)}
                    className="decoration-marigold-500 decoration-2 underline-offset-4 hover:underline"
                  >
                    {farmer.farmName}
                  </Link>
                </h2>
                {farmer.about ? (
                  <p className="mt-3 line-clamp-3 min-h-[4.1rem] text-sm leading-relaxed text-bark-600">
                    {localisedOrNull(locale, farmer.about, farmer.aboutTa)}
                  </p>
                ) : null}

                <p className="mt-4 text-sm font-medium">
                  {format(
                    farmer._count.products === 1
                      ? t.farmers.listingCount
                      : t.farmers.listingCountPlural,
                    { count: farmer._count.products },
                  )}
                </p>

                <div className="mt-auto flex flex-wrap gap-2 border-t border-bark-200/60 pt-4">
                  {canContact ? (
                    <Button as="a" href={`tel:${dialNumber(farmer.phone)}`} size="sm">
                      <PhoneIcon /> {farmer.phone}
                    </Button>
                  ) : null}
                  <Button
                    as={Link}
                    href={localePath(locale, `/farmers/${farmer.slug}`)}
                    size="sm"
                    variant="secondary"
                  >
                    {t.farmers.viewFarm}
                    <ArrowRightIcon />
                  </Button>
                  {customer ? (
                    <SaveButton
                      kind="farmer"
                      id={farmer.id}
                      initialSaved={savedIds.has(farmer.id)}
                      size="sm"
                    />
                  ) : accountsOn ? (
                    <Button
                      as={Link}
                      href={`${localePath(locale, "/account/sign-in")}?next=${encodeURIComponent(
                        localePath(locale, `/farmers/${farmer.slug}`),
                      )}`}
                      size="sm"
                      variant="ghost"
                      className="border-bark-200"
                    >
                      {t.account.signInToSave}
                    </Button>
                  ) : null}
                </div>
                </div>
                </GlassPanel>
              </SponsoredCardTracker>
            </Reveal>
          ))}
        </div>
      )}

      <section className="glass mt-14 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-8">
        <div className="min-w-0">
          <h2 className="font-display text-2xl sm:text-3xl">{t.farmers.growOrganic}</h2>
          <p className="mt-1 text-bark-600">{t.farmers.applyHere}</p>
        </div>
        <Button as={Link} href={localePath(locale, "/sell")} size="lg">
          {t.nav.sell}
        </Button>
      </section>
    </div>
  );
}
