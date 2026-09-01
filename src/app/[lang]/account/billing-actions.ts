"use server";

import { randomUUID } from "node:crypto";

import type { SubscriptionPlan } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

import { loadConfig } from "@conf/config";
import { ensureCustomerSubscription } from "@/lib/customer-access";
import { getCustomer } from "@/lib/customer-auth";
import {
  DEFAULT_LOCALE,
  isEnabledLocale,
  localePath,
  type Locale,
} from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import {
  cancelRazorpaySubscription,
  createRazorpaySubscription,
  fetchRazorpaySubscription,
  findRazorpaySubscriptionByAttempt,
  RazorpayHttpError,
  razorpayApiReady,
  razorpayCheckoutReady,
} from "@/lib/razorpay";

const planSchema = z.enum(["STARTER_MONTHLY", "STARTER_ANNUAL"]);
const TERMINAL_PROVIDER_STATES = new Set(["cancelled", "completed", "expired"]);

function checkedLocale(value: Locale): Locale {
  return isEnabledLocale(value) ? value : DEFAULT_LOCALE;
}

function plansPath(locale: Locale, result?: string): string {
  const path = localePath(locale, "/account/plans");
  return result ? `${path}?billing=${result}` : path;
}

export async function startBillingAction(
  requestedLocale: Locale,
  requestedPlan: "STARTER_MONTHLY" | "STARTER_ANNUAL",
): Promise<void> {
  const locale = checkedLocale(requestedLocale);
  const parsedPlan = planSchema.safeParse(requestedPlan);
  if (!parsedPlan.success) redirect(plansPath(locale, "failed"));

  const customer = await getCustomer();
  if (!customer) redirect(localePath(locale, "/account/sign-in"));
  if (!razorpayCheckoutReady()) redirect(plansPath(locale, "unavailable"));

  const subscription = await ensureCustomerSubscription(customer.id);
  if (!subscription) redirect(plansPath(locale, "unavailable"));

  if (subscription.providerSubscriptionId) {
    const existing = await fetchRazorpaySubscription(
      subscription.providerSubscriptionId,
    ).catch(() => null);
    if (!existing) redirect(plansPath(locale, "failed"));

    if (existing.short_url && ["created", "authenticated"].includes(existing.status)) {
      redirect(existing.short_url);
    }

    if (!TERMINAL_PROVIDER_STATES.has(existing.status)) {
      redirect(plansPath(locale, "existing"));
    }

    // The old provider subscription is terminal. Keep its events as history,
    // but release the current row so a new authorization can be provisioned.
    const released = await prisma.$transaction(async (tx) => {
      const result = await tx.customerSubscription.updateMany({
        where: {
          id: subscription.id,
          providerSubscriptionId: subscription.providerSubscriptionId,
        },
        data: {
          providerSubscriptionId: null,
          providerCustomerId: null,
          providerPlanId: null,
          agreedAmountPaise: null,
          agreedCurrency: null,
          providerStatus: existing.status,
          providerLastEventAt: null,
          provisioningToken: null,
          provisioningStartedAt: null,
          provisioningError: null,
          cancelAtPeriodEnd: false,
          cancellationRequestedAt: null,
          cancelledAt: null,
          currentPeriodStartedAt: null,
          currentPeriodEndsAt: null,
          paidThroughAt: null,
          status: "TRIALING",
        },
      });
      if (result.count === 1) {
        await tx.subscriptionAttempt.updateMany({
          where: { providerSubscriptionId: subscription.providerSubscriptionId },
          data: {
            providerStatus: existing.status,
            state: "RETIRED",
            resolvedAt: new Date(),
          },
        });
      }
      return result;
    });
    if (released.count !== 1) redirect(plansPath(locale, "existing"));
  } else if (subscription.provisioningToken) {
    const attempt = await prisma.subscriptionAttempt.findUnique({
      where: { id: subscription.provisioningToken },
    });
    if (!attempt) redirect(plansPath(locale, "failed"));
    if (attempt.state === "FAILED" && !attempt.providerSubscriptionId) {
      await prisma.customerSubscription.updateMany({
        where: { id: subscription.id, provisioningToken: attempt.id },
        data: { provisioningToken: null, provisioningStartedAt: null },
      });
    } else {
      // Give Razorpay's list endpoint time to become consistent after a lost
      // response. Before then, another create would be the unsafe choice.
      if (Date.now() - attempt.startedAt.getTime() < 15 * 60_000) {
        redirect(plansPath(locale, "existing"));
      }
      const remote = await findRazorpaySubscriptionByAttempt(attempt.id).catch(
        () => undefined,
      );
      if (remote === undefined) redirect(plansPath(locale, "failed"));

      if (remote) {
        const attached = await prisma.$transaction(async (tx) => {
          const result = await tx.customerSubscription.updateMany({
            where: {
              id: subscription.id,
              provisioningToken: attempt.id,
              providerSubscriptionId: null,
            },
            data: {
              plan: attempt.plan,
              provider: "razorpay",
              providerPlanId: attempt.providerPlanId,
              agreedAmountPaise: attempt.agreedAmountPaise,
              agreedCurrency: attempt.agreedCurrency,
              providerSubscriptionId: remote.id,
              providerCustomerId: remote.customer_id ?? undefined,
              providerStatus: remote.status,
              provisioningToken: null,
              provisioningStartedAt: null,
              provisioningError: null,
            },
          });
          if (result.count === 1) {
            await tx.subscriptionAttempt.update({
              where: { id: attempt.id },
              data: {
                providerSubscriptionId: remote.id,
                providerStatus: remote.status,
                state: "OPEN",
                failureCode: null,
              },
            });
          }
          return result.count === 1;
        });
        if (!attached) redirect(plansPath(locale, "existing"));
        if (remote.short_url && ["created", "authenticated"].includes(remote.status)) {
          redirect(remote.short_url);
        }
        redirect(plansPath(locale, "existing"));
      }

      // A list result may lag a provider-side create. Keep the attempt attached
      // and block both another create and account deletion until a later retry
      // finds the subscription or operations explicitly resolves it.
      await prisma.subscriptionAttempt.update({
        where: { id: attempt.id },
        data: { state: "UNCERTAIN", failureCode: "NOT_FOUND_YET" },
      });
      redirect(plansPath(locale, "failed"));
    }
  }

  const plan = parsedPlan.data as SubscriptionPlan;
  const config = loadConfig();
  const planId =
    plan === "STARTER_MONTHLY"
      ? config.billing.razorpay_monthly_plan_id
      : config.billing.razorpay_annual_plan_id;
  const agreedAmountPaise =
    plan === "STARTER_MONTHLY"
      ? config.billing.monthly_paise
      : config.billing.annual_paise;
  const agreedCurrency = config.app.currency;
  const attemptId = randomUUID();
  const claimed = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${customer.id}))::text`;
    const active = await tx.customer.count({
      where: { id: customer.id, status: "ACTIVE", sessionVersion: customer.sessionVersion },
    });
    if (active !== 1) return false;

    const result = await tx.customerSubscription.updateMany({
      where: {
        id: subscription.id,
        providerSubscriptionId: null,
        provisioningToken: null,
      },
      data: {
        plan,
        providerPlanId: planId,
        agreedAmountPaise,
        agreedCurrency,
        provisioningToken: attemptId,
        provisioningStartedAt: new Date(),
        provisioningError: null,
      },
    });
    if (result.count !== 1) return false;
    await tx.subscriptionAttempt.create({
      data: {
        id: attemptId,
        subscriptionId: subscription.id,
        provider: "razorpay",
        plan,
        providerPlanId: planId,
        agreedAmountPaise,
        agreedCurrency,
        state: "PROVISIONING",
      },
    });
    return true;
  });
  if (!claimed) redirect(plansPath(locale, "existing"));

  const nowSeconds = Math.floor(Date.now() / 1000);
  const trialSeconds = Math.floor(subscription.trialEndsAt.getTime() / 1000);

  const mayCreate = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${customer.id}))::text`;
    const active = await tx.customer.count({
      where: { id: customer.id, status: "ACTIVE", sessionVersion: customer.sessionVersion },
    });
    if (active === 1) return true;
    await tx.customerSubscription.updateMany({
      where: { id: subscription.id, provisioningToken: attemptId },
      data: { provisioningToken: null, provisioningStartedAt: null },
    });
    return false;
  });
  if (!mayCreate) redirect(plansPath(locale, "failed"));

  const created = await createRazorpaySubscription({
    customerId: customer.id,
    planId,
    totalCount: plan === "STARTER_MONTHLY" ? 100 : 10,
    attemptId,
    ...(trialSeconds > nowSeconds + 300 ? { startAt: trialSeconds } : {}),
  }).catch(async (error: unknown) => {
    const definitive = error instanceof RazorpayHttpError && error.status < 500 && error.status !== 429;
    const failureCode = error instanceof Error ? error.name.slice(0, 80) : "UnknownError";
    await prisma.$transaction([
      prisma.customerSubscription.updateMany({
        where: { id: subscription.id, provisioningToken: attemptId },
        data: {
          ...(definitive
            ? { provisioningToken: null, provisioningStartedAt: null }
            : {}),
          provisioningError: failureCode,
        },
      }),
      prisma.subscriptionAttempt.updateMany({
        where: { id: attemptId },
        data: {
          state: definitive ? "FAILED" : "UNCERTAIN",
          failureCode,
          ...(definitive ? { resolvedAt: new Date() } : {}),
        },
      }),
    ]);
    return null;
  });

  if (!created?.short_url || !created.id.startsWith("sub_")) {
    redirect(plansPath(locale, "failed"));
  }

  const stored = await prisma.$transaction(async (tx) => {
    const result = await tx.customerSubscription.updateMany({
      where: {
        id: subscription.id,
        provisioningToken: attemptId,
        providerSubscriptionId: null,
      },
      data: {
        provider: "razorpay",
        providerPlanId: planId,
        providerSubscriptionId: created.id,
        providerCustomerId: created.customer_id ?? undefined,
        providerStatus: created.status,
        provisioningToken: null,
        provisioningStartedAt: null,
        provisioningError: null,
      },
    });
    if (result.count === 1) {
      await tx.subscriptionAttempt.update({
        where: { id: attemptId },
        data: {
          providerSubscriptionId: created.id,
          providerStatus: created.status,
          state: "OPEN",
          failureCode: null,
        },
      });
    }
    return result;
  });

  if (stored.count !== 1) {
    const reconciled = await prisma.customerSubscription.findUnique({
      where: { id: subscription.id },
      select: { providerSubscriptionId: true },
    });
    if (reconciled?.providerSubscriptionId === created.id) {
      redirect(created.short_url);
    }

    // A different concurrent attempt won the compare-and-set. Stop this losing
    // remote subscription immediately rather than leave a second mandate live.
    const loserCancellation = await cancelRazorpaySubscription(created.id, false).catch(
      () => null,
    );
    const loserTerminal = Boolean(
      loserCancellation && TERMINAL_PROVIDER_STATES.has(loserCancellation.status),
    );
    await prisma.subscriptionAttempt.updateMany({
      where: { id: attemptId },
      data: {
        providerSubscriptionId: created.id,
        providerStatus: loserCancellation?.status ?? created.status,
        state: loserTerminal ? "TERMINAL" : "CANCELLING",
        failureCode: loserTerminal ? null : "DUPLICATE_CANCEL_UNCONFIRMED",
        ...(loserTerminal ? { resolvedAt: new Date() } : {}),
      },
    });
    redirect(plansPath(locale, "failed"));
  }

  redirect(created.short_url);
}

