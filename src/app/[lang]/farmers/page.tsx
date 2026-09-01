import Image from "next/image";
import Link from "next/link";

import { dialNumber, showFarmerPhone } from "@/components/farmer-contact";
import { GlassPanel } from "@/components/glass-panel";
import { PhoneSoonNotice } from "@/components/phone-soon-notice";
import { SaveButton } from "@/components/save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { getVerifiedFarmers } from "@/lib/farmers";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { format, localePath } from "@/lib/i18n/config";
import { localisedOrNull, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.farmersTitle, description: t.meta.farmersDescription };
}

export default async function FarmersPage() {
  const [farmers, locale, t] = await Promise.all([
    getVerifiedFarmers(),
    getLocale(),
    getDictionary(),
  ]);

  const customer = accountsEnabled() ? await getCustomer() : null;
  const accountsOn = accountsEnabled();
  const phoneShown = showFarmerPhone();
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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end">
        <div>
          <Badge tone="leaf">
            <CheckIcon /> {t.farmers.everyFarmVerified}
          </Badge>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">{t.farmers.title}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink">
            {phoneShown ? t.farmers.intro : t.farmers.introSoon}
          </p>
          <PhoneSoonNotice className="mt-4 max-w-2xl" />
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-sm text-bark-600">{t.home.statFarms}</dt>
              <dd className="font-display text-3xl text-brand">{farmers.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-bark-600">{t.home.statChecked}</dt>
              <dd className="font-display text-3xl text-brand">100%</dd>
            </div>
            <div>
              <dt className="text-sm text-bark-600">{t.home.statCommission}</dt>
              <dd className="font-display text-3xl text-brand">0%</dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-3xl border border-leaf-200 bg-leaf-50/70 p-6">
          <h2 className="font-display text-lg">{t.trust.heading}</h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink">
            {[t.trust.check1Title, t.trust.check2Title, t.trust.check3Title].map((line) => (
              <li key={line} className="flex gap-2.5">
                <CheckIcon className="mt-1 shrink-0 text-leaf-700" />
                {line}
              </li>
            ))}
          </ul>
          <Link
            href={localePath(locale, "/how-we-check")}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            {t.footer.howWeCheck} <ArrowRightIcon />
          </Link>
        </aside>
      </div>

      {farmers.length === 0 ? (
        <div className="glass mt-10 rounded-3xl p-12 text-center">
          <p className="font-display text-xl">{t.farmers.none}</p>
          <Button as={Link} href={localePath(locale, "/sell")} className="mt-5">
            {t.farmers.applyToList}
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {farmers.map((farmer, index) => (
            <GlassPanel
              key={farmer.id}
              as="article"
              surface="card"
              style={{ animationDelay: `${index * 60}ms` }}
              className="card-lift group flex animate-rise flex-col overflow-hidden rounded-3xl"
            >
              <div className="relative h-36 overflow-hidden bg-leaf-50">
                {farmer.photoUrl ? (
                  <Image
                    src={farmer.photoUrl}
                    alt=""
                    fill
                    priority={index < 3}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-6">
                {/* Below the picture rather than over it: these sat on the farm
                    scene and covered the part that says what the farm grows. */}
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-leaf-700">
                    <CheckIcon /> {t.farmers.verified}
                  </span>
                  <span className="inline-flex items-center gap-1 text-bark-600">
                    <MapPinIcon /> {regionLabel(locale, farmer.region)}
                  </span>
                </p>

                <h2 className="mt-2 font-display text-xl break-words">
                  <Link
                    href={localePath(locale, `/farmers/${farmer.slug}`)}
                    className="decoration-marigold-500 decoration-2 underline-offset-4 hover:underline"
                  >
                    {farmer.farmName}
                  </Link>
                </h2>
                <p className="text-sm text-bark-600">{farmer.contactName}</p>
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
                  {showFarmerPhone() ? (
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
