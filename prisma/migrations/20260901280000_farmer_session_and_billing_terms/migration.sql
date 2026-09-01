ALTER TABLE "Farmer"
ADD COLUMN IF NOT EXISTS "portalSessionVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "CustomerSubscription"
ADD COLUMN IF NOT EXISTS "agreedAmountPaise" INTEGER,
ADD COLUMN IF NOT EXISTS "agreedCurrency" TEXT;

CREATE TABLE "SubscriptionAttempt" (
	"id" TEXT NOT NULL,
	"subscriptionId" TEXT,
	"provider" TEXT NOT NULL,
	"plan" "SubscriptionPlan" NOT NULL,
	"providerPlanId" TEXT NOT NULL,
	"agreedAmountPaise" INTEGER NOT NULL,
	"agreedCurrency" TEXT NOT NULL,
	"providerSubscriptionId" TEXT,
	"providerStatus" TEXT,
	"state" TEXT NOT NULL,
	"failureCode" TEXT,
	"startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"resolvedAt" TIMESTAMP(3),
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "SubscriptionAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubscriptionAttempt_providerSubscriptionId_key"
ON "SubscriptionAttempt"("providerSubscriptionId");
CREATE INDEX "SubscriptionAttempt_subscriptionId_startedAt_idx"
ON "SubscriptionAttempt"("subscriptionId", "startedAt");
CREATE INDEX "SubscriptionAttempt_state_startedAt_idx"
ON "SubscriptionAttempt"("state", "startedAt");

ALTER TABLE "SubscriptionAttempt"
ADD CONSTRAINT "SubscriptionAttempt_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "CustomerSubscription"("id")
ON DELETE SET NULL ON UPDATE CASCADE;