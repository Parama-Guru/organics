"use client";

import { useState, useTransition } from "react";

import { decideFarmer, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

type Status = "VERIFIED" | "REJECTED" | "SUSPENDED" | "PENDING";

const CONFIRM: Partial<Record<Status, string>> = {
  REJECTED: "Reject this application? The farm stays hidden from the public site.",
  SUSPENDED: "Suspend this farm? Its listings disappear from the public site immediately.",
};

export function DecisionButtons({
  farmerId,
  actions,
}: {
  farmerId: string;
  actions: { status: Status; label: string; variant?: "primary" | "secondary" | "dark" }[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(status: Status) {
    const question = CONFIRM[status];
    if (question && !window.confirm(question)) return;

    const form = new FormData();
    form.set("farmerId", farmerId);

    startTransition(async () => {
      setError(null);
      const result: ActionResult = await decideFarmer(status, form);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.status}
          type="button"
          size="sm"
          variant={action.variant ?? "secondary"}
          disabled={pending}
          onClick={() => run(action.status)}
        >
          {action.label}
        </Button>
      ))}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
