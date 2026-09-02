import "server-only";

import { cookies } from "next/headers";

import { THEME_COOKIE, isTheme, type Theme } from "./theme";

/** The stored choice, or null when the visitor has never chosen one. */
export async function getStoredTheme(): Promise<Theme | null> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : null;
}
