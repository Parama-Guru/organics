import assert from "node:assert/strict";
import test from "node:test";

import {
  endOfIndiaDate,
  indiaDateInputValue,
  startOfIndiaDate,
} from "../src/lib/india-date";

test("India date parsing preserves the requested calendar day", () => {
  const start = startOfIndiaDate("2026-09-02");
  const end = endOfIndiaDate("2026-09-02");

  assert.equal(start?.toISOString(), "2026-09-01T18:30:00.000Z");
  assert.equal(end?.toISOString(), "2026-09-02T18:29:59.999Z");
  assert.equal(indiaDateInputValue(start!), "2026-09-02");
  assert.equal(indiaDateInputValue(end!), "2026-09-02");
});

test("India date parsing rejects malformed and impossible dates", () => {
  for (const value of ["", "02-09-2026", "2026-2-9", "2026-02-30", "2026-13-01"]) {
    assert.equal(startOfIndiaDate(value), null);
    assert.equal(endOfIndiaDate(value), null);
  }
});

test("India calendar value is independent of the server timezone", () => {
  assert.equal(indiaDateInputValue(new Date("2026-09-01T20:00:00.000Z")), "2026-09-02");
});
