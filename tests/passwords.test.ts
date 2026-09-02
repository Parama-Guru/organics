import assert from "node:assert/strict";
import test from "node:test";

import { hashPassphrase, verifyPassphrase } from "../src/lib/admin-hash";
import { hashPassword, verifyPassword } from "../src/lib/password";

test("admin passphrases round-trip and use the production hash shape", () => {
  const hash = hashPassphrase("a long private admin phrase");
  assert.match(hash, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
  assert.equal(verifyPassphrase("a long private admin phrase", hash), true);
  assert.equal(verifyPassphrase("a different phrase", hash), false);
});

test("customer and seller passwords round-trip", async () => {
  const hash = await hashPassword("a long private seller password");
  assert.match(hash, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
  assert.equal(await verifyPassword("a long private seller password", hash), true);
  assert.equal(await verifyPassword("not the password", hash), false);
});

test("password verifiers reject corrupted hash records", async () => {
  for (const value of ["", "scrypt:00:00", "bcrypt:00:00", "scrypt:zz:zz"]) {
    assert.equal(verifyPassphrase("anything", value), false);
    assert.equal(await verifyPassword("anything", value), false);
  }
});

test("normalization is consistent between hashing and verification", async () => {
  const composed = "Cafe\u0301 secure phrase";
  const normalized = "Café secure phrase";
  const adminHash = hashPassphrase(composed);
  const accountHash = await hashPassword(composed);
  assert.equal(verifyPassphrase(normalized, adminHash), true);
  assert.equal(await verifyPassword(normalized, accountHash), true);
});
