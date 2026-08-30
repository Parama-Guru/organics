const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "INR";
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || "en-IN";

// Fixed locale keeps server and client output identical, avoiding hydration mismatches.
function formatter(fractionDigits: number) {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

const whole = formatter(0);
const fractional = formatter(2);

// Minor units: paise for INR, cents for USD.
// A whole-rupee price is written ₹149, not ₹149.00 — the trailing zeros are noise
// across a grid of thirty cards.
export function formatMoney(minorUnits: number): string {
  const value = minorUnits / 100;
  return (minorUnits % 100 === 0 ? whole : fractional).format(value);
}
