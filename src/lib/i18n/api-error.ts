"use client";

import { format } from "./config";
import type { Dictionary } from "./dictionaries/en";

type ApiError = { code?: string; error?: string; fields?: string[] } & Record<string, unknown>;

/**
 * Turns an API failure into a message in the active language. The server's English
 * `error` string is only a last resort, so a Tamil visitor never sees English copy
 * for a case we have translated.
 */
export function apiErrorMessage(t: Dictionary, payload: ApiError): string {
  const code = payload.code;
  if (code && code in t.errors) {
    return format(t.errors[code as keyof Dictionary["errors"]], {
      available: String(payload.available ?? ""),
    });
  }
  return t.errors.unknown;
}
