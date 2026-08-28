"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
      <Button type="button" variant="secondary" size="sm" disabled className={className}>
        Out of stock
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      aria-live="polite"
      onClick={() => {
        addItem(product);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1500);
      }}
      className={`${added ? "bg-leaf-600 text-white hover:bg-leaf-600" : ""} ${className}`}
    >
      {added ? (
        <>
          <span aria-hidden>&#10003;</span> Added
        </>
      ) : (
        "Add to cart"
      )}
    </Button>
  );
}
