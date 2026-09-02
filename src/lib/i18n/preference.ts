import "server-only";

import { cookies } from "next/headers";

import {
  LOCALE_COOKIE,
  resolveLocalePreference,
  type Locale,
} from "./config";

/**
 * Locale preference for routes outside /[lang]. An explicit value wins when a
 * future non-localized route needs one; otherwise use the same site-wide cookie
 * as the public language switcher and keep Tamil as the final fallback.
 */
export async function getPreferredLocale(explicit?: unknown): Promise<Locale> {
  const remembered = (await cookies()).get(LOCALE_COOKIE)?.value;
  return resolveLocalePreference(explicit, remembered);
}
