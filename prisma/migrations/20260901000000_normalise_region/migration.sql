-- Region was a free-text column on Farmer and Product, with the Tamil spelling
-- hard-coded in a TypeScript map. A typo produced a silent second "region" in
-- the filters, and a district with no map entry fell back to English on a
-- Tamil-first site. This makes it a table.

CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");
CREATE INDEX "Region_slug_idx" ON "Region"("slug");

-- Seed from the districts already present, so no listing loses its region.
INSERT INTO "Region" ("id", "slug", "name", "updatedAt")
SELECT
    md5(random()::text || clock_timestamp()::text),
    lower(regexp_replace(trim(d.region), '[^a-zA-Z0-9]+', '-', 'g')),
    trim(d.region),
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "region" FROM "Farmer" WHERE "region" IS NOT NULL AND trim("region") <> ''
    UNION
    SELECT DISTINCT "region" FROM "Product" WHERE "region" IS NOT NULL AND trim("region") <> ''
) AS d(region);

ALTER TABLE "Farmer" ADD COLUMN "regionId" TEXT;
ALTER TABLE "Product" ADD COLUMN "regionId" TEXT;

UPDATE "Farmer" f SET "regionId" = r."id" FROM "Region" r WHERE trim(f."region") = r."name";
UPDATE "Product" p SET "regionId" = r."id" FROM "Region" r WHERE trim(p."region") = r."name";

-- Every farm must have a district; a listing may inherit one later.
DELETE FROM "Farmer" WHERE "regionId" IS NULL;
ALTER TABLE "Farmer" ALTER COLUMN "regionId" SET NOT NULL;

DROP INDEX IF EXISTS "Product_region_trgm_idx";
ALTER TABLE "Farmer" DROP COLUMN "region";
ALTER TABLE "Product" DROP COLUMN "region";

CREATE INDEX "Farmer_regionId_idx" ON "Farmer"("regionId");
CREATE INDEX "Product_regionId_idx" ON "Product"("regionId");

ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Customer gains the same relation, plus a status and a password-changed stamp.
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

ALTER TABLE "Customer" ADD COLUMN "regionId" TEXT;
UPDATE "Customer" c SET "regionId" = r."id" FROM "Region" r WHERE trim(c."region") = r."name";
ALTER TABLE "Customer" DROP COLUMN "region";

ALTER TABLE "Customer" ADD COLUMN "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Customer" ADD COLUMN "passwordSetAt" TIMESTAMP(3);

CREATE INDEX "Customer_regionId_idx" ON "Customer"("regionId");
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
