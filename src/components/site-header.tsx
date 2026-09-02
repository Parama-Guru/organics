"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { LeafMark, UserIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";

export function SiteHeader({
  accountsOn = false,
  signedIn = false,
}: {
  accountsOn?: boolean;
  signedIn?: boolean;
}) {
  const { locale, t } = useI18n();
  const pathname = usePathname();

  const navigation = [
    { path: "/", label: t.nav.home },
    { path: "/products", label: t.nav.shop },
    { path: "/farmers", label: t.nav.farmers },
    { path: "/stores", label: t.nav.stores },
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
        className={`relative flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3 font-medium transition-colors sm:px-4 ${
          active
            ? "bg-bark-900 text-white shadow-soft"
            : "text-bark-600 hover:bg-bark-100 hover:text-bark-900"
        }`}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      {/* Below `sm` the nav gets its own row. Sharing one row with the brand, the
          language toggle and the sell button left it 12px wide, so on Tamil the
          Shop and Farmers links were completely unreachable. */}
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-2 rounded-[1.35rem] border border-white/80 bg-paper/88 px-3 shadow-glass backdrop-blur-xl backdrop-saturate-150 sm:gap-4 sm:px-4">
        <Link
          href={localePath(locale, "/")}
          aria-label="Organics"
          className="group flex min-h-11 shrink-0 items-center gap-2.5 rounded-2xl pr-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-full bg-bark-900 text-xl text-marigold-400 shadow-soft transition-transform duration-300 group-hover:-rotate-6"
          >
            <LeafMark />
          </span>
          <span className="hidden font-display text-xl font-medium text-bark-900 xs:inline sm:text-2xl">Organics</span>
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

          {accountsOn ? (
            <Link
              href={localePath(locale, signedIn ? "/account" : "/account/sign-in")}
              // The label is hidden below `sm`: with the language toggle and the
              // sell button beside it, the Tamil wording pushed the row 23px past
              // the viewport. aria-label keeps the icon-only link named.
              aria-label={signedIn ? t.nav.account : t.nav.signIn}
              className="flex h-11 min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-bark-600 transition-colors hover:bg-bark-100 hover:text-bark-900"
            >
              <UserIcon />
              <span className="hidden sm:inline">
                {signedIn ? t.nav.account : t.nav.signIn}
              </span>
            </Link>
          ) : null}

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
        className="no-scrollbar mx-auto mt-2 flex max-w-6xl items-center gap-1 overflow-x-auto rounded-2xl border border-white/80 bg-paper/90 px-2 text-sm shadow-soft backdrop-blur-xl sm:hidden"
      >
        {navLinks}
      </nav>
    </header>
  );
}
