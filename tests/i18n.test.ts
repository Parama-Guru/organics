import assert from "node:assert/strict";
import test from "node:test";

import { publicPageMetadata, resolveLocalePreference } from "../src/lib/i18n/config";
import { en } from "../src/lib/i18n/dictionaries/en";
import { ta } from "../src/lib/i18n/dictionaries/ta";

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

test("public canonical and language links keep their route instead of pointing home", () => {
  for (const locale of ["en", "ta"] as const) {
    const metadata = publicPageMetadata(locale, "/stores", "Stores", "Directory");
    assert.equal(metadata.alternates?.canonical, `/${locale}/stores`);
    assert.deepEqual(metadata.alternates?.languages, { "ta-IN": "/ta/stores", "en-IN": "/en/stores", "x-default": "/ta/stores" });
    assert.equal(metadata.openGraph?.url, `/${locale}/stores`);
  }
});

test("public copy has no seed instructions or delayed contact promises", () => {
  for (const dictionary of [en, ta]) {
    const publicCopy = JSON.stringify([dictionary.home, dictionary.contact, dictionary.farmers, dictionary.stores, dictionary.sell, dictionary.footer]);
    assert.doesNotMatch(publicCopy, /db:seed|phone numbers open shortly|Contact details coming soon|தொடர்பு விவரங்கள் விரைவில்/i);
    assert.ok(dictionary.home.emptyTitle.length > 0);
    assert.ok(dictionary.home.emptyBody.length > 0);
  }
});
