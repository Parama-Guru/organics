import assert from "node:assert/strict";
import test from "node:test";

import { MINIMUM_SCORE, scorePassword } from "../src/lib/password-strength";
import { isReservedUsername, normalizeUsername, usernameSchema } from "../src/lib/username";

test("length carries more weight than symbols", () => {
  assert.ok(scorePassword("kadalai-vayal-2026-thanjavur").score >= 3);
  assert.ok(scorePassword("Aa1!Aa1!x").score < MINIMUM_SCORE);
});

test("commonly guessed passwords score zero whatever their shape", () => {
  assert.equal(scorePassword("password123").score, 0);
  assert.equal(scorePassword("Password123".toLowerCase()).advice, "common");
});

test("a password built from the account's own details is rejected", () => {
  const result = scorePassword("meena-organics-2026", ["meena"]);
  assert.equal(result.advice, "personal");
  assert.ok(result.score < MINIMUM_SCORE);
});

test("runs and repeats cost a point", () => {
  const plain = scorePassword("thanjavur-delta-rice");
  const withRun = scorePassword("thanjavur-delta-1234");
  assert.ok(withRun.score < plain.score);
});

test("handles are normalized and bounded", () => {
  assert.equal(normalizeUsername("  Meena_01 "), "meena_01");
  assert.equal(usernameSchema.safeParse("Meena_01").success, true);
  assert.equal(usernameSchema.safeParse("me").success, false);
  assert.equal(usernameSchema.safeParse("meena kumari").success, false);
  assert.equal(usernameSchema.safeParse("meena-kumari").success, false);
  assert.equal(usernameSchema.safeParse("m".repeat(21)).success, false);
});

test("handles that would impersonate the site are refused", () => {
  assert.equal(isReservedUsername("OSSIL"), true);
  assert.equal(usernameSchema.safeParse("admin").success, false);
  assert.equal(usernameSchema.safeParse("support").success, false);
  assert.equal(usernameSchema.safeParse("meena").success, true);
});
