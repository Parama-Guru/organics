"use client";

import { storeSignOutAction } from "@/app/kadai/actions";

export function StoreSignOutButton({ dark = false }: { dark?: boolean }) {
  return (
    <form action={storeSignOutAction}>
      <button
        type="submit"
        className={`flex min-h-11 items-center rounded-xl px-3 transition-colors ${
          dark ? "text-bark-100 hover:bg-white/10 hover:text-white" : "text-bark-600 hover:bg-canvas-2 hover:text-bark-900"
        }`}
      >
        வெளியேற
      </button>
    </form>
  );
}
