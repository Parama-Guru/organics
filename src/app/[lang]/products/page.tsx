import Link from "next/link";

import { FilterChip } from "@/components/filter-chip";
import { PhoneSoonNotice } from "@/components/phone-soon-notice";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { BasketIcon, SearchIcon } from "@/components/ui/icons";
import { format, localePath } from "@/lib/i18n/config";
import { localised, localisedOrNull, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getCategories, getProducts, getRegions } from "@/lib/products";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { savedProductIds } from "@/lib/saved";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/product-query-schema";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.shopTitle, description: t.meta.shopDescription };
}

type Filters = { category?: string; region?: string; search?: string; sort?: string };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Filters compose, so every link has to carry the ones it is not changing.
function hrefWith(base: string, current: Filters, patch: Filters): string {
  const next = { ...current, ...patch };
  const query = new URLSearchParams();

  for (const key of ["category", "region", "search", "sort"] as const) {
    const value = next[key];
    if (value) query.set(key, value);
  }

  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function ProductsPage({ searchParams }: PageProps<"/[lang]/products">) {
  const params = await searchParams;
  const requestedSort = firstValue(params.sort);
  const sort: ProductSort = PRODUCT_SORTS.includes(requestedSort as ProductSort)
    ? (requestedSort as ProductSort)
    : "name";
  const filters: Filters = {
    category: firstValue(params.category)?.slice(0, 100),
    region: firstValue(params.region)?.slice(0, 100),
    search: firstValue(params.search)?.slice(0, 100),
    sort: sort === "name" ? undefined : sort,
  };

  const [products, categories, regions, locale, t] = await Promise.all([
    getProducts({
      categorySlug: filters.category,
      region: filters.region,
      search: filters.search,
      sort,
      locale: await getLocale(),
    }),
    getCategories(),
    getRegions(),
    getLocale(),
    getDictionary(),
  ]);

  const base = localePath(locale, "/products");
  const accountsOn = accountsEnabled();
  const customer = accountsOn ? await getCustomer() : null;
  // One query for the whole grid rather than one per card.
  const saved = customer
    ? await savedProductIds(customer.id, products.map((p) => p.id))
    : new Set<string>();
  const activeCategory = categories.find((category) => category.slug === filters.category);
  const activeRegion = regions.find((region) => region.slug === filters.region);
  const isFiltered = Boolean(filters.category || filters.region || filters.search);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">
        {activeCategory
          ? localised(locale, activeCategory.name, activeCategory.nameTa)
          : t.products.allProduce}
        {activeRegion ? (
          <span className="text-bark-600">
            {" "}
            {format(t.products.fromRegion, { region: regionLabel(locale, activeRegion) })}
          </span>
        ) : null}
      </h1>
      <p className="mt-2 text-bark-600">
        {(activeCategory
          ? localisedOrNull(locale, activeCategory.description, activeCategory.descriptionTa)
          : null) ?? t.products.everythingNow}
      </p>

      <PhoneSoonNotice className="mt-4" />

      <form method="get" className="relative mt-6 flex max-w-md gap-2" role="search">
        {filters.category ? (
          <input type="hidden" name="category" value={filters.category} />
        ) : null}
        {filters.region ? <input type="hidden" name="region" value={filters.region} /> : null}
        <input
          type="search"
          name="search"
          defaultValue={filters.search ?? ""}
          maxLength={100}
          placeholder={t.products.searchPlaceholder}
          aria-label={t.products.searchLabel}
          className="w-full rounded-full border border-bark-200 bg-white/80 py-2.5 pl-11 pr-5 shadow-soft backdrop-blur transition-[border-color,box-shadow] placeholder:text-bark-600/55 focus:border-marigold-400 focus:outline-none focus:ring-4 focus:ring-marigold-400/25"
        />
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-bark-600"
        />
        <Button type="submit" variant="dark">
          {t.products.search}
        </Button>
      </form>

      {/* These used to be a horizontal scroll rail on phones. At 390px the
          category rail was 972px wide, so four of the six categories sat off
          screen with nothing to say they existed, and the last visible one was
          sliced mid-word. Filters are primary navigation: they wrap now, and
          cost a second line instead of hiding most of themselves. */}
      <nav
        aria-label={t.products.category}
        className="mt-6 flex flex-wrap items-center gap-2"
      >
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-bark-600">
          {t.products.category}
        </span>
        <FilterChip
          href={hrefWith(base, filters, { category: undefined })}
          active={!filters.category}
        >
          {t.products.all}
        </FilterChip>
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            href={hrefWith(base, filters, { category: category.slug })}
            active={category.slug === filters.category}
          >
            {localised(locale, category.name, category.nameTa)}
          </FilterChip>
        ))}
      </nav>

      {regions.length > 0 ? (
        <nav
          aria-label={t.products.region}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-bark-600">
            {t.products.region}
          </span>
          <FilterChip
            href={hrefWith(base, filters, { region: undefined })}
            active={!activeRegion}
          >
            {t.products.all}
          </FilterChip>
          {regions.map((region) => (
            <FilterChip
              key={region.slug}
              href={hrefWith(base, filters, { region: region.slug })}
              active={region.slug === activeRegion?.slug}
            >
              {regionLabel(locale, region)}
            </FilterChip>
          ))}
        </nav>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="text-sm font-medium text-bark-600" role="status">
          {format(products.length === 1 ? t.products.resultCount : t.products.resultCountPlural, {
            count: products.length,
          })}
        </p>

        <nav aria-label={t.products.sort} className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-bark-600">
            {t.products.sort}
          </span>
          {(
            [
              ["name", t.products.sortName],
              ["price-asc", t.products.sortPriceAsc],
              ["price-desc", t.products.sortPriceDesc],
            ] as const
          ).map(([value, label]) => (
            <FilterChip
              key={value}
              href={hrefWith(base, filters, { sort: value === "name" ? undefined : value })}
              active={sort === value}
            >
              {label}
            </FilterChip>
          ))}
        </nav>
      </div>

      {/* One card per row below 400px. At two-up a card is ~166px wide, which
          is narrower than a single Tamil word: "கருவேப்பிலைக்" broke across two
          lines mid-word. Tamil takes no hyphen, so a mid-word break just reads
          as a mistake. */}
      {products.length === 0 ? (
        <div className="glass mt-4 animate-rise rounded-3xl p-12 text-center">
          <BasketIcon className="mx-auto text-5xl text-bark-200" />
          <p className="mt-4 font-display text-xl">{t.products.noMatch}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-bark-600">{t.products.noMatchHint}</p>
          {isFiltered ? (
            <Button as={Link} href={base} variant="secondary" className="mt-5">
              {t.products.clearFilters}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
              className="animate-rise"
            >
              <ProductCard
                product={product}
                saveState={
                  !accountsOn
                    ? "hidden"
                    : !customer
                      ? "signedOut"
                      : saved.has(product.id)
                        ? "saved"
                        : "unsaved"
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
