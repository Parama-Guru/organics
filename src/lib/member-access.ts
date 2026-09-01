import "server-only";

import { notFound, redirect } from "next/navigation";

import { accountsEnabled, getCustomer } from "./customer-auth";
import { getCustomerAccess } from "./customer-access";
import { localePath, type Locale } from "./i18n/config";

export async function requireMemberAccess(locale: Locale, returnPath: string) {
  if (!accountsEnabled()) notFound();

  const customer = await getCustomer();
  if (!customer) {
    redirect(
      `${localePath(locale, "/account/sign-in")}?next=${encodeURIComponent(returnPath)}`,
    );
  }

  const access = await getCustomerAccess(customer.id);
  if (!access.allowed) {
    redirect(
      `${localePath(locale, "/account/plans")}?next=${encodeURIComponent(returnPath)}`,
    );
  }

  return { customer, access };
}
