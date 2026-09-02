import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;

// Async, unlike the admin hash: a buyer login is a public endpoint, and the
// synchronous variant parks the whole event loop for the duration of every
// attempt, which is a denial-of-service lever anyone can pull.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/.test(stored)) return false;
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// Burns roughly the same time as a real verification. Called when the email does
// not exist, so response time cannot be used to enumerate registered addresses.
const DUMMY_HASH = `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`;

export async function fakeVerify(password: string): Promise<void> {
  await verifyPassword(password, DUMMY_HASH);
}
