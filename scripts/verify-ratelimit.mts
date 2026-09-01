/**
 * Scratch check: the admin login limiter must not be resettable by a header.
 * Run against a dev server:  npx tsx scripts/verify-ratelimit.mts
 */
const url = "http://localhost:3000/api/tj/session";

async function attempt(forwardedFor?: string): Promise<number> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
    },
    body: JSON.stringify({ passphrase: "definitely-not-the-passphrase" }),
  });
  await response.text();
  return response.status;
}

const before: number[] = [];
for (let i = 0; i < 8; i++) before.push(await attempt());
console.log("no header, 8 tries :", before.join(" "));

const spoofed = [
  await attempt("203.0.113.9"),
  await attempt("198.51.100.4"),
  await attempt("192.0.2.77"),
  await attempt("203.0.113.9, 198.51.100.4"),
];
console.log("spoofed headers    :", spoofed.join(" "));

const stillLimited = spoofed.every((status) => status === 429);
console.log(
  stillLimited
    ? "PASS  a forged X-Forwarded-For does not reset the limit"
    : "FAIL  the limit was bypassed with a header",
);
process.exit(stillLimited ? 0 : 1);
