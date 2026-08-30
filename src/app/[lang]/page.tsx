import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { getVerifiedFarmers } from "@/lib/farmers";
import { format, localePath } from "@/lib/i18n/config";
import { localised, localisedOrNull, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getCategories, getFeaturedProducts } from "@/lib/products";

// The catalog lives in Postgres, which is not reachable while the Docker image builds.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories, farmers, locale, t] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getVerifiedFarmers(),
    getLocale(),
    getDictionary(),
  ]);

  const steps = [
    { icon: ShieldCheckIcon, title: t.how.step1Title, body: t.how.step1Body },
    { icon: MapPinIcon, title: t.how.step2Title, body: t.how.step2Body },
    { icon: PhoneIcon, title: t.how.step3Title, body: t.how.step3Body },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="relative mt-6 animate-rise overflow-hidden rounded-[1.75rem] bg-bark-900 text-white sm:mt-10 sm:rounded-[2rem]">
        <div className="grid items-stretch gap-0 md:grid-cols-[minmax(0,1fr)_44%]">
          {/* Food first on phones: a dark box tells nobody what this site sells.
              Capped at 160px so the headline and CTA still make the first screen. */}
          <div className="relative order-first h-40 md:order-last md:h-auto md:min-h-[24rem]">
            <Image
              src="/hero.svg"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 44vw"
              className="object-cover object-bottom"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-bark-900/70 via-bark-900/10 to-transparent md:bg-gradient-to-r md:from-bark-900 md:via-bark-900/35 md:to-transparent"
            />
          </div>

          <div className="relative px-5 pb-10 pt-8 sm:px-10 sm:pb-14 sm:pt-12">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-sm font-medium text-marigold-100 ring-1 ring-inset ring-white/25 backdrop-blur">
              <ShieldCheckIcon className="text-base text-marigold-400" />
              {t.home.badge}
            </p>
            <h1 className="mt-4 max-w-xl font-display text-[1.75rem] leading-[1.15] xs:text-[2.25rem] sm:text-5xl">
              {t.home.titleLead}
              <span className="text-marigold-400">{t.home.titleAccent}</span>
              {t.home.titleTail}
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-bark-100 sm:text-lg">
              {t.home.intro}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button as={Link} href={localePath(locale, "/products")} size="lg">
                {t.home.browse}
                <ArrowRightIcon />
              </Button>
              <Button as={Link} href={localePath(locale, "/farmers")} size="lg" variant="onDark">
                {t.home.meetFarmers}
              </Button>
            </div>

            {/* Not the farm count. "6 farms" set at 36px is a reason to leave,
                and the number is not what a buyer is weighing up anyway. */}
            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-5 text-sm">
              {[
                { n: "100%", label: t.home.statChecked },
                { n: "0%", label: t.home.statCommission },
                { n: "1", label: t.home.statCall },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl text-white sm:text-3xl">{stat.n}</dt>
                  <dd className="mt-0.5 text-bark-100">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mt-16 sm:mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 className="font-display text-3xl sm:text-4xl">
            {t.home.weeklyPick}
            <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-leaf-500" />
          </h2>
          <Link
            href={localePath(locale, "/products")}
            className="shrink-0 text-sm font-medium text-leaf-700 underline-offset-4 hover:underline"
          >
            {t.home.viewAll}
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-bark-200 bg-white p-8 text-center text-bark-600">
            {t.home.emptyBefore}
            <code className="font-mono">npm run db:seed</code>
            {t.home.emptyAfter}
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product, index) => (
              <div
                key={product.id}
                style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
                className="animate-rise"
              >
                <ProductCard product={product} priority={index < 2} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* A tinted band so five same-weight sections do not read as one column. */}
      <section
        aria-labelledby="how"
        className="mt-16 rounded-[1.75rem] bg-leaf-50/70 px-5 py-10 ring-1 ring-inset ring-leaf-100 sm:mt-24 sm:px-10"
      >
        <h2 id="how" className="font-display text-3xl sm:text-4xl">
          {t.how.heading}
          <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-leaf-500" />
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              style={{ animationDelay: `${index * 70}ms` }}
              className="animate-rise rounded-2xl border border-white bg-white p-5 shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-100 text-xl text-leaf-800">
                <step.icon />
              </span>
              <h3 className="mt-3 font-display text-lg">{step.title}</h3>
              <p className="mt-1 leading-relaxed text-bark-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 sm:mt-24">
        <h2 className="font-display text-3xl sm:text-4xl">
          {t.home.shopByCategory}
          <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-marigold-500" />
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={localePath(locale, `/products?category=${category.slug}`)}
              style={{ animationDelay: `${index * 55}ms` }}
              className="card-lift group flex animate-rise items-start gap-4 rounded-2xl border border-white bg-white p-5 shadow-soft"
            >
              {/* A thumbnail of something in the category, so the six tiles are
                  not six identically shaped boxes of text. */}
              <span
                aria-hidden
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-leaf-50 sm:h-16 sm:w-16"
              >
                {category.products[0]?.imageUrl ? (
                  <Image
                    src={category.products[0].imageUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center justify-between gap-2 font-display text-lg">
                  <span className="min-w-0 break-words">
                    {localised(locale, category.name, category.nameTa)}
                  </span>
                  <ArrowRightIcon
                    aria-hidden
                    className="shrink-0 text-marigold-500 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </span>
                {category.description ? (
                  <span className="mt-1 block text-sm leading-relaxed text-bark-600">
                    {localisedOrNull(locale, category.description, category.descriptionTa)}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}

          {/* Sixth tile so the grid never ends on an empty cell. */}
          <Link
            href={localePath(locale, "/products")}
            className="card-lift group flex animate-rise items-center justify-between gap-3 rounded-2xl border-2 border-bark-900 bg-bark-900 p-5 text-bark-50 shadow-soft"
          >
            <span className="font-display text-lg">{t.home.viewAll}</span>
            <ArrowRightIcon
              aria-hidden
              className="text-marigold-400 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>



      {farmers.length > 0 ? (
        <section className="mt-16 sm:mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 className="font-display text-3xl sm:text-4xl">
              {t.home.farmsHeading}
              <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-marigold-500" />
            </h2>
            <Link
              href={localePath(locale, "/farmers")}
              className="shrink-0 text-sm font-medium text-leaf-700 underline-offset-4 hover:underline"
            >
              {t.home.viewAll}
            </Link>
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {farmers.slice(0, 4).map((farmer, index) => (
              <li key={farmer.id} style={{ animationDelay: `${index * 55}ms` }} className="animate-rise">
                <Link
                  href={localePath(locale, `/farmers/${farmer.slug}`)}
                  className="card-lift group block overflow-hidden rounded-2xl border border-white/70 bg-white shadow-soft"
                >
                  <div className="relative h-24 overflow-hidden bg-leaf-50">
                    {farmer.photoUrl ? (
                      <Image
                        src={farmer.photoUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-3.5">
                    <p className="font-display text-base leading-snug break-words">
                      {farmer.farmName}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-bark-600">
                      <MapPinIcon /> {regionLabel(locale, farmer.region)}
                    </p>
                    <p className="mt-2 text-xs font-medium text-leaf-700">
                      {format(
                        farmer._count.products === 1
                          ? t.farmers.listingCount
                          : t.farmers.listingCountPlural,
                        { count: farmer._count.products },
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
