import Link from "next/link";

import { loadConfig } from "@conf/config";
import { GlassPanel } from "@/components/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import type { CustomerAccess } from "@/lib/customer-access";
import { format, localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { formatMoney } from "@/lib/money";
import { formatIndiaDate } from "@/lib/india-date";

function accessTitle(access: CustomerAccess, t: Dictionary): string {
  if (access.kind === "FREE_ACCESS") return t.account.freeAccess;
  if (access.kind === "TRIAL") return t.account.trialAccess;
  if (access.kind === "ACTIVE" || access.kind === "CANCELLED") {
    return t.account.activeAccess;
  }
  if (access.kind === "PAST_DUE") return t.account.accessPastDue;
  return t.account.accessExpired;
}

export function AccessCard({
  access,
  locale,
  t,
  compact = false,
}: {
  access: CustomerAccess;
  locale: Locale;
  t: Dictionary;
  compact?: boolean;
}) {
  const billing = loadConfig().billing;
  const price =
    access.agreedAmountPaise !== null && access.agreedCurrency
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: access.agreedCurrency,
          maximumFractionDigits: 2,
        }).format(access.agreedAmountPaise / 100)
      : null;
  const planDetails =
    access.plan === "STARTER_MONTHLY"
      ? format(t.account.planPriceLine, {
          plan: t.account.monthlyPlan,
          price: price ?? formatMoney(billing.monthly_paise),
        })
      : access.plan === "STARTER_ANNUAL"
        ? format(t.account.planPriceLine, {
            plan: t.account.annualPlan,
            price: price ?? formatMoney(billing.annual_paise),
          })
        : null;
  const date = access.periodEndsAt ?? access.trialEndsAt;
  const exactDate = date ? formatIndiaDate(date, locale) : null;

  return (
    <GlassPanel as="section" className={`rounded-3xl ${compact ? "p-5" : "p-6 sm:p-8"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone={access.allowed ? "leaf" : "marigold"}>
            <CheckIcon /> {t.account.currentPlan}
          </Badge>
          <h2 className="mt-3 font-display text-2xl">{accessTitle(access, t)}</h2>
          {planDetails ? <p className="mt-1 text-sm font-medium text-bark-900">{planDetails}</p> : null}
          {access.kind === "FREE_ACCESS" ? (
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-bark-600">
              {t.account.freeAccessBody}
            </p>
          ) : access.daysRemaining !== null ? (
            <>
              <p className="mt-1 text-sm text-bark-600">
                {format(t.account.accessDays, { days: access.daysRemaining })}
              </p>
              {exactDate ? (
                <p className="mt-1 text-sm text-bark-600">
                  {format(
                    access.kind === "TRIAL"
                      ? t.account.trialEndsExact
                      : access.kind === "CANCELLED"
                        ? t.account.accessEndsExact
                        : access.kind === "ACTIVE" || access.kind === "PAST_DUE"
                          ? t.account.renewsExact
                          : t.account.accessEndedExact,
                    { date: exactDate },
                  )}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
        <Button as={Link} href={localePath(locale, "/account/plans")} variant="secondary">
          {t.account.managePlan}
        </Button>
      </div>
    </GlassPanel>
  );
}
