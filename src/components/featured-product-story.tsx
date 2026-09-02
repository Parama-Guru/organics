import Link from "next/link";

import { ImageField } from "@/components/image-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon, LockIcon, MapPinIcon } from "@/components/ui/icons";
import { checkedOn } from "@/lib/i18n/dates";
import { format, localePath } from "@/lib/i18n/config";
import { localised, regionLabel, unitLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { sellerDetailsUnlocked } from "@/lib/seller-visibility";
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
  const [locale, t, priceShown] = await Promise.all([
    getLocale(),
    getDictionary(),
    sellerDetailsUnlocked(),
  ]);
  const href = localePath(locale, `/products/${product.slug}`);

  return (
    <article className="editorial-panel group grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[2rem] md:grid-cols-2">
      <Link
        href={href}
        aria-hidden
        tabIndex={-1}
        className={`relative min-h-64 overflow-hidden md:min-h-[26rem] ${reverse ? "md:order-2" : ""}`}
      >
        <ImageField
          src={product.imageUrl}
          alt=""
          priority={priority}
          sizes="(max-width: 768px) 100vw, 50vw"
          fallbackLabel={t.products.noPhotograph}
          className="h-full w-full"
        />
        <span className="absolute left-5 top-5 z-5">
          <Badge tone="marigold">
            {localised(locale, product.category.name, product.category.nameTa)}
          </Badge>
        </span>
      </Link>

      <div
        className={`flex min-w-0 flex-col justify-between p-6 sm:p-9 lg:p-12 ${reverse ? "md:order-1" : ""}`}
      >
        <div className="min-w-0">
          <p className="section-kicker">{product.farmer?.farmName}</p>
          <h3 className="mt-5 font-display text-3xl leading-[1.05] text-bark-900 sm:text-4xl">
            <Link
              href={href}
              className="decoration-marigold-600 decoration-2 underline-offset-8 hover:underline"
            >
              {localised(locale, product.name, product.nameTa)}
            </Link>
          </h3>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-bark-600 sm:text-lg">
            {localised(locale, product.description, product.descriptionTa)}
          </p>
        </div>

        <div className="mt-8">
          {priceShown ? (
            <p className="font-display text-3xl text-bark-900">{formatMoney(product.priceCents)}</p>
          ) : (
            <p className="flex min-w-0 items-start gap-2 font-display text-2xl leading-tight text-bark-600">
              <LockIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{t.products.priceLocked}</span>
            </p>
          )}
          <p className="rule-label mt-2 text-bark-600">{unitLabel(locale, product.unit)}</p>
          <p className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {product.farmer?.verifiedAt ? (
              <span className="rule-label inline-flex items-center gap-1.5 text-leaf-700">
                <CheckIcon className="h-3.5 w-3.5" />
                {format(t.products.checkedOn, {
                  date: checkedOn(product.farmer.verifiedAt, locale),
                })}
              </span>
            ) : null}
            {product.region ? (
              <span className="rule-label inline-flex items-center gap-1.5 text-bark-600">
                <MapPinIcon className="h-3.5 w-3.5" /> {regionLabel(locale, product.region)}
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
