"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
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
  const [lifted, setLifted] = useState(false);

  // The bar is a hairline over the canvas at rest and gains a surface once the
  // page moves under it, so the masthead never sits in a box of its own.
  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigation = [
    { path: "/", label: t.nav.home },
    { path: "/products", label: t.nav.shop },
    { path: "/farmers", label: t.nav.farmers },
    { path: "/stores", label: t.nav.stores },
  ];

  // Rendered twice: inline from `md`, on its own rail below it. Only one is ever
  // displayed, so only one reaches the accessibility tree.
  const navLinks = navigation.map((item) => {
    const href = localePath(locale, item.path);
    const active = item.path === "/" ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        key={item.path}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`relative flex min-h-11 shrink-0 items-center whitespace-nowrap px-1 text-sm font-medium transition-colors after:absolute after:inset-x-1 after:bottom-2 after:h-0.5 after:origin-left after:rounded-full after:transition-transform after:duration-300 after:ease-settle ${
          active
            ? "text-bark-900 after:scale-x-100 after:bg-marigold-600"
            : "text-bark-600 after:scale-x-0 after:bg-inverse hover:text-bark-900 hover:after:scale-x-100"
        }`}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40">
      <div
        className={`border-b transition-colors duration-300 ease-tint ${
          lifted
            ? "border-bark-200 bg-canvas/92 shadow-soft backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex min-h-16 max-w-[90rem] items-center gap-3 px-3 sm:gap-6 sm:px-6">
          <Link
            href={localePath(locale, "/")}
            aria-label="OSSIL"
            className="group flex min-h-11 shrink-0 items-center gap-2.5 rounded-2xl pr-1"
          >
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-inverse text-lg text-marigold-500 transition-transform duration-300 ease-settle group-hover:-rotate-12"
            >
              <LeafMark />
            </span>
            <span className="hidden leading-none xs:block">
              <span className="block font-display text-2xl font-normal tracking-[-0.03em] text-bark-900">
                OSSIL
              </span>
              <span className="rule-label mt-0.5 hidden text-bark-600 sm:block">
                {t.home.boardDistrict}
              </span>
            </span>
          </Link>

          <nav
            aria-label="Main"
            className="no-scrollbar hidden min-w-0 flex-1 items-center gap-5 overflow-x-auto md:flex"
          >
            {navLinks}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {/* useSearchParams needs a boundary because /sell renders statically. */}
            <Suspense fallback={<div className="h-11 w-20" />}>
              <LanguageToggle />
            </Suspense>

            <ThemeToggle
              label={t.nav.theme}
              toDark={t.nav.themeToDark}
              toLight={t.nav.themeToLight}
            />

            {accountsOn ? (
              <Link
                href={localePath(locale, signedIn ? "/account" : "/account/sign-in")}
                // The label is hidden below `sm`: with the language toggle and
                // the sell button beside it, the Tamil wording pushed the row
                // past the viewport. aria-label keeps the icon-only link named.
                aria-label={signedIn ? t.nav.account : t.nav.signIn}
                className="flex h-11 min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-bark-600 transition-colors duration-200 ease-tint hover:bg-bark-900/5 hover:text-bark-900"
              >
                <UserIcon />
                <span className="hidden lg:inline">
                  {signedIn ? t.nav.account : t.nav.signIn}
                </span>
              </Link>
            ) : null}

            {/* Farmers browse on phones, so the acquisition CTA has to survive
                there — but it stays secondary. When the loudest thing in the
                masthead says "sell with us", a buyer's first read of the page is
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
          className="no-scrollbar rail-fade mx-auto flex max-w-[90rem] items-center gap-5 overflow-x-auto border-t border-bark-200/70 px-3 md:hidden"
        >
          {navLinks}
        </nav>
      </div>
    </header>
  );
}
