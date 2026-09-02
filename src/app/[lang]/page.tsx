import Image from "next/image";
import Link from "next/link";

import { FarmWorld } from "@/components/farm-world";
import { FeaturedProductStory } from "@/components/featured-product-story";
import { PhoneSoonNotice } from "@/components/phone-soon-notice";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon } from "@/components/ui/icons";
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
    getFeaturedProducts(4),
    getCategories(),
    getVerifiedFarmers(),
    getRegisteredCounts(),
    getLocale(),
    getDictionary(),
    searchParams,
  ]);

  const steps = [
    { icon: ShieldCheckIcon, title: t.how.step1Title, body: t.how.step1Body },
    { icon: MapPinIcon, title: t.how.step2Title, body: t.how.step2Body },
    { icon: PhoneIcon, title: t.how.step3Title, body: t.how.step3Body },
  ];

  const accountsOn = accountsEnabled();
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
    <div className="mx-auto max-w-[90rem] px-3 sm:px-6">
      {/* Deleting an account is irreversible; landing silently on the home page
          reads as though it may not have worked. */}
      {params.deleted === "1" ? (
        <p
          role="status"
          className="mt-6 rounded-2xl bg-leaf-50 p-4 leading-relaxed text-leaf-800 ring-1 ring-inset ring-leaf-200"
        >
          {t.account.deleted}
        </p>
      ) : null}

      {/* The rest of the copy describes a directory whose numbers are live. While
          they are withheld, say so once, at the top, rather than letting every
          page imply a call the visitor cannot make. */}
      <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-bark-900 text-white sm:mt-8 sm:rounded-[3rem]">
        <div aria-hidden className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-leaf-500/15 blur-3xl" />
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-marigold-500/15 blur-3xl" />
        <div className="relative grid min-h-[44rem] grid-cols-1 items-center gap-8 p-4 sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:p-10 xl:p-14">
          <div className="px-2 py-8 sm:px-4 lg:py-12">
            <p className="section-kicker !text-marigold-400 before:!bg-marigold-400">
              {t.home.badge}
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.75rem,7vw,6.8rem)] font-medium leading-[0.93] text-white">
              {t.home.titleLead}
              <span className="text-marigold-400">{t.home.titleAccent}</span>
              {t.home.titleTail}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-bark-100 sm:text-xl">
              {t.home.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} href={localePath(locale, "/products")} size="lg">
                {t.home.browse} <ArrowRightIcon />
              </Button>
              <Button as={Link} href={localePath(locale, "/farmers")} size="lg" variant="onDark">
                {t.home.meetFarmers}
              </Button>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-white/15 pt-6">
              {[
                { n: "100%", label: t.home.statChecked },
                { n: "0%", label: t.home.statCommission },
                { n: counts.farmers, label: t.home.statFarms },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-3xl text-white sm:text-4xl">{stat.n}</dt>
                  <dd className="mt-1 text-xs leading-snug text-bark-100 sm:text-sm">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <FarmWorld
            checkedLabel={t.home.statChecked}
            districtLabel={locale === "ta" ? "தமிழ்நாடு" : "Tamil Nadu"}
            directLabel={t.home.statCall}
          />
        </div>
      </section>

      <PhoneSoonNotice className="mx-auto mt-6 max-w-5xl" />

      <section className="mx-auto mt-24 max-w-7xl sm:mt-36">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <p className="section-kicker">{t.home.weeklyPick}</p>
            <div>
              <h2 className="editorial-heading">{t.home.weeklyPick}</h2>
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-bark-200 pt-4">
                <p className="max-w-xl text-bark-600">{t.products.everythingNow}</p>
                <Link href={localePath(locale, "/products")} className="inline-flex shrink-0 items-center gap-2 font-semibold text-bark-900 hover:underline">
                  {t.home.viewAll} <ArrowRightIcon />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        {featured.length === 0 ? (
          <p className="editorial-panel mt-8 rounded-3xl p-10 text-center text-bark-600">
            {t.home.emptyBefore}<code className="font-mono">npm run db:seed</code>{t.home.emptyAfter}
          </p>
        ) : (
          <div className="mt-10 grid gap-8 sm:gap-12">
            {featured.map((product, index) => (
              <Reveal key={product.id} variant={index % 2 ? "right" : "left"}>
                <FeaturedProductStory
                  product={product}
                  reverse={index % 2 === 1}
                  priority={index === 0}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <Reveal className="mt-24 sm:mt-36" variant="scale">
        <section aria-labelledby="how" className="overflow-hidden rounded-[2rem] bg-bark-900 p-6 text-white sm:rounded-[3rem] sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="section-kicker !text-marigold-400 before:!bg-marigold-400">01 — 03</p>
              <h2 id="how" className="mt-5 font-display text-4xl font-medium leading-none text-white sm:text-6xl">
                {t.how.heading}
              </h2>
            </div>
            <ol className="border-t border-white/20">
              {steps.map((step, index) => (
                <li key={step.title} className="grid gap-4 border-b border-white/20 py-7 sm:grid-cols-[4rem_1fr] sm:py-9">
                  <span className="font-mono text-sm text-marigold-400">0{index + 1}</span>
                  <div className="grid gap-3 sm:grid-cols-[0.75fr_1.25fr]">
                    <h3 className="flex items-start gap-3 font-display text-2xl text-white">
                      <step.icon className="mt-1 text-marigold-400" /> {step.title}
                    </h3>
                    <p className="leading-relaxed text-bark-100">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </Reveal>

      <section className="mx-auto mt-24 max-w-7xl sm:mt-36">
        <Reveal>
          <p className="section-kicker">{t.home.shopByCategory}</p>
          <h2 className="editorial-heading mt-5 max-w-4xl">{t.home.shopByCategory}</h2>
        </Reveal>
        <div className="mt-10 grid auto-rows-[12rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {categories.map((category, index) => {
            const span = index % 5 === 0 ? "lg:col-span-7" : index % 5 === 1 ? "lg:col-span-5" : "lg:col-span-4";
            return (
              <Reveal key={category.id} delay={index * 55} className={span}>
                <Link
                  href={localePath(locale, `/products?category=${category.slug}`)}
                  className="card-lift group relative flex h-full overflow-hidden rounded-[1.75rem] border border-bark-200 bg-bark-900 p-6 text-white shadow-soft"
                >
                  {category.products[0]?.imageUrl ? (
                    <Image src={category.products[0].imageUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover opacity-55 transition-transform duration-700 group-hover:scale-105" />
                  ) : null}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-bark-900 via-bark-900/35 to-transparent" />
                  <span className="relative mt-auto flex w-full items-end justify-between gap-4">
                    <span>
                      <span className="font-mono text-xs text-marigold-400">0{index + 1}</span>
                      <span className="mt-2 block font-display text-2xl font-medium text-white sm:text-3xl">
                        {localised(locale, category.name, category.nameTa)}
                      </span>
                    </span>
                    <ArrowRightIcon className="text-2xl text-marigold-400 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {farmers.length > 0 ? (
        <section className="mx-auto mt-24 max-w-7xl sm:mt-36">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="section-kicker">{t.home.farmsHeading}</p>
                <h2 className="editorial-heading mt-5">{t.home.farmsHeading}</h2>
              </div>
              <Link href={localePath(locale, "/farmers")} className="inline-flex items-center gap-2 font-semibold text-bark-900 hover:underline">
                {t.home.viewAll} <ArrowRightIcon />
              </Link>
            </div>
          </Reveal>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {farmers.slice(0, 4).map((farmer, index) => (
              <li key={farmer.id}>
                <Reveal delay={index * 70}>
                  <Link href={localePath(locale, `/farmers/${farmer.slug}`)} className="editorial-panel card-lift group grid min-h-72 overflow-hidden rounded-[2rem] sm:grid-cols-[0.9fr_1.1fr]">
                    <span className="relative min-h-48 overflow-hidden bg-leaf-50">
                      {farmer.photoUrl ? (
                        <Image src={farmer.photoUrl} alt="" fill sizes="(max-width: 640px) 100vw, 40vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : null}
                    </span>
                    <span className="flex flex-col justify-between p-6 sm:p-8">
                      <span>
                        <span className="section-kicker">0{index + 1}</span>
                        <span className="mt-5 block font-display text-3xl font-medium leading-none text-bark-900">{farmer.farmName}</span>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-bark-600"><MapPinIcon /> {regionLabel(locale, farmer.region)}</span>
                      </span>
                      <span className="mt-7 flex items-center justify-between border-t border-bark-200 pt-4 text-sm font-semibold text-leaf-700">
                        {format(farmer._count.products === 1 ? t.farmers.listingCount : t.farmers.listingCountPlural, { count: farmer._count.products })}
                        <ArrowRightIcon />
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Reveal className="mt-24 sm:mt-36" variant="scale">
        <section className="overflow-hidden rounded-[2rem] border border-bark-200 bg-marigold-500 p-6 text-bark-900 sm:rounded-[3rem] sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <div>
              <p className="section-kicker !text-bark-900 before:!bg-bark-900">{t.home.communityHeading}</p>
              <h2 className="mt-5 font-display text-4xl font-medium leading-none sm:text-6xl">{t.home.communityHeading}</h2>
              <p className="mt-5 max-w-lg leading-relaxed">{t.home.communityIntro}</p>
            </div>
            <div className="grid border-y border-bark-900/25 sm:grid-cols-3">
              {members.map((member) => (
                <div key={member.href} className="flex flex-col border-b border-bark-900/25 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0">
                  <p className="font-display text-6xl font-medium leading-none">{member.count}</p>
                  <p className="mt-2 min-h-12 text-sm">{member.label}</p>
                  <Link href={localePath(locale, member.href)} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold hover:underline">
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
