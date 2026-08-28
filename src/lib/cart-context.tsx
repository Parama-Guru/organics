"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "organics.cart.v1";
const MAX_QUANTITY = 50;

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  unit: string;
  emoji: string | null;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  hydrated: boolean;
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const EMPTY_LINES: CartLine[] = [];

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productId === "string" &&
    typeof line.slug === "string" &&
    typeof line.name === "string" &&
    typeof line.priceCents === "number" &&
    Number.isFinite(line.priceCents) &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0
  );
}

// localStorage is an external store, so it is read through useSyncExternalStore
// rather than copied into React state inside an effect.
let cachedSnapshot: CartLine[] | null = null;
const listeners = new Set<() => void>();

function readStoredCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_LINES;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_LINES;
    const valid = parsed.filter(isCartLine);
    return valid.length > 0 ? valid : EMPTY_LINES;
  } catch {
    return EMPTY_LINES;
  }
}

function getSnapshot(): CartLine[] {
  cachedSnapshot ??= readStoredCart();
  return cachedSnapshot;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY_LINES;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cachedSnapshot = null;
    emit();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function update(mutate: (current: CartLine[]) => CartLine[]): void {
  cachedSnapshot = mutate(getSnapshot());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedSnapshot));
  } catch {
    // Storage can be full or blocked; the cart still works for this session.
  }
  emit();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const addItem = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    update((current) => {
      const existing = current.find((item) => item.productId === line.productId);
      if (!existing) {
        return [...current, { ...line, quantity: Math.min(quantity, MAX_QUANTITY) }];
      }
      return current.map((item) =>
        item.productId === line.productId
          ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY) }
          : item,
      );
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    update((current) =>
      quantity <= 0
        ? current.filter((item) => item.productId !== productId)
        : current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(Math.trunc(quantity), MAX_QUANTITY) }
              : item,
          ),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    update((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => update(() => EMPTY_LINES), []);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      hydrated,
      itemCount: lines.reduce((total, item) => total + item.quantity, 0),
      subtotalCents: lines.reduce((total, item) => total + item.priceCents * item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [lines, hydrated, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
