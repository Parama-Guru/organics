CREATE TYPE "PromotionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

CREATE TABLE "SponsoredPlacement" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT,
    "storeId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsoredPlacement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SponsoredPlacement_one_target_check" CHECK (
      (("farmerId" IS NOT NULL)::integer + ("storeId" IS NOT NULL)::integer) = 1
    ),
    CONSTRAINT "SponsoredPlacement_positive_window_check" CHECK ("endsAt" > "startsAt"),
    CONSTRAINT "SponsoredPlacement_priority_check" CHECK ("priority" BETWEEN 0 AND 100)
);

CREATE INDEX "SponsoredPlacement_status_startsAt_endsAt_idx" ON "SponsoredPlacement"("status", "startsAt", "endsAt");
CREATE INDEX "SponsoredPlacement_farmerId_idx" ON "SponsoredPlacement"("farmerId");
CREATE INDEX "SponsoredPlacement_storeId_idx" ON "SponsoredPlacement"("storeId");

ALTER TABLE "SponsoredPlacement" ADD CONSTRAINT "SponsoredPlacement_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SponsoredPlacement" ADD CONSTRAINT "SponsoredPlacement_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "OrganicStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;