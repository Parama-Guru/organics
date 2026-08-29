import Link from "next/link";

import { FilterChip } from "@/components/filter-chip";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { format, localePath } from "@/lib/i18n/config";
import { localised, localisedOrNull, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getCategories, getProducts, getRegions } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.shopTitle, description: t.meta.shopDescription };
}

type Filters = { category?: string; region?: string; search?: string };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Filters compose, so every link has to carry the ones it is not changing.
function hrefWith(base: string, current: Filters, patch: Filters): string {
  const next = { ...current, ...patch };
  const query = new URLSearchParams();

  for (const key of ["category", "region", "search"] as const) {
    const value = next[key];
    if (value) query.set(key, value);
  }

  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function ProductsPage({ searchParams }: PageProps<"/[lang]/products">) {
  const params = await searchParams;
  const filters: Filters = {
    category: firstValue(params.category)?.slice(0, 100),
    region: firstValue(params.region)?.slice(0, 100),
    search: firstValue(params.search)?.slice(0, 100),
  };

  const [products, categories, regions, locale, t] = await Promise.all([
    getProducts({
      categorySlug: filters.category,
      region: filters.region,
      search: filters.search,
    }),
    getCategories(),
    getRegions(),
    getLocale(),
    getDictionary(),
  ]);

  const base = localePath(locale, "/products");
  const activeCategory = categories.find((category) => category.slug === filters.category);
  const isFiltered = Boolean(filters.category || filters.region || filters.search);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">
        {activeCategory
          ? localised(locale, activeCategory.name, activeCategory.nameTa)
          : t.products.allProduce}
        {filters.region ? (
          <span className="text-bark-600">
            {" "}
            {format(t.products.fromRegion, { region: regionLabel(locale, filters.region) })}
          </span>
        ) : null}
      </h1>
      <p className="mt-2 text-bark-600">
        {(activeCategory
          ? localisedOrNull(locale, activeCategory.description, activeCategory.descriptionTa)
          : null) ?? t.products.everythingNow}
      </p>

      <form method="get" className="mt-6 flex max-w-md gap-2" role="search">
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
          className="w-full rounded-full border border-bark-200 bg-white/80 px-5 py-2.5 shadow-soft backdrop-blur transition-[border-color,box-shadow] placeholder:text-bark-600/55 focus:border-marigold-400 focus:outline-none focus:ring-4 focus:ring-marigold-400/25"
        />
        <Button type="submit" variant="dark">
          {t.products.search}
        </Button>
      </form>

      <nav aria-label={t.products.category} className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-bark-600">
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
        <nav aria-label={t.products.region} className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-bark-600">
            {t.products.region}
          </span>
          <FilterChip
            href={hrefWith(base, filters, { region: undefined })}
            active={!filters.region}
          >
            {t.products.all}
          </FilterChip>
          {regions.map((region) => (
            <FilterChip
              key={region}
              href={hrefWith(base, filters, { region })}
              active={region === filters.region}
            >
              {regionLabel(locale, region)}
            </FilterChip>
          ))}
        </nav>
      ) : null}

      {products.length === 0 ? (
        <div className="glass mt-10 animate-rise rounded-3xl p-12 text-center">
          <span aria-hidden className="text-5xl">
            {"\u{1F50D}"}
          </span>
          <p className="mt-4 font-display text-xl">{t.products.noMatch}</p>
          {isFiltered ? (
            <Button as={Link} href={base} variant="secondary" className="mt-5">
              {t.products.clearFilters}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
              className="animate-rise"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
