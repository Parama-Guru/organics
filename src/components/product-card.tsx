import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CheckIcon, LeafMark, MapPinIcon } from "@/components/ui/icons";
import { checkedOn } from "@/lib/i18n/dates";
import { format, localePath } from "@/lib/i18n/config";
import { localised, regionLabel, unitLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import type { ProductSummary } from "@/lib/products";

export async function ProductCard({
  product,
  priority = false,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  const href = localePath(locale, `/products/${product.slug}`);

  return (
    <article className="card-lift group flex h-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-soft">
      {/* Decorative duplicate of the title link, so it is kept out of the a11y tree. */}
      <Link
        href={href}
        className="relative block aspect-[8/5] overflow-hidden bg-leaf-50"
        aria-hidden
        tabIndex={-1}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <span aria-hidden className="flex h-full items-center justify-center text-5xl">
            {product.emoji ?? "\u{1F331}"}
          </span>
        )}

        {product.farmer?.verifiedAt ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[0.72rem] font-semibold text-leaf-800 shadow-soft backdrop-blur">
            <CheckIcon /> {format(t.products.checkedOn, { date: checkedOn(product.farmer.verifiedAt, locale) })}
          </span>
        ) : null}

        {product.region ? (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-bark-900/80 px-2 py-1 text-[0.72rem] font-medium text-bark-50 backdrop-blur">
            <MapPinIcon /> {regionLabel(locale, product.region)}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {/* Two lines: "சமையலறைப் பொருட்கள்" does not fit one at this width. */}
        <p className="line-clamp-2 min-h-[2.1rem] text-xs font-semibold uppercase tracking-[0.06em] text-leaf-700">
          {localised(locale, product.category.name, product.category.nameTa)}
        </p>

        {/* Three lines. At two, seven Tamil names lost their last word —
            "மரச்செக்கு தேங்காய் எண்ணெய்" lost the word "oil". The reserved height
            matches three lines exactly, so a short name and a long one occupy
            the same box and the grid stays flush. */}
        <h3 className="line-clamp-3 min-h-[4.35rem] font-display text-[1.0625rem] leading-snug sm:min-h-[4.6rem] sm:text-lg">
          <Link
            href={href}
            className="decoration-marigold-500 decoration-2 underline-offset-4 hover:underline"
          >
            {localised(locale, product.name, product.nameTa)}
          </Link>
        </h3>

        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-ink">
          {localised(locale, product.description, product.descriptionTa)}
        </p>

        {/* The farm is the point of a directory, so it gets two full lines rather
            than the single clamped line that hid 67% of every Tamil farm name.
            Reserved and capped at two so the grid stays uniform. */}
        {product.farmer ? (
          <p className="mt-0.5 flex min-h-[2.5rem] items-start gap-1.5 text-[0.8125rem] leading-snug sm:text-sm">
            <LeafMark aria-hidden className="mt-0.5 shrink-0 text-leaf-600" />
            <Link
              href={localePath(locale, `/farmers/${product.farmer.slug}`)}
              className="line-clamp-2 font-semibold text-bark-900 decoration-marigold-500 decoration-2 underline-offset-2 hover:underline"
            >
              {product.farmer.farmName}
            </Link>
          </p>
        ) : null}

        {/* Price and unit stack rather than share a line. Clamped to one line the
            Tamil unit lost half its text — "6 எண் பெட்டி" became "6 எண்…" — and
            the quantity is half of what a price means. */}
        <div className="mt-auto border-t border-bark-200/60 pt-3">
          <p className="whitespace-nowrap font-display text-2xl leading-tight">
            {formatMoney(product.priceCents)}
          </p>
          <p className="min-h-[2.3rem] text-sm leading-snug text-bark-600">
            {format(t.products.perUnitShort, { unit: unitLabel(locale, product.unit) })}
          </p>

          {/* No icon, and tighter side padding than the default button: at two
              columns on a 390px phone the Tamil label had only ~101px to sit in
              and wrapped to two lines while English stayed on one. */}
          <Button
            as={Link}
            href={href}
            size="sm"
            className="mt-2 w-full px-2 text-xs sm:px-4 sm:text-[0.8125rem]"
          >
            {t.products.viewAndCall}
          </Button>
        </div>
      </div>
    </article>
  );
}
