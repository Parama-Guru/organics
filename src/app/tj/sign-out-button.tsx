"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/tj/session", { method: "DELETE" });
        router.replace("/tj/login");
        router.refresh();
      }}
      className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-55 ${
        dark
          ? "border-white/20 text-bark-100 hover:border-white/40 hover:bg-white/10 hover:text-white"
          : "border-bark-200 text-bark-600 hover:text-bark-900"
      }`}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
