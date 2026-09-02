import assert from "node:assert/strict";
import test from "node:test";

import { signUpSchema } from "../src/lib/account-schema";
import { allowedSort } from "../src/lib/product-query-schema";
import { storeApplicationSchema } from "../src/lib/store-application-schema";
import { storeProfileSchema } from "../src/lib/store-profile-schema";
import { storeEvidenceAllowsPublication } from "../src/lib/stores";

const futureDate = `${new Date().getUTCFullYear() + 2}-12-31`;
const store = {
  storeName: "Example Organic Store",
  contactName: "Store Owner",
  email: "owner@example.test",
  phone: "+91 98765 43210",
  region: "Erode",
  addressLine: "12 Example Street, Erode",
  about: "A neighbourhood store sourcing produce from certified organic farms.",
  govtIdLast4: "1234",
  fssaiNumber: "12345678901234",
  certifier: "",
  certificateNo: "",
  certifiedUntil: "",
  certificateUrl: "",
};

test("store applications accept a valid FSSAI-only reseller", () => {
  assert.equal(storeApplicationSchema.safeParse(store).success, true);
});

test("store applications require a complete optional certificate set", () => {
  assert.equal(
    storeApplicationSchema.safeParse({ ...store, certifier: "NPOP / Indocert" }).success,
    false,
  );
  assert.equal(
    storeApplicationSchema.safeParse({
      ...store,
      certifier: "NPOP / Indocert",
      certificateNo: "CERT-123",
      certifiedUntil: futureDate,
    }).success,
    true,
  );
});

test("store applications normalize FSSAI spaces", () => {
  const result = storeApplicationSchema.safeParse({
    ...store,
    fssaiNumber: "12345 67890 1234",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.fssaiNumber, "12345678901234");
});

test("store portal profile permits only bounded public fields", () => {
  assert.equal(
    storeProfileSchema.safeParse({
      phone: store.phone,
      addressLine: store.addressLine,
      about: store.about,
      aboutTa: "சான்று பெற்ற பண்ணைகளிடம் வாங்கும் கடை.",
    }).success,
    true,
  );
  assert.equal(
    storeProfileSchema.safeParse({ phone: "1", addressLine: "x", about: "short" }).success,
    false,
  );
});

test("store publication accepts FSSAI-only resellers but rejects stale certificate claims", () => {
  const now = new Date("2026-09-02T00:00:00.000Z");
  assert.equal(
    storeEvidenceAllowsPublication(
      {
        fssaiNumber: "12345678901234",
        certifier: null,
        certificateNo: null,
        certifiedUntil: null,
      },
      now,
    ),
    true,
  );
  assert.equal(
    storeEvidenceAllowsPublication(
      {
        fssaiNumber: "12345678901234",
        certifier: "NPOP / Indocert",
        certificateNo: "CERT-123",
        certifiedUntil: new Date("2026-09-01T00:00:00.000Z"),
      },
      now,
    ),
    false,
  );
  assert.equal(
    storeEvidenceAllowsPublication(
      {
        fssaiNumber: "invalid",
        certifier: null,
        certificateNo: null,
        certifiedUntil: null,
      },
      now,
    ),
    false,
  );
});

test("account passwords cannot contain the email name", () => {
  const base = {
    name: "Buyer Name",
    username: "buyer_name",
    email: "buyer@example.test",
    phone: "",
    region: "",
  };
  assert.equal(signUpSchema.safeParse({ ...base, password: "buyer-very-long-secret" }).success, false);
  assert.equal(signUpSchema.safeParse({ ...base, password: "different-long-secret" }).success, true);
});

test("sign-up refuses a weak password and a reserved handle", () => {
  const base = {
    name: "Buyer Name",
    username: "meena_01",
    email: "meena@example.test",
    phone: "",
    region: "",
  };
  assert.equal(signUpSchema.safeParse({ ...base, password: "password123" }).success, false);
  assert.equal(
    signUpSchema.safeParse({ ...base, username: "admin", password: "different-long-secret" }).success,
    false,
  );
  assert.equal(
    signUpSchema.safeParse({ ...base, username: "MEENA_01", password: "different-long-secret" })
      .success,
    true,
  );
});

test("a viewer who cannot see prices cannot sort by them either", () => {
  for (const sort of ["price-asc", "price-desc"] as const) {
    assert.equal(allowedSort(sort, true), sort);
    assert.equal(allowedSort(sort, false), "name");
  }
  assert.equal(allowedSort("name", false), "name");
});
