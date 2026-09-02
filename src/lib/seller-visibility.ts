import "server-only";

import { cache } from "react";

import { accountsEnabled, getCustomer } from "./customer-auth";
import { getCustomerAccess } from "./customer-access";

/**
 * Price and seller contact unlock together, on the same condition the product
 * detail page already used for the phone number. Browsing, farm names,
 * provenance and verification stay open; what a buyer would act on does not.
 *
 * Cached per request so a grid of cards costs one access lookup, not one each.
 */
export const sellerDetailsUnlocked = cache(async (): Promise<boolean> => {
  if (!accountsEnabled()) return false;

  const customer = await getCustomer();
  if (!customer) return false;

  const access = await getCustomerAccess(customer.id);
  return access.allowed;
});
