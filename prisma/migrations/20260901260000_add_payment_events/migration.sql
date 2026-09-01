CREATE TYPE "PaymentEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "status" "PaymentEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "failureCode" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentEvent_provider_providerEventId_key" ON "PaymentEvent"("provider", "providerEventId");
CREATE INDEX "PaymentEvent_subscriptionId_receivedAt_idx" ON "PaymentEvent"("subscriptionId", "receivedAt");
CREATE INDEX "PaymentEvent_status_receivedAt_idx" ON "PaymentEvent"("status", "receivedAt");

ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "CustomerSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;