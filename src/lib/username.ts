import { z } from "zod";

/** Lower case only, so "Ravi" and "ravi" can never be two different people. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

// Handles that would let an account impersonate the site or one of its private
// areas. Checked before the database, so they are never even reachable.
const RESERVED = new Set([
  "ossil",
  "admin",
  "administrator",
  "root",
  "support",
  "help",
  "security",
  "billing",
  "system",
  "staff",
  "moderator",
  "official",
  "tj",
  "pannai",
  "kadai",
  "api",
  "account",
  "accounts",
  "login",
  "signin",
  "signup",
  "null",
  "undefined",
]);

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isReservedUsername(value: string): boolean {
  return RESERVED.has(normalizeUsername(value));
}

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_PATTERN, "use 3 to 20 letters, numbers or underscores")
  .refine((value) => !isReservedUsername(value), "that handle is reserved");
