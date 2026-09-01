import "server-only";

import { prisma } from "./prisma";
import {
  cancelRazorpaySubscription,
  fetchRazorpaySubscription,
  razorpayApiReady,
} from "./razorpay";

const TERMINAL_PROVIDER_STATES = new Set(["cancelled", "completed", "expired"]);

export type CustomerDeleteResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "NOT_FOUND"
        | "BILLING_UNAVAILABLE"
        | "BILLING_FAILED"
        | "BILLING_RECONCILING";
    };

/**
 * Delete only after any remote recurring subscription is confirmed terminal.
 * The local provider identifier is deliberately retained when cancellation is
 * unavailable or uncertain, so support can still stop future charges.
 */
export async function deleteCustomerAccount(
  customerId: string,
  expectedSessionVersion?: number,
): Promise<CustomerDeleteResult> {
  const customer = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${customerId}))::text`;
    const row = await tx.customer.findUnique({
      where: { id: customerId },
      select: {
        status: true,
        sessionVersion: true,
        subscription: {
          select: {
            id: true,
            providerSubscriptionId: true,
            provisioningToken: true,
            attempts: {
              where: {
                providerSubscriptionId: { not: null },
                state: { notIn: ["TERMINAL", "RETIRED", "FAILED"] },
              },
              select: { id: true, providerSubscriptionId: true },
            },
          },
        },
      },
    });
    if (!row) return { kind: "NOT_FOUND" as const };
    if (expectedSessionVersion !== undefined &&
      (row.status !== "ACTIVE" || row.sessionVersion !== expectedSessionVersion)) {
      return { kind: "NOT_FOUND" as const };
    }

    if (row.subscription?.provisioningToken) {
      const attempt = await tx.subscriptionAttempt.findUnique({
        where: { id: row.subscription.provisioningToken },
        select: { state: true, providerSubscriptionId: true },
      });
      if (attempt?.state !== "FAILED" || attempt.providerSubscriptionId) {
        return { kind: "RECONCILING" as const };
      }
      await tx.customerSubscription.update({
        where: { id: row.subscription.id },
        data: { provisioningToken: null, provisioningStartedAt: null },
      });
      row.subscription.provisioningToken = null;
    }

    const changedStatus = row.status === "ACTIVE";
    if (changedStatus) {
      await tx.customer.updateMany({
        where: { id: customerId, status: "ACTIVE" },
        data: { status: "SUSPENDED" },
      });
    }
    return { kind: "READY" as const, row, changedStatus };
  });
  if (customer.kind === "NOT_FOUND") return { ok: false, reason: "NOT_FOUND" };
  if (customer.kind === "RECONCILING") {
    return { ok: false, reason: "BILLING_RECONCILING" };
  }

  const providerIds = new Set(
    [
      customer.row.subscription?.providerSubscriptionId,
      ...(customer.row.subscription?.attempts.map(
        (attempt) => attempt.providerSubscriptionId,
      ) ?? []),
    ].filter((value): value is string => Boolean(value)),
  );
  if (providerIds.size > 0 && !razorpayApiReady()) {
    if (customer.changedStatus) {
      await prisma.customer.updateMany({
        where: {
          id: customerId,
          status: "SUSPENDED",
          sessionVersion: customer.row.sessionVersion,
        },
        data: { status: "ACTIVE" },
      });
    }
    return { ok: false, reason: "BILLING_UNAVAILABLE" };
  }

  for (const providerId of providerIds) {
    const existing = await fetchRazorpaySubscription(providerId).catch(() => null);
    if (!existing) {
      if (customer.changedStatus) {
        await prisma.customer.updateMany({
          where: {
            id: customerId,
            status: "SUSPENDED",
            sessionVersion: customer.row.sessionVersion,
          },
          data: { status: "ACTIVE" },
        });
      }
      return { ok: false, reason: "BILLING_FAILED" };
    }

    let terminalStatus = existing.status;
    if (!TERMINAL_PROVIDER_STATES.has(existing.status)) {
      const cancelled = await cancelRazorpaySubscription(providerId, false).catch(() => null);
      if (!cancelled || !TERMINAL_PROVIDER_STATES.has(cancelled.status)) {
        if (customer.changedStatus) {
          await prisma.customer.updateMany({
            where: {
              id: customerId,
              status: "SUSPENDED",
              sessionVersion: customer.row.sessionVersion,
            },
            data: { status: "ACTIVE" },
          });
        }
        return { ok: false, reason: "BILLING_FAILED" };
      }
      terminalStatus = cancelled.status;
    }
    await prisma.subscriptionAttempt.updateMany({
      where: { providerSubscriptionId: providerId },
      data: {
        providerStatus: terminalStatus,
        state: "TERMINAL",
        resolvedAt: new Date(),
      },
    });
  }

  const deleted = await prisma.customer.deleteMany({ where: { id: customerId } });
  return deleted.count === 1 ? { ok: true } : { ok: false, reason: "NOT_FOUND" };
}
