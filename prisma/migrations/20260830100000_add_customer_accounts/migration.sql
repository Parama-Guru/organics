-- Buyer accounts. The site takes no payment, so an account holds only a
-- shortlist: no address, no card, no order history.
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "region" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'ta',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

CREATE TABLE "SavedProduct" (
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProduct_pkey" PRIMARY KEY ("customerId","productId")
);

CREATE INDEX "SavedProduct_customerId_createdAt_idx" ON "SavedProduct"("customerId", "createdAt");

CREATE TABLE "SavedFarmer" (
    "customerId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedFarmer_pkey" PRIMARY KEY ("customerId","farmerId")
);

CREATE INDEX "SavedFarmer_customerId_createdAt_idx" ON "SavedFarmer"("customerId", "createdAt");

ALTER TABLE "SavedProduct" ADD CONSTRAINT "SavedProduct_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedProduct" ADD CONSTRAINT "SavedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedFarmer" ADD CONSTRAINT "SavedFarmer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedFarmer" ADD CONSTRAINT "SavedFarmer_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
