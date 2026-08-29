"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";

export function SiteHeader() {
  const { locale, t } = useI18n();
  const pathname = usePathname();

  const navigation = [
    { path: "/", label: t.nav.home },
    { path: "/products", label: t.nav.shop },
    { path: "/farmers", label: t.nav.farmers },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/65 backdrop-blur-xl backdrop-saturate-150">
      {/* Tamil nav labels are much wider than the English ones, so below `sm` the nav
          wraps onto its own row instead of being squeezed or clipped. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 px-4 pb-1.5 pt-2 sm:h-16 sm:flex-nowrap sm:gap-x-4 sm:px-6 sm:pb-0 sm:pt-0">
        <Link
          href={localePath(locale, "/")}
          className="group flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-leaf-100 text-base shadow-soft transition-transform duration-300 group-hover:-rotate-6 sm:h-9 sm:w-9 sm:text-xl"
          >
            &#127807;
          </span>
          <span className="font-display text-base text-bark-900 sm:text-xl">Organics</span>
        </Link>

        <nav
          aria-label="Main"
          className="order-last flex w-full items-center gap-0.5 text-sm sm:order-none sm:w-auto sm:gap-1"
        >
          {navigation.map((item) => {
            const href = localePath(locale, item.path);
            const active = item.path === "/" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={item.path}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-lg px-2 py-1.5 font-medium transition-colors sm:px-3 sm:py-2 ${
                  active ? "text-bark-900" : "text-bark-600 hover:text-bark-900"
                }`}
              >
                {item.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-marigold-500 transition-transform duration-300 sm:inset-x-3 sm:-bottom-0.5 ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {/* useSearchParams needs a boundary because /sell renders statically. */}
          <Suspense fallback={<div className="h-7 w-24" />}>
            <LanguageToggle />
          </Suspense>

          {/* Button's own `inline-flex` beats a `hidden` utility on the same element,
              so the wrapper owns visibility. The footer repeats this link. */}
          <div className="hidden md:block">
            <Button as={Link} href={localePath(locale, "/sell")} size="sm">
              {t.nav.sell}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
