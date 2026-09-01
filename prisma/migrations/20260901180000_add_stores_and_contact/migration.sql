-- Organic stores: shops that resell certified produce. Reviewed on the same
-- footing as a farm, but they stock rather than grow, so they carry a street
-- address and an FSSAI licence and own no listings.
CREATE TYPE "StoreStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

CREATE TABLE "OrganicStore" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "about" TEXT,
    "aboutTa" TEXT,
    "photoUrl" TEXT,
    "status" "StoreStatus" NOT NULL DEFAULT 'PENDING',
    "govtIdLast4" TEXT,
    "fssaiNumber" TEXT,
    "certifier" TEXT,
    "certificateNo" TEXT,
    "certificateUrl" TEXT,
    "certifiedUntil" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganicStore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganicStore_slug_key" ON "OrganicStore"("slug");
CREATE UNIQUE INDEX "OrganicStore_email_key" ON "OrganicStore"("email");
CREATE INDEX "OrganicStore_status_idx" ON "OrganicStore"("status");
CREATE INDEX "OrganicStore_regionId_idx" ON "OrganicStore"("regionId");
-- Same trigram index the farm directory uses: admin search is ILIKE '%term%',
-- which no b-tree can serve.
CREATE INDEX "OrganicStore_storeName_trgm_idx" ON "OrganicStore" USING GIN ("storeName" gin_trgm_ops);

ALTER TABLE "OrganicStore" ADD CONSTRAINT "OrganicStore_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Contact messages are stored, not emailed: mail is optional configuration and
-- a form that silently drops what people write is worse than no form at all.
CREATE TYPE "ContactRole" AS ENUM ('CUSTOMER', 'FARMER', 'STORE', 'OTHER');

CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "role" "ContactRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactMessage_handledAt_createdAt_idx" ON "ContactMessage"("handledAt", "createdAt");
CREATE INDEX "ContactMessage_role_idx" ON "ContactMessage"("role");
