-- Marks seeded demonstration rows so they can be told apart from real
-- applications and removed in one step before launch.
ALTER TABLE "Farmer" ADD COLUMN "isSample" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "isSample" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrganicStore" ADD COLUMN "isSample" BOOLEAN NOT NULL DEFAULT false;

-- Everything present when this migration runs came from prisma/seed.ts: no real
-- farm or shop has applied yet. Real applications arrive through the public form
-- and take the false default.
UPDATE "Farmer" SET "isSample" = true;
UPDATE "Product" SET "isSample" = true;
UPDATE "OrganicStore" SET "isSample" = true;
