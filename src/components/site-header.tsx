"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/farmers", label: "Farmers" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/65 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-5 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-leaf-100 text-base shadow-soft transition-transform duration-300 group-hover:-rotate-6 sm:h-9 sm:w-9 sm:text-xl"
          >
            &#127807;
          </span>
          {/* The wordmark does not fit beside the nav and the CTA on the narrowest phones. */}
          <span className="hidden font-display text-base text-bark-900 xs:inline sm:text-xl">
            Organics
          </span>
          <span className="sr-only xs:hidden">Organics</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          {navigation.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-lg px-2.5 py-2 font-medium transition-colors sm:px-3 ${
                  active ? "text-bark-900" : "text-bark-600 hover:text-bark-900"
                }`}
              >
                {item.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-marigold-500 transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <Button as={Link} href="/sell" size="sm" className="ml-auto shrink-0">
          Sell with us
        </Button>
      </div>
    </header>
  );
}
