-- District centres, so farms and shops can be ordered by rough distance.
-- A visitor's own coordinates are never sent to the server or stored.
ALTER TABLE "Region" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Region" ADD COLUMN "longitude" DOUBLE PRECISION;

-- Seeded here as well as in prisma/seed.ts so an existing database gains the
-- coordinates without being reseeded.
UPDATE "Region" SET "latitude" = 11.4064, "longitude" = 76.7028 WHERE "slug" = 'nilgiris';
UPDATE "Region" SET "latitude" = 10.7870, "longitude" = 79.1378 WHERE "slug" = 'thanjavur';
UPDATE "Region" SET "latitude" = 11.3410, "longitude" = 77.7172 WHERE "slug" = 'erode';
UPDATE "Region" SET "latitude" = 12.4244, "longitude" = 75.7382 WHERE "slug" = 'coorg';
UPDATE "Region" SET "latitude" = 16.9902, "longitude" = 73.3120 WHERE "slug" = 'ratnagiri';
UPDATE "Region" SET "latitude" = 31.1048, "longitude" = 77.1734 WHERE "slug" = 'himachal';
UPDATE "Region" SET "latitude" = 11.0168, "longitude" = 76.9558 WHERE "slug" = 'coimbatore';
UPDATE "Region" SET "latitude" = 9.9252,  "longitude" = 78.1198 WHERE "slug" = 'madurai';
UPDATE "Region" SET "latitude" = 13.0827, "longitude" = 80.2707 WHERE "slug" = 'chennai';
