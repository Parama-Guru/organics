import assert from "node:assert/strict";
import test from "node:test";

import { byDistanceFrom, distanceKm, nearestRegion, roundedKm } from "../src/lib/geo";

const erode = { slug: "erode", latitude: 11.341, longitude: 77.7172 };
const coimbatore = { slug: "coimbatore", latitude: 11.0168, longitude: 76.9558 };
const chennai = { slug: "chennai", latitude: 13.0827, longitude: 80.2707 };
const himachal = { slug: "himachal", latitude: 31.1048, longitude: 77.1734 };
const unplaced = { slug: "unplaced", latitude: null, longitude: null };

test("distance matches known separations between district centres", () => {
  // Erode to Coimbatore is about 90km as the crow flies.
  const erodeToCoimbatore = distanceKm(erode, coimbatore);
  assert.ok(erodeToCoimbatore > 80 && erodeToCoimbatore < 100, `got ${erodeToCoimbatore}`);

  // Erode to Chennai is roughly 330km.
  const erodeToChennai = distanceKm(erode, chennai);
  assert.ok(erodeToChennai > 300 && erodeToChennai < 360, `got ${erodeToChennai}`);

  assert.equal(distanceKm(erode, erode), 0);
});

test("distance is symmetric", () => {
  assert.equal(
    distanceKm(erode, chennai).toFixed(6),
    distanceKm(chennai, erode).toFixed(6),
  );
});

test("the nearest district is chosen and unplaced ones are ignored", () => {
  // A point just outside Coimbatore.
  const point = { latitude: 11.02, longitude: 76.96 };
  assert.equal(nearestRegion(point, [erode, coimbatore, chennai, himachal])?.slug, "coimbatore");

  // A point in the far north picks the northern district, not a Tamil Nadu one.
  assert.equal(nearestRegion({ latitude: 31.0, longitude: 77.2 }, [erode, himachal])?.slug, "himachal");

  assert.equal(nearestRegion(point, [unplaced]), null);
  assert.equal(nearestRegion(point, []), null);
});

test("rows sort nearest first and unplaced rows keep their order at the end", () => {
  const rows = [
    { id: "far", region: chennai },
    { id: "unplaced-a", region: unplaced },
    { id: "near", region: coimbatore },
    { id: "unplaced-b", region: null },
    { id: "mid", region: erode },
  ];

  const sorted = byDistanceFrom({ latitude: 11.0168, longitude: 76.9558 }, rows, (r) => r.region);

  assert.deepEqual(
    sorted.map((s) => s.row.id),
    ["near", "mid", "far", "unplaced-a", "unplaced-b"],
  );
  assert.equal(sorted[0].km, 0);
  assert.equal(sorted[3].km, null);
  assert.equal(sorted[4].km, null);
});

test("distances are rounded so they do not claim more precision than they have", () => {
  assert.equal(roundedKm(0), 0);
  assert.equal(roundedKm(3), 5);
  assert.equal(roundedKm(41.8), 40);
  assert.equal(roundedKm(88), 90);
  assert.equal(roundedKm(334), 330);
});
