"use client";

import { createContext, useContext } from "react";

import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

type I18nValue = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18nValue | null>(null);

/** Seeded by the root layout with the active dictionary only, so the other locale never ships. */
export function I18nProvider({
  locale,
  t,
  children,
}: I18nValue & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

/**
 * For the error boundary, which has to render even when the layout that seeds
 * the provider is the thing that failed. Throwing there would replace one blank
 * screen with another.
 */
export function useOptionalI18n(): I18nValue | null {
  return useContext(I18nContext);
}
