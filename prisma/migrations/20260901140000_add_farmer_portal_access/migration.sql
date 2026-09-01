-- Portal access is deliberately separate from verification: an admin can
-- approve a farm's listings without handing over a login, and can revoke the
-- login without unpublishing the farm.
ALTER TABLE "Farmer" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Farmer" ADD COLUMN "portalEnabledAt" TIMESTAMP(3);
ALTER TABLE "Farmer" ADD COLUMN "lastSignInAt" TIMESTAMP(3);
