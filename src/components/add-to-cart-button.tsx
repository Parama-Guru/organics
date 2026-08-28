"use client";

import { useState } from "react";

import { useCart, type CartLine } from "@/lib/cart-context";

type Props = {
  product: Omit<CartLine, "quantity">;
  inStock: boolean;
  className?: string;
};

export function AddToCartButton({ product, inStock, className = "" }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <button
        type="button"
        disabled
        className={`rounded-full bg-bark-100 px-4 py-2 text-sm font-medium text-bark-600 ${className}`}
      >
        Out of stock
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem(product);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1500);
      }}
      className={`rounded-full bg-marigold-500 px-4 py-2 text-sm font-medium text-bark-900 transition-colors hover:bg-marigold-400 ${className}`}
    >
      {added ? "Added" : "Add to cart"}
    </button>
  );
}
