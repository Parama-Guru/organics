import { CartView } from "@/components/cart-view";
import { serverEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your basket",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  const { DELIVERY_FEE_CENTS, FREE_DELIVERY_THRESHOLD_CENTS } = serverEnv();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">Your basket</h1>
      <CartView
        deliveryFeeCents={DELIVERY_FEE_CENTS}
        freeDeliveryThresholdCents={FREE_DELIVERY_THRESHOLD_CENTS}
      />
    </div>
  );
}
