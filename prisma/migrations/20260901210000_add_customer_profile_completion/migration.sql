ALTER TABLE "Customer" ADD COLUMN "profileCompletedAt" TIMESTAMP(3);

-- Existing password accounts already completed these fields during sign-up.
UPDATE "Customer" SET "profileCompletedAt" = "createdAt";
