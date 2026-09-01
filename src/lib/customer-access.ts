import "server-only";

import type { CustomerSubscription, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import { loadConfig } from "@conf/config";
import { prisma } from "./prisma";
import { razorpayReady } from "./razorpay";

export type CustomerAccessKind =
  | "FREE_ACCESS"
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED";

export type CustomerAccess = {
  kind: CustomerAccessKind;
  allowed: boolean;
  plan: SubscriptionPlan | null;
  trialEndsAt: Date | null;
  periodEndsAt: Date | null;
  daysRemaining: number | null;
  agreedAmountPaise: number | null;
  agreedCurrency: string | null;
};

function daysUntil(date: Date, now: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
}

/** Billing disabled means free access, not a payment page nobody can use. */
export function accessFromSubscription(
  subscription: CustomerSubscription | null,
  now = new Date(),
): CustomerAccess {
  if (!loadConfig().billing.enabled) {
    return {
      kind: "FREE_ACCESS",
      allowed: true,
      plan: subscription?.plan ?? null,
      trialEndsAt: subscription?.trialEndsAt ?? null,
      periodEndsAt: subscription?.paidThroughAt ?? null,
      daysRemaining: null,
      agreedAmountPaise: subscription?.agreedAmountPaise ?? null,
      agreedCurrency: subscription?.agreedCurrency ?? null,
    };
  }

  if (!razorpayReady()) {
    return {
      kind: "EXPIRED",
      allowed: false,
      plan: subscription?.plan ?? null,
      trialEndsAt: subscription?.trialEndsAt ?? null,
      periodEndsAt: subscription?.paidThroughAt ?? null,
      daysRemaining: 0,
      agreedAmountPaise: subscription?.agreedAmountPaise ?? null,
      agreedCurrency: subscription?.agreedCurrency ?? null,
    };
  }

  if (!subscription) {
    return {
      kind: "EXPIRED",
      allowed: false,
      plan: null,
      trialEndsAt: null,
      periodEndsAt: null,
      daysRemaining: 0,
      agreedAmountPaise: null,
      agreedCurrency: null,
    };
  }

  if (subscription.trialEndsAt > now) {
    return {
      kind: "TRIAL",
      allowed: true,
      plan: subscription.plan,
      trialEndsAt: subscription.trialEndsAt,
      periodEndsAt: null,
      daysRemaining: daysUntil(subscription.trialEndsAt, now),
      agreedAmountPaise: subscription.agreedAmountPaise,
      agreedCurrency: subscription.agreedCurrency,
    };
  }

  const paidUntil = subscription.paidThroughAt;
  if (paidUntil && paidUntil > now) {
    const kind: CustomerAccessKind =
      subscription.status === "CANCELLED"
        ? "CANCELLED"
        : subscription.status === "PAST_DUE"
          ? "PAST_DUE"
          : "ACTIVE";
    return {
      kind,
      allowed: true,
      plan: subscription.plan,
      trialEndsAt: subscription.trialEndsAt,
      periodEndsAt: paidUntil,
      daysRemaining: daysUntil(paidUntil, now),
      agreedAmountPaise: subscription.agreedAmountPaise,
      agreedCurrency: subscription.agreedCurrency,
    };
  }

  return {
    kind: "EXPIRED",
    allowed: false,
    plan: subscription.plan,
    trialEndsAt: subscription.trialEndsAt,
    periodEndsAt: paidUntil,
    daysRemaining: 0,
    agreedAmountPaise: subscription.agreedAmountPaise,
    agreedCurrency: subscription.agreedCurrency,
  };
}

/** Create one trial for this customer account only when billing is enabled. */
export async function ensureCustomerSubscription(customerId: string): Promise<CustomerSubscription | null> {
  const { billing } = loadConfig();
  if (!razorpayReady()) return null;

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + billing.trial_days * 86_400_000);

  return prisma.customerSubscription.upsert({
    where: { customerId },
    update: {},
    create: {
      customerId,
      plan: "TRIAL",
      status: "TRIALING",
      trialStartedAt: now,
      trialEndsAt,
    },
  });
}

export async function getCustomerAccess(customerId: string): Promise<CustomerAccess> {
  let subscription = await prisma.customerSubscription.findUnique({ where: { customerId } });
  if (!subscription && razorpayReady()) {
    subscription = await ensureCustomerSubscription(customerId);
  }
  return accessFromSubscription(subscription);
}

export function subscriptionLabel(
  plan: SubscriptionPlan | null,
  status: SubscriptionStatus | null,
): string {
  if (!plan || !status) return "free";
  return `${plan.toLowerCase()}:${status.toLowerCase()}`;
}
