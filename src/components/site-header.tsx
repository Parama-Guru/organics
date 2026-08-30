"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { LeafMark } from "@/components/ui/icons";
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

  // Rendered twice: inline on desktop, on its own row below `sm`. Only one is
  // ever displayed, so only one reaches the accessibility tree.
  const navLinks = navigation.map((item) => {
    const href = localePath(locale, item.path);
    const active = item.path === "/" ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        key={item.path}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`relative flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-2 font-medium transition-colors sm:px-3 ${
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
  });

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/65 backdrop-blur-xl backdrop-saturate-150">
      {/* Below `sm` the nav gets its own row. Sharing one row with the brand, the
          language toggle and the sell button left it 12px wide, so on Tamil the
          Shop and Farmers links were completely unreachable. */}
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link
          href={localePath(locale, "/")}
          className="group flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-100 text-xl text-leaf-700 shadow-soft transition-transform duration-300 group-hover:-rotate-6"
          >
            <LeafMark />
          </span>
          <span className="font-display text-lg text-bark-900 sm:text-xl">Organics</span>
        </Link>

        <nav
          aria-label="Main"
          className="no-scrollbar hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-sm sm:flex sm:gap-1"
        >
          {navLinks}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {/* useSearchParams needs a boundary because /sell renders statically. */}
          <Suspense fallback={<div className="h-11 w-24" />}>
            <LanguageToggle />
          </Suspense>

          {/* Farmers browse on phones, so the acquisition CTA has to survive
              there — but it is a secondary button. When the loudest thing in the
              header says "sell with us", a buyer's first read of the page is
              that the site wants something from them. */}
          <div className="hidden shrink-0 sm:block">
            <Button as={Link} href={localePath(locale, "/sell")} size="sm" variant="secondary">
              {t.nav.sell}
            </Button>
          </div>
        </div>
      </div>

      <nav
        aria-label="Main"
        className="no-scrollbar mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto border-t border-white/60 px-4 text-sm sm:hidden"
      >
        {navLinks}
      </nav>
    </header>
  );
}
