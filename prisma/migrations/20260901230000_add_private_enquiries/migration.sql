CREATE TYPE "EnquiryDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "PrivateEnquiry" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "farmerId" TEXT,
    "storeId" TEXT,
    "senderEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "shareEmail" BOOLEAN NOT NULL DEFAULT false,
    "deliveryStatus" "EnquiryDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastDeliveryError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateEnquiry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PrivateEnquiry_one_recipient_check" CHECK (
      (("farmerId" IS NOT NULL)::integer + ("storeId" IS NOT NULL)::integer) = 1
    )
);

CREATE INDEX "PrivateEnquiry_customerId_createdAt_idx" ON "PrivateEnquiry"("customerId", "createdAt");
CREATE INDEX "PrivateEnquiry_farmerId_createdAt_idx" ON "PrivateEnquiry"("farmerId", "createdAt");
CREATE INDEX "PrivateEnquiry_storeId_createdAt_idx" ON "PrivateEnquiry"("storeId", "createdAt");
CREATE INDEX "PrivateEnquiry_deliveryStatus_createdAt_idx" ON "PrivateEnquiry"("deliveryStatus", "createdAt");

ALTER TABLE "PrivateEnquiry" ADD CONSTRAINT "PrivateEnquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivateEnquiry" ADD CONSTRAINT "PrivateEnquiry_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivateEnquiry" ADD CONSTRAINT "PrivateEnquiry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "OrganicStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;