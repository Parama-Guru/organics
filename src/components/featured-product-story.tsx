import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon, MapPinIcon } from "@/components/ui/icons";
import { checkedOn } from "@/lib/i18n/dates";
import { format, localePath } from "@/lib/i18n/config";
import { localised, regionLabel, unitLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import type { ProductSummary } from "@/lib/products";

export async function FeaturedProductStory({
  product,
  reverse = false,
  priority = false,
}: {
  product: ProductSummary;
  reverse?: boolean;
  priority?: boolean;
}) {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  const href = localePath(locale, `/products/${product.slug}`);

  return (
    <article className="editorial-panel group grid overflow-hidden rounded-[2rem] md:grid-cols-2">
      <Link
        href={href}
        aria-hidden
        tabIndex={-1}
        className={`relative min-h-64 overflow-hidden bg-leaf-50 md:min-h-[25rem] ${reverse ? "md:order-2" : ""}`}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-7xl">
            {product.emoji ?? "🌱"}
          </span>
        )}
        <span className="absolute left-5 top-5">
          <Badge tone="marigold">{localised(locale, product.category.name, product.category.nameTa)}</Badge>
        </span>
      </Link>

      <div className={`flex flex-col justify-between p-6 sm:p-9 lg:p-12 ${reverse ? "md:order-1" : ""}`}>
        <div>
          <p className="section-kicker">{product.farmer?.farmName}</p>
          <h3 className="mt-5 font-display text-3xl font-medium leading-[1.05] text-bark-900 sm:text-4xl">
            <Link href={href} className="decoration-marigold-500 decoration-2 underline-offset-8 hover:underline">
              {localised(locale, product.name, product.nameTa)}
            </Link>
          </h3>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-bark-600 sm:text-lg">
            {localised(locale, product.description, product.descriptionTa)}
          </p>
        </div>

        <div className="mt-8">
          <p className="font-display text-3xl font-medium text-bark-900">
            {formatMoney(product.priceCents)}
          </p>
          <p className="mt-1 text-sm text-bark-600">
            {format(t.products.perUnitShort, { unit: unitLabel(locale, product.unit) })}
          </p>
          <p className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-bark-600">
            {product.farmer?.verifiedAt ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-leaf-700">
                <CheckIcon />
                {format(t.products.checkedOn, {
                  date: checkedOn(product.farmer.verifiedAt, locale),
                })}
              </span>
            ) : null}
            {product.region ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon /> {regionLabel(locale, product.region)}
              </span>
            ) : null}
          </p>
          <Button as={Link} href={href} className="mt-6">
            {t.products.viewAndCall} <ArrowRightIcon />
          </Button>
        </div>
      </div>
    </article>
  );
}
