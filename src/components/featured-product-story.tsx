import Link from "next/link";

import { ImageField } from "@/components/image-field";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, CheckIcon, LockIcon, MapPinIcon } from "@/components/ui/icons";
import { checkedOn } from "@/lib/i18n/dates";
import { format, localePath } from "@/lib/i18n/config";
import { localised, regionLabel, unitLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { sellerDetailsUnlocked } from "@/lib/seller-visibility";
import type { ProductSummary } from "@/lib/products";

/**
 * A compact upright story card. This was a full-width alternating band about
 * 450px tall each, which spent a third of the home page on three items.
 */
export async function FeaturedProductStory({
  product,
  priority = false,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const [locale, t, priceShown] = await Promise.all([
    getLocale(),
    getDictionary(),
    sellerDetailsUnlocked(),
  ]);
  const href = localePath(locale, `/products/${product.slug}`);

  return (
    <article className="editorial-panel card-lift group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.5rem]">
      <Link
        href={href}
        aria-hidden
        tabIndex={-1}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        <ImageField
          src={product.imageUrl}
          alt=""
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          fallbackLabel={t.products.noPhotograph}
          className="h-full w-full transition-transform duration-700 ease-settle group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 z-5">
          <Badge tone="marigold">
            {localised(locale, product.category.name, product.category.nameTa)}
          </Badge>
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <p className="rule-label truncate text-bark-600">{product.farmer?.farmName}</p>

        <h3 className="mt-2 font-display text-2xl leading-[1.1] text-bark-900">
          <Link
            href={href}
            className="decoration-marigold-600 decoration-2 underline-offset-4 hover:underline"
          >
            {localised(locale, product.name, product.nameTa)}
          </Link>
        </h3>

        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-bark-600">
          {localised(locale, product.description, product.descriptionTa)}
        </p>

        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {product.farmer?.verifiedAt ? (
            <span className="rule-label inline-flex items-center gap-1 text-leaf-700">
              <CheckIcon className="h-3.5 w-3.5" />
              {format(t.products.checkedOn, {
                date: checkedOn(product.farmer.verifiedAt, locale),
              })}
            </span>
          ) : null}
          {product.region ? (
            <span className="rule-label inline-flex items-center gap-1 text-bark-600">
              <MapPinIcon className="h-3.5 w-3.5" /> {regionLabel(locale, product.region)}
            </span>
          ) : null}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-bark-200 pt-3.5">
          <p className="min-w-0">
            {priceShown ? (
              <span className="block whitespace-nowrap font-display text-2xl leading-none text-bark-900">
                {formatMoney(product.priceCents)}
              </span>
            ) : (
              <span className="flex min-w-0 items-start gap-1.5 font-display text-lg leading-tight text-bark-600">
                <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0 [overflow-wrap:anywhere]">{t.products.priceLocked}</span>
              </span>
            )}
            <span className="rule-label mt-1.5 block text-bark-600">
              {unitLabel(locale, product.unit)}
            </span>
          </p>

          <Link
            href={href}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-bark-900 underline-offset-4 hover:underline"
          >
            {t.products.view}
            <ArrowRightIcon className="transition-transform duration-300 ease-settle group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
