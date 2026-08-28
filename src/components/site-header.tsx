"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/lib/cart-context";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { itemCount, hydrated } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-bark-200/70 bg-bark-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="text-xl sm:text-2xl">
            &#127807;
          </span>
          {/* The wordmark does not fit beside the nav and cart on the narrowest phones. */}
          <span className="hidden text-base text-leaf-800 xs:inline sm:text-lg">Organics</span>
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
                className={`rounded-md px-2.5 py-2 transition-colors sm:px-3 ${
                  active
                    ? "bg-leaf-100 text-leaf-800"
                    : "text-bark-600 hover:bg-bark-100 hover:text-bark-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/cart"
          className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-marigold-500 px-3.5 py-2 text-sm font-medium text-bark-900 transition-colors hover:bg-marigold-600 sm:px-4"
        >
          Cart
          <span
            aria-hidden
            className="inline-flex min-w-6 justify-center rounded-full bg-bark-900 px-1.5 py-0.5 text-xs tabular-nums text-marigold-50"
          >
            {hydrated ? itemCount : 0}
          </span>
          <span className="sr-only">
            {hydrated ? `${itemCount} items in cart` : "cart"}
          </span>
        </Link>
      </div>
    </header>
  );
}
