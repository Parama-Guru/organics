"use client";

import { useState, useTransition } from "react";

import { decideFarmer, type ActionResult } from "@/app/tj/actions";
import { Button } from "@/components/ui/button";

type Status = "VERIFIED" | "REJECTED" | "SUSPENDED" | "PENDING";

const CONFIRM: Partial<Record<Status, string>> = {
  // Approving publishes a farm's name, phone and email and stamps it verified.
  // It changes as much as rejecting does, so it asks in the same way.
  VERIFIED: "Approve this farm? Its name, phone and listings go public straight away.",
  REJECTED: "Reject this application? The farm stays hidden from the public site.",
  SUSPENDED: "Suspend this farm? Its listings disappear from the public site immediately.",
};

// The schema has always accepted a note; nothing ever sent one, so nobody could
// later say why a farm was turned away.
const REASON: Partial<Record<Status, string>> = {
  REJECTED: "Why is this being rejected? Kept internally.",
  SUSPENDED: "Why is this being suspended? Kept internally.",
};

export function DecisionButtons({
  farmerId,
  actions,
}: {
  farmerId: string;
  actions: { status: Status; label: string; variant?: "primary" | "secondary" | "dark" | "danger" }[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(status: Status) {
    const question = CONFIRM[status];
    if (question && !window.confirm(question)) return;

    const form = new FormData();
    form.set("farmerId", farmerId);

    const asks = REASON[status];
    if (asks) {
      const note = window.prompt(asks);
      // Cancel means cancel the decision, not "decide without a reason".
      if (note === null) return;
      if (note.trim()) form.set("note", note.trim().slice(0, 500));
    }

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
