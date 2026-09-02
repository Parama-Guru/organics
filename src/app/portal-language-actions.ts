"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { loadConfig } from "@conf/config";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isEnabledLocale,
  type Locale,
} from "@/lib/i18n/config";

const AUTH_RETURN_PATHS = new Set(["/pannai/sign-in", "/kadai/sign-in", "/tj/login"]);

/**
 * Change language without putting credentials or invite tokens in a GET URL.
 * The allowlist prevents the return path from becoming an open redirect.
 */
export async function setPortalLanguageAction(
  locale: Locale,
  returnTo: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  if (!isEnabledLocale(locale) || !AUTH_RETURN_PATHS.has(returnTo)) return;

  const origin = (await headers()).get("origin");
  const secure = origin
    ? origin.startsWith("https://")
    : new URL(loadConfig().app.site_url).protocol === "https:";

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure,
  });

  redirect(returnTo);
}
