/**
 * Rough distance between districts, used to order farms and shops for a visitor
 * who has shared their location.
 *
 * No coordinates from the visitor are ever sent to the server or stored. The
 * browser compares its own position against these public district centres,
 * picks the nearest, and only that district's slug travels — the same thing the
 * region filter already puts in the URL.
 *
 * Everything here is a pure function so it can run on both sides and be tested
 * without a browser.
 */

export type Coordinates = { latitude: number; longitude: number };

export type LocatedRegion = {
  slug: string;
  latitude: number | null;
  longitude: number | null;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function hasCoordinates(region: LocatedRegion): region is LocatedRegion & Coordinates {
  return typeof region.latitude === "number" && typeof region.longitude === "number";
}

/** Great-circle distance in kilometres. */
export function distanceKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** The closest district to a point, or null when none of them are placed yet. */
export function nearestRegion<T extends LocatedRegion>(point: Coordinates, regions: T[]): T | null {
  let best: T | null = null;
  let bestDistance = Infinity;

  for (const region of regions) {
    if (!hasCoordinates(region)) continue;
    const km = distanceKm(point, region);
    if (km < bestDistance) {
      bestDistance = km;
      best = region;
    }
  }

  return best;
}

/**
 * Orders rows by distance from an origin district. Rows whose district has no
 * coordinates keep their original order at the end rather than being dropped:
 * an unplaced district is a missing measurement, not a missing farm.
 */
export function byDistanceFrom<T>(
  origin: Coordinates,
  rows: T[],
  regionOf: (row: T) => LocatedRegion | null | undefined,
): { row: T; km: number | null }[] {
  return rows
    .map((row, index) => {
      const region = regionOf(row);
      const km = region && hasCoordinates(region) ? distanceKm(origin, region) : null;
      return { row, km, index };
    })
    .sort((a, b) => {
      if (a.km === null && b.km === null) return a.index - b.index;
      if (a.km === null) return 1;
      if (b.km === null) return -1;
      if (a.km === b.km) return a.index - b.index;
      return a.km - b.km;
    })
    .map(({ row, km }) => ({ row, km }));
}

/**
 * Distances are between district centres, so presenting "41.8 km" would claim a
 * precision we do not have. Under 10km reads as "nearby" instead of a number.
 */
export function roundedKm(km: number): number {
  return km < 100 ? Math.round(km / 5) * 5 : Math.round(km / 10) * 10;
}
