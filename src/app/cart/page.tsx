import { loadConfig } from "@conf/config";
import { CartView } from "@/components/cart-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your basket",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  const { commerce } = loadConfig();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">Your basket</h1>
      <CartView
        deliveryFeeCents={commerce.delivery_fee_cents}
        freeDeliveryThresholdCents={commerce.free_delivery_threshold_cents}
      />
    </div>
  );
}
