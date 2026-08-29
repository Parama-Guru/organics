-- Every listing must name the farm behind it; that is the whole premise of the site.
-- Defensive backfill first: attach any orphan to a verified farm in the same region.
-- The seed assigns these properly, so this only matters for a database that was
-- migrated without being reseeded. If anything is still orphaned the ALTER below
-- fails loudly, which is what we want.
UPDATE "Product" p
SET "farmerId" = f."id"
FROM "Farmer" f
WHERE p."farmerId" IS NULL
  AND f."status" = 'VERIFIED'
  AND f."region" = p."region";

ALTER TABLE "Product" ALTER COLUMN "farmerId" SET NOT NULL;
