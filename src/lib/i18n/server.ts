import { notFound } from "next/navigation";
import { lang } from "next/root-params";

import { isLocale, type Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { ta } from "./dictionaries/ta";

const dictionaries: Record<Locale, Dictionary> = { en, ta };

/**
 * Reads the `[lang]` root segment. Server Components only — root params are not
 * available in Client Components, Server Actions or Route Handlers.
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}
