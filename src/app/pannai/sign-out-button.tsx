"use client";

import { farmerSignOutAction } from "@/app/pannai/actions";

export function SignOutButton() {
  return (
    <form action={farmerSignOutAction}>
      <button
        type="submit"
        className="flex min-h-11 items-center rounded-lg px-2 text-bark-600 hover:text-bark-900"
      >
        வெளியேற
      </button>
    </form>
  );
}
