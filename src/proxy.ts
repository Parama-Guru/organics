import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  isEnabledLocale,
} from "@/lib/i18n/config";

// Every page lives under /[lang]. A request without a locale is redirected to the
// visitor's remembered choice, falling back to Tamil. Accept-Language is deliberately
// ignored: Tamil is the product default, not a negotiated guess.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const current = LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (current) {
    // A locale that exists in the code but is not switched on: send the visitor
    // to the same page in the language the site does serve, rather than 404.
    if (!isEnabledLocale(current)) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.replace(`/${current}`, `/${DEFAULT_LOCALE}`);
      return NextResponse.redirect(url);
    }
    return withPrivateCache(NextResponse.next(), pathname);
  }

  const remembered = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isEnabledLocale(remembered) ? remembered : DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

/**
 * Account pages render one person's saved list. Next's default for a dynamic
 * page is `no-cache, must-revalidate`, which permits a shared cache to hold the
 * response; `private` is what forbids it. Set here rather than in
 * next.config.ts, where the framework's own value wins.
 */
function withPrivateCache(response: NextResponse, pathname: string): NextResponse {
  if (/^\/[a-z]{2}\/account(\/|$)/.test(pathname)) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }
  return response;
}

export const config = {
  // Skip API routes, staff and seller tools (none is localised), Next
  // internals, and anything with a file extension.
  matcher: ["/((?!api|tj|pannai|kadai|_next|.*\\.).*)"],
};
