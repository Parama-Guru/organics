"use client";

import { useTransition } from "react";

import { deleteProductAction, toggleProductActiveAction } from "@/app/pannai/actions";

export function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => toggleProductActiveAction(id, !isActive))}
      className="flex min-h-11 items-center rounded-full border border-bark-200 px-4 text-sm font-medium text-bark-900 disabled:opacity-55"
    >
      {isActive ? "மறைக்க" : "காட்ட"}
    </button>
  );
}

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        // Deleting a listing is not reversible from the portal, so it asks.
        if (!confirm(`"${name}" நிரந்தரமாக நீக்கப்படும். தொடரவா?`)) return;
        start(() => deleteProductAction(id));
      }}
      className="flex min-h-11 items-center rounded-full border border-red-300 px-4 text-sm font-medium text-red-700 disabled:opacity-55"
    >
      நீக்க
    </button>
  );
}
