import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, isLocale } from "@/lib/i18n/config";

// Every page lives under /[lang]. A request without a locale is redirected to the
// visitor's remembered choice, falling back to Tamil. Accept-Language is deliberately
// ignored: Tamil is the product default, not a negotiated guess.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const alreadyLocalised = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (alreadyLocalised) return NextResponse.next();

  const remembered = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(remembered) ? remembered : DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, the staff-only /admin tree (it has no locale), Next
  // internals, and anything with a file extension (public assets).
  matcher: ["/((?!api|admin|_next|.*\\.).*)"],
};
