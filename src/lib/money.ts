const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "INR";
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || "en-IN";

// Fixed locale keeps server and client output identical, avoiding hydration mismatches.
const formatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
});

// Minor units: paise for INR, cents for USD.
export function formatMoney(minorUnits: number): string {
  return formatter.format(minorUnits / 100);
}
