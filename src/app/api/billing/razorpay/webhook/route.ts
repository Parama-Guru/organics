import { createHmac, timingSafeEqual } from "node:crypto";

import type { Prisma, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { loadConfig } from "@conf/config";
import { prisma } from "@/lib/prisma";
import { unixDate } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;
const TERMINAL_STATUSES = new Set<SubscriptionStatus>(["CANCELLED", "EXPIRED"]);

type SubscriptionEntity = {
  id?: unknown;
  customer_id?: unknown;
  plan_id?: unknown;
  status?: unknown;
  current_start?: unknown;
  current_end?: unknown;
  ended_at?: unknown;
  notes?: unknown;
};

type PaymentEntity = {
  id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  invoice_id?: unknown;
  subscription_id?: unknown;
};

type RazorpayWebhook = {
  event?: unknown;
  created_at?: unknown;
  payload?: {
    subscription?: { entity?: SubscriptionEntity };
    payment?: { entity?: PaymentEntity };
  };
};

async function readBoundedBody(request: NextRequest): Promise<Buffer | null> {
  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}

function signatureValid(body: Buffer, received: string, secret: string): boolean {
  if (!secret || !/^[0-9a-f]{64}$/i.test(received)) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(body).digest("hex"));
  const provided = Buffer.from(received.toLowerCase());
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function mappedStatus(event: string): SubscriptionStatus | null {
  if (event === "subscription.charged") return "ACTIVE";
  if (["subscription.pending", "subscription.halted", "subscription.paused"].includes(event)) {
    return "PAST_DUE";
  }
  if (event === "subscription.cancelled") return "CANCELLED";
  if (["subscription.completed", "subscription.expired"].includes(event)) return "EXPIRED";
  return null;
}

function statusRank(status: SubscriptionStatus | null): number {
  if (status === "CANCELLED" || status === "EXPIRED") return 3;
  if (status === "ACTIVE") return 2;
  if (status === "PAST_DUE") return 1;
  return 0;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function note(entity: SubscriptionEntity | undefined, key: string): string | null {
  if (!entity?.notes || typeof entity.notes !== "object" || Array.isArray(entity.notes)) return null;
  return text((entity.notes as Record<string, unknown>)[key]);
}

function chargeFailure(
  plan: SubscriptionPlan,
  expectedPlanId: string | null,
  expectedAmount: number | null,
  expectedCurrency: string | null,
  providerSubscriptionId: string,
  entity: SubscriptionEntity | undefined,
  payment: PaymentEntity | undefined,
): string | null {
  if (
    plan === "TRIAL" ||
    !expectedPlanId ||
    expectedAmount === null ||
    !expectedCurrency
  ) {
    return "NO_PAID_PLAN";
  }
  if (text(entity?.plan_id) !== expectedPlanId) return "PLAN_MISMATCH";
  if (text(payment?.subscription_id) !== providerSubscriptionId) {
    return "SUBSCRIPTION_MISMATCH";
  }
  if (payment?.status !== "captured") return "PAYMENT_NOT_CAPTURED";
  if (payment?.amount !== expectedAmount) return "AMOUNT_MISMATCH";
  if (text(payment?.currency)?.toUpperCase() !== expectedCurrency.toUpperCase()) {
    return "CURRENCY_MISMATCH";
  }
  const periodStart = unixDate(entity?.current_start);
  const periodEnd = unixDate(entity?.current_end);
  if (!periodStart || !periodEnd || periodEnd <= periodStart) return "INVALID_PERIOD";
  const periodDays = (periodEnd.getTime() - periodStart.getTime()) / 86_400_000;
  const cadenceValid =
    plan === "STARTER_MONTHLY"
      ? periodDays >= 25 && periodDays <= 35
      : periodDays >= 360 && periodDays <= 370;
  if (!cadenceValid) return "CADENCE_MISMATCH";
  return null;
}

function errorCode(error: unknown): string {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code.slice(0, 80)
    : error instanceof Error
      ? error.name.slice(0, 80)
      : "UnknownError";
}

export async function POST(request: NextRequest) {
  const billing = loadConfig().billing;
  const secrets = [
    billing.razorpay_webhook_secret,
    billing.razorpay_previous_webhook_secret,
  ].filter(Boolean);
  if (secrets.length === 0) return new NextResponse(null, { status: 404 });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "body too large" }, { status: 413 });
  }

  const raw = await readBoundedBody(request);
  if (!raw) return NextResponse.json({ error: "body too large" }, { status: 413 });

  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!secrets.some((secret) => signatureValid(raw, signature, secret))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  const providerEventId = request.headers.get("x-razorpay-event-id") ?? "";
  if (!/^[A-Za-z0-9_-]{8,200}$/.test(providerEventId)) {
    return NextResponse.json({ error: "missing event id" }, { status: 400 });
  }

  let body: RazorpayWebhook;
  try {
    body = JSON.parse(raw.toString("utf8")) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventType = text(body.event) ?? "";
  const providerCreatedAt = unixDate(body.created_at);
  const entity = body.payload?.subscription?.entity;
  const payment = body.payload?.payment?.entity;
  const providerSubscriptionId = text(entity?.id);
  if (!eventType || eventType.length > 160 || !providerCreatedAt || !providerSubscriptionId) {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  let event = await prisma.paymentEvent.findUnique({
    where: { provider_providerEventId: { provider: "razorpay", providerEventId } },
  });
  if (event?.status === "PROCESSED") return NextResponse.json({ received: true });

  if (!event) {
    try {
      event = await prisma.paymentEvent.create({
        data: {
          provider: "razorpay",
          providerEventId,
          eventType,
          providerSubscriptionId,
          providerCreatedAt,
          providerPaymentId: text(payment?.id),
          providerInvoiceId: text(payment?.invoice_id),
          amountPaise: typeof payment?.amount === "number" ? payment.amount : null,
          currency: text(payment?.currency),
        },
      });
    } catch {
      event = await prisma.paymentEvent.findUnique({
        where: { provider_providerEventId: { provider: "razorpay", providerEventId } },
      });
      if (event?.status === "PROCESSED") return NextResponse.json({ received: true });
      if (!event) return NextResponse.json({ error: "event conflict" }, { status: 500 });
    }
  } else if (
    event.eventType !== eventType ||
    event.providerSubscriptionId !== providerSubscriptionId
  ) {
    return NextResponse.json({ error: "event mismatch" }, { status: 409 });
  }

  try {
    const attemptId = note(entity, "organics_attempt_id");
    let attempt = await prisma.subscriptionAttempt.findUnique({
      where: { providerSubscriptionId },
    });
    if (!attempt && attemptId) {
      const attached = await prisma.subscriptionAttempt.updateMany({
        where: { id: attemptId, providerSubscriptionId: null },
        data: {
          providerSubscriptionId,
          providerStatus: text(entity?.status),
          state: "OPEN",
          failureCode: null,
        },
      });
      if (attached.count === 1) {
        attempt = await prisma.subscriptionAttempt.findUnique({ where: { id: attemptId } });
      }
    }

    if (
      attempt &&
      (!attempt.subscriptionId || ["RETIRED", "TERMINAL"].includes(attempt.state))
    ) {
      const nextStatus = mappedStatus(eventType);
      await prisma.$transaction([
        prisma.subscriptionAttempt.update({
          where: { id: attempt.id },
          data: {
            providerStatus: text(entity?.status),
            ...(nextStatus && TERMINAL_STATUSES.has(nextStatus)
              ? { state: "TERMINAL", resolvedAt: providerCreatedAt }
              : {}),
          },
        }),
        prisma.paymentEvent.update({
          where: { id: event.id },
          data: { status: "PROCESSED", processedAt: new Date(), failureCode: null },
        }),
      ]);
      return NextResponse.json({ received: true, retired: true });
    }

    let local = await prisma.customerSubscription.findUnique({
      where: { providerSubscriptionId },
      select: { id: true },
    });

    if (!local) {
      const customerId = note(entity, "organics_customer_id");
      if (attemptId && customerId) {
        const reconciled = await prisma.$transaction(async (tx) => {
          const result = await tx.customerSubscription.updateMany({
            where: {
              customerId,
              provisioningToken: attemptId,
              providerSubscriptionId: null,
            },
            data: {
              provider: "razorpay",
              providerPlanId: attempt?.providerPlanId,
              agreedAmountPaise: attempt?.agreedAmountPaise,
              agreedCurrency: attempt?.agreedCurrency,
              providerSubscriptionId,
              providerCustomerId: text(entity?.customer_id) ?? undefined,
              providerStatus: text(entity?.status),
              provisioningToken: null,
              provisioningStartedAt: null,
              provisioningError: null,
            },
          });
          if (result.count === 1) {
            await tx.subscriptionAttempt.updateMany({
              where: { id: attemptId },
              data: {
                providerSubscriptionId,
                providerStatus: text(entity?.status),
                state: "OPEN",
                failureCode: null,
              },
            });
          }
          return result;
        });
        if (reconciled.count === 1) {
          local = await prisma.customerSubscription.findUnique({
            where: { providerSubscriptionId },
            select: { id: true },
          });
        }
      }
    }

    if (!local) {
      const ownedByOSSIL = Boolean(attemptId || note(entity, "organics_customer_id"));
      await prisma.paymentEvent.update({
        where: { id: event.id },
        data: { status: "FAILED", failureCode: "UNMATCHED_SUBSCRIPTION" },
      });
      // A signed event for one of our attempts must keep retrying until an
      // operator/reconciliation worker can cancel or recover the mapping.
      return NextResponse.json(
        { error: "unmatched subscription" },
        { status: ownedByOSSIL ? 503 : 200 },
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${providerSubscriptionId}))::text`;

        const currentEvent = await tx.paymentEvent.findUniqueOrThrow({
          where: { id: event!.id },
        });
        if (currentEvent.status === "PROCESSED") {
          return { accepted: true, failure: null };
        }

        const subscription = await tx.customerSubscription.findUniqueOrThrow({
          where: { id: local!.id },
        });
        const failure =
          eventType === "subscription.charged"
            ? chargeFailure(
                subscription.plan,
                subscription.providerPlanId,
                subscription.agreedAmountPaise,
                subscription.agreedCurrency,
                providerSubscriptionId,
                entity,
                payment,
              )
            : null;
        if (failure) {
          await tx.paymentEvent.update({
            where: { id: currentEvent.id },
            data: {
              status: "FAILED",
              subscriptionId: subscription.id,
              processedAt: new Date(),
              failureCode: failure,
            },
          });
          return { accepted: false, failure };
        }

        const nextStatus = mappedStatus(eventType);
        const isNewer =
          !subscription.providerLastEventAt ||
          providerCreatedAt.getTime() > subscription.providerLastEventAt.getTime();
        const isSameTimeWithoutRegression =
          subscription.providerLastEventAt?.getTime() === providerCreatedAt.getTime() &&
          statusRank(nextStatus) >= statusRank(subscription.status);
        const shouldApplyProviderState = isNewer || isSameTimeWithoutRegression;
        const terminalWouldRegress =
          TERMINAL_STATUSES.has(subscription.status) &&
          nextStatus !== null &&
          !TERMINAL_STATUSES.has(nextStatus);
        const periodEnd = unixDate(entity?.current_end);
        const paidThroughAt =
          eventType === "subscription.charged" && periodEnd &&
          (!subscription.paidThroughAt || periodEnd > subscription.paidThroughAt)
            ? periodEnd
            : undefined;

        const data: Prisma.CustomerSubscriptionUpdateInput = {
          ...(paidThroughAt ? { paidThroughAt } : {}),
          ...(shouldApplyProviderState
            ? {
                ...(!terminalWouldRegress
                  ? { providerStatus: text(entity?.status) }
                  : {}),
                providerLastEventAt: providerCreatedAt,
                providerCustomerId: text(entity?.customer_id) ?? undefined,
                currentPeriodStartedAt: unixDate(entity?.current_start) ?? undefined,
                currentPeriodEndsAt: periodEnd ?? undefined,
                ...(!terminalWouldRegress && nextStatus ? { status: nextStatus } : {}),
                ...(nextStatus === "CANCELLED"
                  ? {
                      cancelAtPeriodEnd: false,
                      cancelledAt: unixDate(entity?.ended_at) ?? providerCreatedAt,
                    }
                  : {}),
              }
            : {}),
        };

        await tx.customerSubscription.update({
          where: { id: subscription.id },
          data,
        });
        await tx.subscriptionAttempt.updateMany({
          where: { providerSubscriptionId },
          data: {
            providerStatus: text(entity?.status),
            state:
              nextStatus && TERMINAL_STATUSES.has(nextStatus)
                ? "TERMINAL"
                : nextStatus === "PAST_DUE"
                  ? "PAST_DUE"
                  : "OPEN",
            ...(nextStatus && TERMINAL_STATUSES.has(nextStatus)
              ? { resolvedAt: providerCreatedAt }
              : {}),
          },
        });
        await tx.paymentEvent.update({
          where: { id: currentEvent.id },
          data: {
            status: "PROCESSED",
            subscriptionId: subscription.id,
            processedAt: new Date(),
            failureCode: null,
          },
        });
        return { accepted: true, failure: null };
      },
      { timeout: 20_000 },
    );

    return result.accepted
      ? NextResponse.json({ received: true })
      : NextResponse.json({ error: result.failure }, { status: 503 });
  } catch (error) {
    await prisma.paymentEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", failureCode: errorCode(error) },
    }).catch(() => undefined);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
