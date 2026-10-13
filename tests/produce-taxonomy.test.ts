import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { PRODUCE_ITEMS, PRODUCE_TYPES, findProduceItem, validProduceSelection } from "../src/lib/produce-taxonomy";
import { farmerApplicationSchema } from "../src/lib/farmer-application-schema";

test("farmer applications allow no certificate but reject partial, expired or mismatched selections", () => {
  const input = { farmName: "Test farm", contactName: "Test Farmer", email: "farmer@example.test", phone: "+919876543210", region: "Erode", about: "A farm growing traditional local produce.", govtIdLast4: "1234", produceType: "fresh-fruits", produceItemId: "fresh-fruits-1" };
  assert.equal(farmerApplicationSchema.safeParse(input).success, true);
  assert.equal(farmerApplicationSchema.safeParse({ ...input, certifier: "Test certifier" }).success, false);
  assert.equal(farmerApplicationSchema.safeParse({ ...input, produceItemId: "fresh-vegetables-1" }).success, false);
  assert.equal(farmerApplicationSchema.safeParse({ ...input, certifiedUntil: "2000-01-01", certifier: "Test certifier", certificateNo: "TEST-123" }).success, false);
  const future = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  assert.equal(farmerApplicationSchema.safeParse({ ...input, certifiedUntil: future, certifier: "Test certifier", certificateNo: "TEST-123" }).success, true);
});

test("the supplied Tamil lists have five types and preserve distinctive spellings", () => {
  assert.deepEqual(PRODUCE_TYPES.map((type) => type.items.length), [18, 25, 24, 31, 15]);
  for (const name of ["திணை", "அறைக்கீரை", "பொன்னாங்காணி", "ப்ரோக்கோலி", "ஆத்தூர்கிச்சிலிசம்பா", "மாதுளம் பழம்", "எலுமிச்சைபழம்"]) {
    assert.ok(PRODUCE_ITEMS.some((item) => item.nameTa === name));
  }
  assert.equal(new Set(PRODUCE_ITEMS.map((item) => item.id)).size, 113);
  assert.equal(PRODUCE_ITEMS.filter((item) => item.nameTa === "கரிசலாங்கண்ணி").length, 1);
  assert.equal(PRODUCE_ITEMS.filter((item) => item.nameTa === "அறுபதாங்குறுவை").length, 1);
});

test("items are accepted only under their owning type", () => {
  assert.equal(validProduceSelection("fresh-fruits", "fresh-fruits-1"), true);
  assert.equal(validProduceSelection("fresh-vegetables", "fresh-fruits-1"), false);
  assert.equal(validProduceSelection("fresh-fruits", "not-an-item"), false);
  assert.equal(findProduceItem("fresh-fruits-1")?.nameTa, "அரைநெல்லி");
});

test("migration reference data exactly matches the Tamil dropdown lists", () => {
  const sql = readFileSync("prisma/migrations/20261013000000_add_produce_taxonomy/migration.sql", "utf8");
  for (const type of PRODUCE_TYPES) assert.ok(sql.includes(JSON.stringify(type.items)), type.slug);
});