export async function cancelBillingAction(requestedLocale: Locale): Promise<void> {
  const locale = checkedLocale(requestedLocale);
  const customer = await getCustomer();
  if (!customer) redirect(localePath(locale, "/account/sign-in"));
  if (!razorpayApiReady()) redirect(plansPath(locale, "unavailable"));

  const subscription = await prisma.customerSubscription.findUnique({
    where: { customerId: customer.id },
    select: { id: true, providerSubscriptionId: true },
  });
  if (!subscription?.providerSubscriptionId) redirect(plansPath(locale, "existing"));

  const existing = await fetchRazorpaySubscription(subscription.providerSubscriptionId).catch(
    () => null,
  );
  if (!existing) redirect(plansPath(locale, "failed"));

  const terminal = TERMINAL_PROVIDER_STATES.has(existing.status);
  const atCycleEnd = existing.status === "active";
  const result = terminal
    ? existing
    : await cancelRazorpaySubscription(
        subscription.providerSubscriptionId,
        atCycleEnd,
      ).catch(() => null);
  if (!result) redirect(plansPath(locale, "failed"));

  const cancelledNow = TERMINAL_PROVIDER_STATES.has(result.status);
  const saved = await prisma.customerSubscription.updateMany({
    where: {
      id: subscription.id,
      providerSubscriptionId: subscription.providerSubscriptionId,
    },
    data: {
      providerStatus: result.status,
      cancellationRequestedAt: new Date(),
      cancelAtPeriodEnd: !cancelledNow && atCycleEnd,
      ...(cancelledNow
        ? { status: "CANCELLED", cancelledAt: new Date() }
        : {}),
    },
  });
  if (saved.count !== 1) redirect(plansPath(locale, "failed"));
  await prisma.subscriptionAttempt.updateMany({
    where: { providerSubscriptionId: subscription.providerSubscriptionId },
    data: {
      providerStatus: result.status,
      state: cancelledNow ? "TERMINAL" : "CANCELLING",
      ...(cancelledNow ? { resolvedAt: new Date() } : {}),
    },
  });
  redirect(plansPath(locale, "cancelled"));
}
