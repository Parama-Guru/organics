-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "region" TEXT;

-- CreateIndex
CREATE INDEX "Product_region_idx" ON "Product"("region");
