/**
 * Password strength, scored identically on the client and the server.
 *
 * Deliberately no dependency: a dictionary-backed estimator is ~800 KB of
 * JavaScript shipped to every visitor on a mid-range Android phone, to reach a
 * conclusion this rule set already reaches for the passwords people actually
 * type. The meter is advice; `MINIMUM_SCORE` is enforced server-side, which is
 * the part that matters.
 */

export const MINIMUM_SCORE = 2;

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export type StrengthAdvice =
  | "length"
  | "variety"
  | "common"
  | "personal"
  | "repeat"
  | "ok";

export type Strength = { score: StrengthScore; advice: StrengthAdvice };

// The shapes that show up at the top of every breach corpus, plus the words
// this particular site invites people to reuse.
const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyuiop",
  "qwerty123",
  "iloveyou",
  "letmein123",
  "welcome123",
  "admin123",
  "administrator",
  "abcd1234",
  "1qaz2wsx",
  "zaq12wsx",
  "asdfghjkl",
  "ossil",
  "ossil123",
  "organic",
  "organics",
  "farmer123",
  "tamilnadu",
  "india123",
]);

function classes(value: string): number {
  let count = 0;
  if (/[a-z]/.test(value)) count += 1;
  if (/[A-Z]/.test(value)) count += 1;
  if (/[0-9]/.test(value)) count += 1;
  if (/[^A-Za-z0-9]/.test(value)) count += 1;
  return count;
}

/** Four or more characters walking up or down the keyboard row or the alphabet. */
function hasRun(value: string): boolean {
  const lower = value.toLowerCase();
  let ascending = 1;
  let descending = 1;
  for (let index = 1; index < lower.length; index += 1) {
    const delta = lower.charCodeAt(index) - lower.charCodeAt(index - 1);
    ascending = delta === 1 ? ascending + 1 : 1;
    descending = delta === -1 ? descending + 1 : 1;
    if (ascending >= 4 || descending >= 4) return true;
  }
  return false;
}

function containsPersonal(value: string, personal: readonly string[]): boolean {
  const lower = value.toLowerCase();
  return personal.some((entry) => {
    const trimmed = entry.trim().toLowerCase();
    return trimmed.length >= 3 && lower.includes(trimmed);
  });
}

/**
 * `personal` is anything the account already knows about the person — email
 * local part, handle, display name. A password built from those is guessable by
 * anyone reading the same profile.
 */
export function scorePassword(
  password: string,
  personal: readonly string[] = [],
): Strength {
  const value = password.normalize("NFKC");
  const length = value.trim().length;

  if (length === 0) return { score: 0, advice: "length" };
  if (COMMON.has(value.toLowerCase())) return { score: 0, advice: "common" };
  if (containsPersonal(value, personal)) return { score: 1, advice: "personal" };
  if (length < 10) return { score: 0, advice: "length" };

  let score = 1;
  if (length >= 12) score += 1;
  if (length >= 16) score += 1;
  if (length >= 20) score += 1;

  const variety = classes(value);
  if (variety >= 3) score += 1;

  // Capped first, then penalised: applying the penalty to the raw score let a
  // varied-but-repetitive password absorb it against the ceiling and come out
  // scoring the same as one with no run in it at all.
  let bounded = Math.min(4, score) as StrengthScore;

  const repetitive = /(.)\1{2,}/.test(value) || hasRun(value);
  if (repetitive) bounded = Math.max(0, bounded - 1) as StrengthScore;

  if (repetitive && bounded < 4) return { score: bounded, advice: "repeat" };
  if (bounded < MINIMUM_SCORE) return { score: bounded, advice: "length" };
  if (variety < 2 && bounded < 4) return { score: bounded, advice: "variety" };
  return { score: bounded, advice: "ok" };
}
