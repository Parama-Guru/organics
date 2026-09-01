import "server-only";

import { loadConfig } from "@conf/config";

const API = "https://api.razorpay.com/v1";

export class RazorpayHttpError extends Error {
  constructor(readonly status: number) {
    super(`RAZORPAY_${status}`);
    this.name = "RazorpayHttpError";
  }
}

export type RazorpaySubscription = {
  id: string;
  status: string;
  short_url?: string | null;
  plan_id?: string | null;
  customer_id?: string | null;
  current_start?: number | null;
  current_end?: number | null;
  ended_at?: number | null;
  notes?: Record<string, unknown> | null;
};

export function razorpayApiReady(): boolean {
  const billing = loadConfig().billing;
  return Boolean(billing.razorpay_key_id && billing.razorpay_key_secret);
}

export function razorpayWebhookReady(): boolean {
  return Boolean(loadConfig().billing.razorpay_webhook_secret);
}

export function razorpayCheckoutReady(): boolean {
  const billing = loadConfig().billing;
  return Boolean(
    billing.enabled &&
      razorpayApiReady() &&
      razorpayWebhookReady() &&
      billing.razorpay_monthly_plan_id &&
      billing.razorpay_annual_plan_id,
  );
}

/** Kept as the entitlement-policy name used by existing callers. */
export const razorpayReady = razorpayCheckoutReady;

function credentials(): { keyId: string; keySecret: string } {
  const billing = loadConfig().billing;
  if (!razorpayApiReady()) throw new Error("RAZORPAY_NOT_CONFIGURED");
  return { keyId: billing.razorpay_key_id, keySecret: billing.razorpay_key_secret };
}

function requestHeaders(body = false): Record<string, string> {
  const { keyId, keySecret } = credentials();
  return {
    Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
  };
}

async function request(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<RazorpaySubscription> {
  const response = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: requestHeaders(Boolean(init.body)),
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new RazorpayHttpError(response.status);
  const result = (await response.json()) as Partial<RazorpaySubscription>;
  if (typeof result.id !== "string" || typeof result.status !== "string") {
    throw new Error("RAZORPAY_BAD_RESPONSE");
  }
  return result as RazorpaySubscription;
}

export async function findRazorpaySubscriptionByAttempt(
  attemptId: string,
): Promise<RazorpaySubscription | null> {
  if (!/^[0-9a-f-]{36}$/i.test(attemptId)) throw new Error("RAZORPAY_BAD_ATTEMPT");

  for (let skip = 0; skip < 1_000; skip += 100) {
    const response = await fetch(`${API}/subscriptions?count=100&skip=${skip}`, {
      headers: requestHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new RazorpayHttpError(response.status);
    const page = (await response.json()) as { items?: Partial<RazorpaySubscription>[] };
    const items = Array.isArray(page.items) ? page.items : [];
    const match = items.find(
      (item) => item.notes?.organics_attempt_id === attemptId,
    );
    if (match) {
      if (typeof match.id !== "string" || typeof match.status !== "string") {
        throw new Error("RAZORPAY_BAD_RESPONSE");
      }
      return match as RazorpaySubscription;
    }
    if (items.length < 100) return null;
  }

  throw new Error("RAZORPAY_RECONCILIATION_LIMIT");
}

export async function createRazorpaySubscription({
  customerId,
  planId,
  totalCount,
  startAt,
  attemptId,
}: {
  customerId: string;
  planId: string;
  totalCount: number;
  startAt?: number;
  attemptId: string;
}): Promise<RazorpaySubscription> {
  return request("/subscriptions", {
    method: "POST",
    body: {
      plan_id: planId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: true,
      ...(startAt ? { start_at: startAt } : {}),
      notes: { organics_customer_id: customerId, organics_attempt_id: attemptId },
    },
  });
}

export function fetchRazorpaySubscription(id: string): Promise<RazorpaySubscription> {
  if (!/^sub_[A-Za-z0-9]+$/.test(id)) throw new Error("RAZORPAY_BAD_ID");
  return request(`/subscriptions/${id}`);
}

export function cancelRazorpaySubscription(
  id: string,
  cancelAtCycleEnd: boolean,
): Promise<RazorpaySubscription> {
  if (!/^sub_[A-Za-z0-9]+$/.test(id)) throw new Error("RAZORPAY_BAD_ID");
  return request(`/subscriptions/${id}/cancel`, {
    method: "POST",
    body: { cancel_at_cycle_end: cancelAtCycleEnd },
  });
}

export function unixDate(value: unknown): Date | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? new Date(value * 1000)
    : null;
}
