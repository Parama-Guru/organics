const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";

// Fixed locale keeps server and client output identical, avoiding hydration mismatches.
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
});

export function formatMoney(minorUnits: number): string {
  return formatter.format(minorUnits / 100);
}
