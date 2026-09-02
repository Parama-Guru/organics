import assert from "node:assert/strict";
import test from "node:test";

import { resolveLocalePreference } from "../src/lib/i18n/config";

test("an explicit enabled locale wins for non-localized sign-in routes", () => {
  assert.equal(resolveLocalePreference("en", "ta"), "en");
});

test("seller sign-in uses the remembered site language", () => {
  assert.equal(resolveLocalePreference(undefined, "en"), "en");
});

test("seller sign-in falls back to Tamil for missing or invalid preferences", () => {
  assert.equal(resolveLocalePreference(undefined, undefined), "ta");
  assert.equal(resolveLocalePreference("fr", "invalid"), "ta");
});
