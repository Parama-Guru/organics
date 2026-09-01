import { notFound, redirect } from "next/navigation";

import { loadConfig } from "@conf/config";
import { cancelBillingAction, startBillingAction } from "@/app/[lang]/account/billing-actions";
import { AccessCard } from "@/components/access-card";
import { GlassPanel } from "@/components/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, LeafMark } from "@/components/ui/icons";
import { getCustomerAccess } from "@/lib/customer-access";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { format, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { razorpayApiReady, razorpayCheckoutReady } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.account.plansTitle, robots: { index: false, follow: false } };
}

function billingEventLabel(eventType: string, t: Awaited<ReturnType<typeof getDictionary>>): string {
  if (eventType === "subscription.charged") return t.account.billingEventPaid;
  if (eventType === "subscription.cancelled") return t.account.billingEventCancelled;
  if (["subscription.pending", "subscription.halted", "subscription.paused"].includes(eventType)) {
    return t.account.billingEventAttention;
  }
  if (eventType === "subscription.activated") return t.account.billingEventActivated;
  return t.account.billingEventUpdated;
}

export default async function PlansPage({ searchParams }: PageProps<"/[lang]/account/plans">) {
  if (!accountsEnabled()) notFound();

  const [locale, t, customer, params] = await Promise.all([
    getLocale(),
    getDictionary(),
    getCustomer(),
    searchParams,
  ]);
  if (!customer) {
    const next = encodeURIComponent(localePath(locale, "/account/plans"));
    redirect(`${localePath(locale, "/account/sign-in")}?next=${next}`);
  }

  const [access, subscription] = await Promise.all([
    getCustomerAccess(customer.id),
    prisma.customerSubscription.findUnique({
      where: { customerId: customer.id },
      include: { paymentEvents: { orderBy: { receivedAt: "desc" }, take: 20 } },
    }),
  ]);
  const billing = loadConfig().billing;
  const billingReady = razorpayCheckoutReady();
  const managementReady = razorpayApiReady();
  const monthlySaving = Math.max(0, billing.monthly_paise * 12 - billing.annual_paise);
  const plans = [
    {
      code: "STARTER_MONTHLY" as const,
      name: t.account.monthlyPlan,
      price: format(t.account.monthlyPrice, { price: formatMoney(billing.monthly_paise) }),
      note: t.account.billedMonthly,
      saving: null,
    },
    {
      code: "STARTER_ANNUAL" as const,
      name: t.account.annualPlan,
      price: format(t.account.annualPrice, { price: formatMoney(billing.annual_paise) }),
      note: t.account.billedAnnually,
      saving: format(t.account.annualSaving, { saving: formatMoney(monthlySaving) }),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl sm:text-5xl">{t.account.plansTitle}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-bark-600">
        {t.account.plansIntro}
      </p>

      <div className="mt-8">
        <AccessCard access={access} locale={locale} t={t} compact />
      </div>

      {params.billing === "cancelled" ? (
        <p role="status" className="mt-5 rounded-2xl bg-leaf-50 p-4 text-sm text-leaf-800 ring-1 ring-leaf-200">
          {t.account.cancellationScheduled}
        </p>
      ) : params.billing === "failed" ? (
        <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          {t.account.billingFailed}
        </p>
      ) : params.billing === "existing" ? (
        <p role="status" className="mt-5 rounded-2xl bg-marigold-50 p-4 text-sm text-bark-900 ring-1 ring-marigold-200">
          {t.account.billingExisting}
        </p>
      ) : params.billing === "unavailable" ? (
        <p role="alert" className="mt-5 rounded-2xl bg-marigold-50 p-4 text-sm text-bark-900 ring-1 ring-marigold-200">
          {t.account.billingSoonBody}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {plans.map((plan, index) => (
          <GlassPanel
            key={plan.name}
            as="article"
            surface="card"
            className={`flex flex-col rounded-3xl p-6 sm:p-8 ${index === 1 ? "ring-2 ring-leaf-300" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">{plan.name}</h2>
                <p className="mt-2 font-display text-3xl text-brand">{plan.price}</p>
              </div>
              {plan.saving ? <Badge tone="leaf">{plan.saving}</Badge> : null}
            </div>
            <p className="mt-4 leading-relaxed text-bark-600">{plan.note}</p>
            <ul className="mt-5 space-y-2 text-sm text-bark-600">
              <li className="flex gap-2">
                <CheckIcon className="mt-1 text-leaf-700" /> {t.account.detailGateBody}
              </li>
              <li className="flex gap-2">
                <LeafMark className="mt-1 text-leaf-700" /> {t.account.signInIntro}
              </li>
            </ul>
            <form action={startBillingAction.bind(null, locale, plan.code)} className="mt-7">
              <Button type="submit" size="lg" disabled={!billingReady} className="w-full">
                {billingReady ? t.account.continuePayment : t.account.billingSoon}
              </Button>
            </form>
          </GlassPanel>
        ))}
      </div>

      {!billingReady ? (
        <p className="mt-6 rounded-2xl border border-marigold-200 bg-marigold-50 p-4 text-sm leading-relaxed text-bark-900">
          {t.account.billingSoonBody}
        </p>
      ) : null}

      {subscription?.providerSubscriptionId &&
      !subscription.cancelAtPeriodEnd &&
      !subscription.cancellationRequestedAt &&
      !["CANCELLED", "EXPIRED"].includes(subscription.status) &&
      managementReady ? (
        <form action={cancelBillingAction.bind(null, locale)} className="mt-6">
          <Button type="submit" variant="danger">{t.account.cancelRenewal}</Button>
        </form>
      ) : null}

      {subscription?.cancellationRequestedAt ? (
        <p className="mt-6 rounded-2xl bg-leaf-50 p-4 text-sm text-leaf-800 ring-1 ring-leaf-200">
          {t.account.cancellationScheduled}
        </p>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-2xl">{t.account.billingHistory}</h2>
        {subscription?.paymentEvents.length ? (
          <ul className="mt-4 grid gap-2">
            {subscription.paymentEvents.map((event) => (
              <li key={event.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-bark-200 bg-white/70 px-4 py-3 text-sm">
                <span>{billingEventLabel(event.eventType, t)}</span>
                <span className="text-bark-600">
                  {new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(event.receivedAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-bark-600">{t.account.noBillingHistory}</p>
        )}
      </section>
    </div>
  );
}
