import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Kept free of `server-only` and of next/* imports so the CLI that generates a
// hash can import the exact code the server verifies against.

const KEYLEN = 64;

/** Returns `scrypt:<salt-hex>:<key-hex>`. */
export function hashPassphrase(passphrase: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(passphrase.normalize("NFKC"), salt, KEYLEN);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

export function verifyPassphrase(passphrase: string, stored: string): boolean {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  const actual = scryptSync(
    passphrase.normalize("NFKC"),
    Buffer.from(saltHex, "hex"),
    expected.length,
  );
  return timingSafeEqual(expected, actual);
}
