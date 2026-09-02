import assert from "node:assert/strict";
import test from "node:test";

import { sponsoredFirst } from "../src/lib/sponsorship-ranking";

const rows = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

test("sponsored rows lead by priority and organic order remains stable", () => {
  const ranked = sponsoredFirst(
    rows,
    new Map([
      ["c", { placementId: "pc", priority: 10 }],
      ["b", { placementId: "pb", priority: 20 }],
    ]),
  );

  assert.deepEqual(ranked.map((row) => row.id), ["b", "c", "a", "d"]);
  assert.equal(ranked[0]?.sponsorshipId, "pb");
  assert.equal(ranked[2]?.sponsored, false);
  assert.equal(ranked[2]?.sponsorshipId, null);
});

test("equal priority preserves source ordering", () => {
  const ranked = sponsoredFirst(
    rows,
    new Map([
      ["c", { placementId: "pc", priority: 5 }],
      ["a", { placementId: "pa", priority: 5 }],
    ]),
  );
  assert.deepEqual(ranked.map((row) => row.id), ["a", "c", "b", "d"]);
});
