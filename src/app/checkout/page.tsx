import { CheckoutForm } from "@/components/checkout-form";
import { serverEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  const { DELIVERY_FEE_CENTS, FREE_DELIVERY_THRESHOLD_CENTS } = serverEnv();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <p className="mt-2 text-bark-600">Delivery details for this basket.</p>
      <CheckoutForm
        deliveryFeeCents={DELIVERY_FEE_CENTS}
        freeDeliveryThresholdCents={FREE_DELIVERY_THRESHOLD_CENTS}
      />
    </div>
  );
}
