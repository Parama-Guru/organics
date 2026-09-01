ALTER TABLE "Customer"
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "CustomerSubscription"
ADD COLUMN "paidThroughAt" TIMESTAMP(3),
ADD COLUMN "cancellationRequestedAt" TIMESTAMP(3),
ADD COLUMN "providerPlanId" TEXT,
ADD COLUMN "agreedAmountPaise" INTEGER,
ADD COLUMN "agreedCurrency" TEXT,
ADD COLUMN "providerStatus" TEXT,
ADD COLUMN "providerLastEventAt" TIMESTAMP(3),
ADD COLUMN "provisioningToken" TEXT,
ADD COLUMN "provisioningStartedAt" TIMESTAMP(3),
ADD COLUMN "provisioningError" TEXT;

CREATE UNIQUE INDEX "CustomerSubscription_provisioningToken_key"
ON "CustomerSubscription"("provisioningToken");

ALTER TABLE "PaymentEvent"
ADD COLUMN "providerSubscriptionId" TEXT,
ADD COLUMN "providerCreatedAt" TIMESTAMP(3),
ADD COLUMN "providerPaymentId" TEXT,
ADD COLUMN "providerInvoiceId" TEXT,
ADD COLUMN "amountPaise" INTEGER,
ADD COLUMN "currency" TEXT;

CREATE INDEX "PaymentEvent_providerSubscriptionId_providerCreatedAt_idx"
ON "PaymentEvent"("providerSubscriptionId", "providerCreatedAt");