ALTER TABLE "PrivateEnquiry" ADD COLUMN "handledAt" TIMESTAMP(3);
CREATE INDEX "PrivateEnquiry_handledAt_createdAt_idx" ON "PrivateEnquiry"("handledAt", "createdAt");