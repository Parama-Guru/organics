import Image from "next/image";
import Link from "next/link";

import { FeaturedProductStory } from "@/components/featured-product-story";
import { IndexBoard } from "@/components/index-board";
import { PhoneSoonNotice } from "@/components/phone-soon-notice";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { accountsEnabled } from "@/lib/customer-auth";
import { getVerifiedFarmers } from "@/lib/farmers";
import { format, localePath } from "@/lib/i18n/config";
import { localised, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getCategories, getFeaturedProducts } from "@/lib/products";
import { getRegisteredCounts } from "@/lib/stores";

// The catalog lives in Postgres, which is not reachable while the Docker image builds.
export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: PageProps<"/[lang]">) {
  const [featured, categories, farmers, counts, locale, t, params] = await Promise.all([
    getFeaturedProducts(3),
    getCategories(),
    getVerifiedFarmers(),
    getRegisteredCounts(),
    getLocale(),
    getDictionary(),
    searchParams,
  ]);

  const accountsOn = accountsEnabled();

  // The rail is built from rows that exist, not from a decorative word list, so
  // an empty catalogue produces an empty rail rather than a lie.
  const districts = [
    ...new Set(farmers.map((farmer) => regionLabel(locale, farmer.region)).filter(Boolean)),
  ];
  const tickerItems = [
    ...districts,
    ...categories.map((category) => localised(locale, category.name, category.nameTa)),
  ];

  const steps = [
    { icon: ShieldCheckIcon, title: t.how.step1Title, body: t.how.step1Body },
    { icon: MapPinIcon, title: t.how.step2Title, body: t.how.step2Body },
    { icon: PhoneIcon, title: t.how.step3Title, body: t.how.step3Body },
  ];

  const ledger = [
    { value: "100%", label: t.home.statChecked },
    { value: "0%", label: t.home.statCommission },
    { value: String(counts.farmers), label: t.home.statFarms },
    { value: String(counts.stores), label: t.home.communityStores },
  ];

  const members = [
    {
      count: counts.farmers,
      label: counts.farmers === 1 ? t.home.communityFarmersOne : t.home.communityFarmers,
      href: "/sell",
      cta: t.home.communityJoinFarmer,
    },
    {
      count: counts.customers,
      label: counts.customers === 1 ? t.home.communityCustomersOne : t.home.communityCustomers,
      // With accounts switched off there is nothing to join, so the card points
      // at the produce instead of a route that 404s.
      href: accountsOn ? "/account/sign-up" : "/products",
      cta: accountsOn ? t.home.communityJoinCustomer : t.home.browse,
    },
    {
      count: counts.stores,
      label: counts.stores === 1 ? t.home.communityStoresOne : t.home.communityStores,
      href: "/stores/register",
      cta: t.home.communityJoinStore,
    },
  ];

  return (
    <div>
      {/* Deleting an account is irreversible; landing silently on the home page
          reads as though it may not have worked. */}
      {params.deleted === "1" ? (
        <p
          role="status"
          className="mx-auto mt-6 max-w-[90rem] rounded-2xl bg-leaf-50 p-4 leading-relaxed text-leaf-800 ring-1 ring-inset ring-leaf-200"
        >
          {t.account.deleted}
        </p>
      ) : null}

      {/* ---- Hero: limestone, type-led, with the index board as the object. -- */}
      <section className="mx-auto grid max-w-[90rem] grid-cols-[minmax(0,1fr)] gap-10 px-4 pb-8 pt-10 sm:px-6 sm:pb-14 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
        <div className="min-w-0">
          <p className="section-kicker">{t.home.badge}</p>
          <h1 className="editorial-heading mt-6 max-w-[22ch]">
            {t.home.titleLead}
            <em className="not-italic text-leaf-700">{t.home.titleAccent}</em>
            {t.home.titleTail}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-bark-600 sm:text-xl">
            {t.home.intro}
          </p>

          {/* A real search, not a decorative field: it submits to the catalogue
              with the same `search` parameter the filters use, and it works with
              JavaScript switched off. */}
          <form
            action={localePath(locale, "/products")}
            method="get"
            role="search"
            className="field-shell mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-bark-200 bg-paper p-1.5 shadow-soft"
          >
            <label className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 pl-3">
              <SearchIcon className="text-bark-600" />
              <span className="sr-only">{t.home.searchLabel}</span>
              <input
                type="search"
                name="search"
                maxLength={100}
                placeholder={t.home.searchPlaceholder}
                className="min-w-0 bg-transparent py-2.5 text-base outline-none placeholder:text-bark-600/60"
              />
            </label>
            <Button type="submit" size="md">
              {t.home.searchAction}
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button as={Link} href={localePath(locale, "/products")} size="lg" variant="dark">
              {t.home.browse} <ArrowRightIcon />
            </Button>
            <Button as={Link} href={localePath(locale, "/farmers")} size="lg" variant="secondary">
              {t.home.meetFarmers}
            </Button>
          </div>
        </div>

        {/* Above the fold, so it is not left waiting on an observer. */}
        <div className="min-w-0">
          <IndexBoard
            records={[
              { value: `${counts.farmers}`, label: t.home.statFarms },
              { value: `${counts.stores}`, label: t.home.communityStores },
              { value: "0%", label: t.home.statCommission },
            ]}
            verifiedChip={t.home.boardVerified}
            districtChip={t.home.boardDistrict}
          />
        </div>
      </section>

      {/* ---- Live index rail. ---------------------------------------------- */}
      {tickerItems.length > 0 ? (
        <div className="chapter-dark border-y border-white/10 py-3">
          <div className="ticker">
            <div className="ticker__track">
              {/* Duplicated on purpose: the keyframe translates by exactly half
                  the track, which is what makes the loop seamless. */}
              {[0, 1].map((copy) => (
                <div key={copy} aria-hidden={copy === 1} className="flex items-center gap-11 pr-11">
                  <span className="rule-label text-marigold-400">{t.home.tickerLabel}</span>
                  {tickerItems.map((item) => (
                    <span
                      key={`${copy}-${item}`}
                      className="rule-label whitespace-nowrap text-bark-50/70"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[90rem] px-4 sm:px-6">
        <PhoneSoonNotice className="mx-auto mt-8 max-w-5xl" />

        {/* ---- Proof ledger. ---------------------------------------------- */}
        <Reveal className="mt-16 sm:mt-24">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-bark-200 bg-bark-200 lg:grid-cols-4">
            {ledger.map((entry) => (
              <div key={entry.label} className="bg-paper p-6 sm:p-8">
                <dt className="rule-label text-bark-600">{entry.label}</dt>
                <dd className="mt-3 font-display text-4xl leading-none text-bark-900 sm:text-5xl">
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* ---- Featured produce. ------------------------------------------ */}
        <section className="mt-20 sm:mt-32">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-bark-200 pb-5">
              <div>
                <p className="section-kicker">{t.home.weeklyPick}</p>
                <h2 className="editorial-heading mt-5">{t.home.weeklyPick}</h2>
              </div>
              <Link
                href={localePath(locale, "/products")}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-bark-900 hover:underline"
              >
                {t.home.viewAll} <ArrowRightIcon />
              </Link>
            </div>
          </Reveal>

          {featured.length === 0 ? (
            <p className="editorial-panel mt-8 rounded-3xl p-10 text-center text-bark-600">
              {t.home.emptyBefore}
              <code className="font-mono">npm run db:seed</code>
              {t.home.emptyAfter}
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product, index) => (
                <Reveal key={product.id} delay={index * 70} className="min-w-0">
                  <FeaturedProductStory product={product} priority={index === 0} />
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* ---- How the check works, as a ruled ledger rather than a dark slab. */}
        <section aria-labelledby="how" className="mt-20 sm:mt-32">
          <Reveal>
            <p className="section-kicker">01 — 03</p>
            <h2 id="how" className="editorial-heading mt-5 max-w-3xl">
              {t.how.heading}
            </h2>
          </Reveal>
          <ol className="mt-10 border-t border-bark-200">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={index * 80}>
                  <div className="grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-bark-200 py-8 sm:grid-cols-[5rem_minmax(0,1fr)] sm:py-10">
                    <span className="rule-label text-marigold-600">0{index + 1}</span>
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                      <h3 className="flex items-start gap-3 font-display text-2xl text-bark-900 sm:text-3xl">
                        <step.icon className="mt-1 shrink-0 text-leaf-600" /> {step.title}
                      </h3>
                      <p className="leading-relaxed text-bark-600">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* ---- Crop index. ------------------------------------------------ */}
        <section className="mt-20 sm:mt-32">
          <Reveal>
            <p className="section-kicker">{t.home.shopByCategory}</p>
            <h2 className="editorial-heading mt-5 max-w-4xl">{t.home.shopByCategory}</h2>
          </Reveal>
          <div className="mt-10 grid auto-rows-[11rem] grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-12">
            {categories.map((category, index) => {
              const span =
                index % 5 === 0
                  ? "lg:col-span-7"
                  : index % 5 === 1
                    ? "lg:col-span-5"
                    : "lg:col-span-4";
              return (
                <Reveal key={category.id} delay={index * 55} className={span}>
                  <Link
                    href={localePath(locale, `/products?category=${category.slug}`)}
                    className="crop-tile card-lift group relative flex h-full overflow-hidden rounded-[1.25rem] border border-bark-900/10 bg-inverse p-5 text-white"
                  >
                    {category.products[0]?.imageUrl ? (
                      <Image
                        src={category.products[0].imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover opacity-50 transition-transform duration-[900ms] ease-settle group-hover:scale-110"
                      />
                    ) : null}
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-bark-900 via-bark-900/35 to-transparent transition-opacity duration-500 ease-tint group-hover:opacity-80"
                    />
                    {/* Light sweeps across the tile on hover. */}
                    <span aria-hidden className="crop-tile__sheen" />
                    <span className="relative mt-auto flex w-full items-end justify-between gap-4">
                      <span className="min-w-0">
                        <span className="rule-label text-marigold-400">0{index + 1}</span>
                        <span className="mt-2 block font-display text-2xl text-white sm:text-3xl">
                          {localised(locale, category.name, category.nameTa)}
                        </span>
                        <span className="crop-tile__count rule-label mt-1.5 block text-bark-100/75">
                          {format(
                            category._count.products === 1
                              ? t.products.resultCount
                              : t.products.resultCountPlural,
                            { count: category._count.products },
                          )}
                        </span>
                      </span>
                      <ArrowRightIcon className="shrink-0 text-2xl text-marigold-400 transition-transform duration-300 ease-settle group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ---- Farms. ----------------------------------------------------- */}
        {farmers.length > 0 ? (
          <section className="mt-20 sm:mt-32">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-5 border-b border-bark-200 pb-5">
                <div>
                  <p className="section-kicker">{t.home.farmsHeading}</p>
                  <h2 className="editorial-heading mt-5">{t.home.farmsHeading}</h2>
                </div>
                <Link
                  href={localePath(locale, "/farmers")}
                  className="inline-flex min-h-11 items-center gap-2 font-semibold text-bark-900 hover:underline"
                >
                  {t.home.viewAll} <ArrowRightIcon />
                </Link>
              </div>
            </Reveal>
            <ul className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
              {farmers.slice(0, 4).map((farmer, index) => (
                <li key={farmer.id} className="min-w-0">
                  <Reveal delay={index * 70}>
                    <Link
                      href={localePath(locale, `/farmers/${farmer.slug}`)}
                      className="glass-card card-lift group grid min-h-64 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[1.5rem] sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                    >
                      <span className="relative min-h-44 overflow-hidden bg-leaf-50">
                        {farmer.photoUrl ? (
                          <Image
                            src={farmer.photoUrl}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, 40vw"
                            className="object-cover transition-transform duration-700 ease-settle group-hover:scale-105"
                          />
                        ) : null}
                      </span>
                      <span className="flex min-w-0 flex-col justify-between p-6 sm:p-7">
                        <span className="min-w-0">
                          <span className="rule-label text-bark-600">0{index + 1}</span>
                          <span className="mt-4 block font-display text-2xl leading-tight text-bark-900 sm:text-3xl">
                            {farmer.farmName}
                          </span>
                          <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-bark-600">
                            <MapPinIcon /> {regionLabel(locale, farmer.region)}
                          </span>
                        </span>
                        <span className="mt-6 flex items-center justify-between gap-3 border-t border-bark-200 pt-4 text-sm font-semibold text-leaf-700">
                          {format(
                            farmer._count.products === 1
                              ? t.farmers.listingCount
                              : t.farmers.listingCountPlural,
                            { count: farmer._count.products },
                          )}
                          <ArrowRightIcon className="shrink-0" />
                        </span>
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* ---- Closing ink chapter. ------------------------------------------ */}
      <Reveal className="mt-16 sm:mt-24" variant="scale">
        <section className="chapter-dark px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto grid max-w-[90rem] grid-cols-[minmax(0,1fr)] gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)] lg:items-center lg:gap-12">
            <div>
              <p className="section-kicker section-kicker--dark">{t.home.communityHeading}</p>
              <h2 className="mt-4 font-display text-3xl font-medium leading-[1.05] text-white sm:text-4xl">
                {t.home.communityHeading}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-bark-100/80">
                {t.home.communityIntro}
              </p>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-white/15 sm:grid-cols-3">
              {members.map((member) => (
                <div key={member.href} className="chapter-dark flex min-w-0 flex-col px-0 py-4 sm:px-5">
                  <p className="tabular font-display text-4xl leading-none text-white sm:text-5xl">
                    {member.count}
                  </p>
                  <p className="mt-1.5 text-sm text-bark-100/80">{member.label}</p>
                  <Link
                    href={localePath(locale, member.href)}
                    className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-marigold-400 hover:underline"
                  >
                    {member.cta} <ArrowRightIcon />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
