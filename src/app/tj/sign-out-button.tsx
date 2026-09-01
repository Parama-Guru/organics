"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
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
      className="rounded-full border border-bark-200 px-3 py-1.5 text-sm font-medium text-bark-600 transition-colors hover:text-bark-900 disabled:opacity-55"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
