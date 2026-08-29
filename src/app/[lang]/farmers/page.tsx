import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVerifiedFarmers } from "@/lib/farmers";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Badge tone="leaf">
        <span aria-hidden>&#10003;</span> {t.farmers.everyFarmVerified}
      </Badge>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">{t.farmers.title}</h1>
      <p className="mt-3 max-w-2xl text-bark-600">{t.farmers.intro}</p>

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
            <Link
              key={farmer.id}
              href={localePath(locale, `/farmers/${farmer.slug}`)}
              style={{ animationDelay: `${index * 60}ms` }}
              className="group animate-rise rounded-3xl border border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-marigold-400/70 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-100 text-2xl"
                >
                  {"\u{1F33E}"}
                </span>
                <Badge tone="leaf">{regionLabel(locale, farmer.region)}</Badge>
              </div>

              <h2 className="mt-4 font-display text-xl break-words">{farmer.farmName}</h2>
              <p className="text-sm text-bark-600">{farmer.contactName}</p>
              {farmer.about ? (
                <p className="mt-3 line-clamp-3 text-sm text-bark-600">
                  {localisedOrNull(locale, farmer.about, farmer.aboutTa)}
                </p>
              ) : null}

              <p className="mt-4 border-t border-bark-200/60 pt-3 text-sm font-medium">
                {format(
                  farmer._count.products === 1
                    ? t.farmers.listingCount
                    : t.farmers.listingCountPlural,
                  { count: farmer._count.products },
                )}
                <span
                  aria-hidden
                  className="ml-2 inline-block text-marigold-500 transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}

      <section className="glass mt-14 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-8">
        <div className="min-w-0">
          <h2 className="font-display text-2xl">{t.farmers.growOrganic}</h2>
          <p className="mt-1 text-bark-600">{t.farmers.applyHere}</p>
        </div>
        <Button as={Link} href={localePath(locale, "/sell")} size="lg">
          {t.nav.sell}
        </Button>
      </section>
    </div>
  );
}
