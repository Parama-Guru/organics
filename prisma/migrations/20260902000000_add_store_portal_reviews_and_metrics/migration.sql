ALTER TABLE "Farmer"
ADD COLUMN "flaggedAt" TIMESTAMP(3),
ADD COLUMN "flagReason" TEXT;

ALTER TABLE "OrganicStore"
ADD COLUMN "flaggedAt" TIMESTAMP(3),
ADD COLUMN "flagReason" TEXT,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "portalSessionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "portalEnabledAt" TIMESTAMP(3),
ADD COLUMN "lastSignInAt" TIMESTAMP(3);

ALTER TABLE "PrivateEnquiry"
ADD COLUMN "sellerReadAt" TIMESTAMP(3);

CREATE TYPE "SellerReviewAction" AS ENUM (
  'STATUS_CHANGED',
  'FLAGGED',
  'FLAG_CLEARED',
  'EVIDENCE_UPDATED'
);

CREATE TABLE "SellerReviewEvent" (
  "id" TEXT NOT NULL,
  "farmerId" TEXT,
  "storeId" TEXT,
  "action" "SellerReviewAction" NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SellerReviewEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerReviewEvent_one_target_check" CHECK (
    (("farmerId" IS NOT NULL)::integer + ("storeId" IS NOT NULL)::integer) = 1
  )
);

CREATE INDEX "SellerReviewEvent_farmerId_createdAt_idx"
ON "SellerReviewEvent"("farmerId", "createdAt");
CREATE INDEX "SellerReviewEvent_storeId_createdAt_idx"
ON "SellerReviewEvent"("storeId", "createdAt");

ALTER TABLE "SellerReviewEvent"
ADD CONSTRAINT "SellerReviewEvent_farmerId_fkey"
FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SellerReviewEvent"
ADD CONSTRAINT "SellerReviewEvent_storeId_fkey"
FOREIGN KEY ("storeId") REFERENCES "OrganicStore"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SponsoredMetric" (
  "placementId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "SponsoredMetric_pkey" PRIMARY KEY ("placementId", "date"),
  CONSTRAINT "SponsoredMetric_nonnegative_check" CHECK (
    "impressions" >= 0 AND "clicks" >= 0
  )
);

CREATE INDEX "SponsoredMetric_date_idx" ON "SponsoredMetric"("date");

ALTER TABLE "SponsoredMetric"
ADD CONSTRAINT "SponsoredMetric_placementId_fkey"
FOREIGN KEY ("placementId") REFERENCES "SponsoredPlacement"("id")
ON DELETE CASCADE ON UPDATE CASCADE;