import Link from "next/link";

import { ImageField } from "@/components/image-field";
import { SaveButton } from "@/components/save-button";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon, MapPinIcon } from "@/components/ui/icons";
import { checkedOn } from "@/lib/i18n/dates";
import { format, localePath } from "@/lib/i18n/config";
import { localised, regionLabel, unitLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import type { ProductSummary } from "@/lib/products";

/**
 * A catalogue entry, not a shop tile: numbered, ruled, and led by the specimen
 * plate rather than by a cropped thumbnail.
 */
export async function ProductCard({
  product,
  index,
  priority = false,
  saveState = "hidden",
}: {
  product: ProductSummary;
  /** Catalogue number shown on the plate. */
  index?: number;
  priority?: boolean;
  // "signedOut" renders a link to sign in, so the shortlist is discoverable by
  // the people who do not have an account yet.
  saveState?: "hidden" | "saved" | "unsaved" | "signedOut";
}) {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  const href = localePath(locale, `/products/${product.slug}`);
  const name = localised(locale, product.name, product.nameTa);

  return (
    <article className="group flex h-full min-w-0 flex-col">
      <Link
        href={href}
        aria-hidden
        tabIndex={-1}
        className="relative block aspect-[3/2] overflow-hidden rounded-[1.25rem] border border-bark-200"
      >
        <ImageField
          src={product.imageUrl}
          alt=""
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          fallbackLabel={t.products.noPhotograph}
          className="h-full w-full"
        />

        <span className="rule-label absolute left-3 top-3 z-5 rounded-full bg-paper/90 px-2.5 py-1 text-bark-600">
          {index === undefined ? localised(locale, product.category.name, product.category.nameTa) : String(index + 1).padStart(2, "0")}
        </span>

        {/* Slides up on hover and is always present for a keyboard user, who
            reaches the real link in the heading below. */}
        <span className="absolute inset-x-3 bottom-3 z-5 flex translate-y-2 items-center justify-between gap-2 rounded-full bg-inverse/90 px-3 py-2 opacity-0 backdrop-blur transition duration-300 ease-settle group-hover:translate-y-0 group-hover:opacity-100">
          <span className="rule-label truncate text-marigold-400">{t.products.viewAndCall}</span>
          <ArrowRightIcon className="shrink-0 text-marigold-400" />
        </span>
      </Link>

      <div className="mt-4 flex min-w-0 flex-1 flex-col">
        <h3 className="font-display text-xl leading-[1.15] text-bark-900 sm:text-2xl">
          <Link
            href={href}
            className="decoration-marigold-600 decoration-2 underline-offset-4 hover:underline"
          >
            {name}
          </Link>
        </h3>

        {product.farmer ? (
          <p className="mt-2 min-w-0 truncate text-sm text-bark-600">
            <Link
              href={localePath(locale, `/farmers/${product.farmer.slug}`)}
              className="font-medium text-bark-900 decoration-marigold-600 decoration-2 underline-offset-2 hover:underline"
            >
              {product.farmer.farmName}
            </Link>
          </p>
        ) : null}

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
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

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-bark-200 pt-3">
          <p className="min-w-0">
            <span className="block whitespace-nowrap font-display text-2xl leading-none text-bark-900">
              {formatMoney(product.priceCents)}
            </span>
            <span className="rule-label mt-1.5 block text-bark-600">
              {unitLabel(locale, product.unit)}
            </span>
          </p>

          {saveState === "signedOut" ? (
            <Button
              as={Link}
              href={`${localePath(locale, "/account/sign-in")}?next=${encodeURIComponent(href)}`}
              size="sm"
              variant="secondary"
              className="shrink-0 px-3 text-xs"
            >
              {t.account.signInToSave}
            </Button>
          ) : saveState !== "hidden" ? (
            <div className="shrink-0">
              <SaveButton
                kind="product"
                id={product.id}
                initialSaved={saveState === "saved"}
                size="sm"
              />
            </div>
          ) : (
            <Button as={Link} href={href} size="sm" className="shrink-0 px-3 text-xs">
              {t.products.viewAndCall}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
