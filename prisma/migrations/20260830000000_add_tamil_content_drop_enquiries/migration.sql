-- Tamil copy for catalogue content. Nullable on purpose: a read falls back to the
-- English column, so a newly added product is never blank in the Tamil UI.
ALTER TABLE "Category" ADD COLUMN "descriptionTa" TEXT,
ADD COLUMN "nameTa" TEXT;

ALTER TABLE "Farmer" ADD COLUMN "aboutTa" TEXT;

ALTER TABLE "Product" ADD COLUMN "descriptionTa" TEXT,
ADD COLUMN "nameTa" TEXT;

-- Buyers call the farm directly now, so nothing writes enquiries any more.
-- Verified empty before this ran.
ALTER TABLE "Enquiry" DROP CONSTRAINT "Enquiry_farmerId_fkey";
ALTER TABLE "Enquiry" DROP CONSTRAINT "Enquiry_productId_fkey";
DROP TABLE "Enquiry";
DROP TYPE "EnquiryStatus";
