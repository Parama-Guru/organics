-- Password authentication remains available, but a Google-only account has no
-- password to hash. Existing rows are unchanged.
ALTER TABLE "Customer" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "Customer" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');
CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'STARTER_MONTHLY', 'STARTER_ANNUAL');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

CREATE TABLE "CustomerIdentity" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "emailAtLink" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerSubscription" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "trialStartedAt" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "currentPeriodStartedAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "provider" TEXT,
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerIdentity_provider_providerAccountId_key" ON "CustomerIdentity"("provider", "providerAccountId");
CREATE INDEX "CustomerIdentity_customerId_idx" ON "CustomerIdentity"("customerId");

CREATE UNIQUE INDEX "CustomerSubscription_customerId_key" ON "CustomerSubscription"("customerId");
CREATE UNIQUE INDEX "CustomerSubscription_providerCustomerId_key" ON "CustomerSubscription"("providerCustomerId");
CREATE UNIQUE INDEX "CustomerSubscription_providerSubscriptionId_key" ON "CustomerSubscription"("providerSubscriptionId");
CREATE INDEX "CustomerSubscription_status_currentPeriodEndsAt_idx" ON "CustomerSubscription"("status", "currentPeriodEndsAt");

ALTER TABLE "CustomerIdentity" ADD CONSTRAINT "CustomerIdentity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerSubscription" ADD CONSTRAINT "CustomerSubscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
