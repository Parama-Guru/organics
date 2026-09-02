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
  const [reasonFor, setReasonFor] = useState<Status | null>(null);
  const [reason, setReason] = useState("");

  function run(status: Status, note?: string) {
    const question = CONFIRM[status];
    if (question && !REASON[status] && !window.confirm(question)) return;

    const form = new FormData();
    form.set("farmerId", farmerId);
    if (note) form.set("note", note.trim().slice(0, 500));

    startTransition(async () => {
      setError(null);
      const result: ActionResult = await decideFarmer(status, form);
      if (!result.ok) setError(result.message);
      else {
        setReasonFor(null);
        setReason("");
      }
    });
  }

  function choose(status: Status) {
    if (REASON[status]) {
      setError(null);
      setReason("");
      setReasonFor(status);
      return;
    }
    run(status);
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
          onClick={() => choose(action.status)}
        >
          {action.label}
        </Button>
      ))}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {reasonFor ? (
        <div className="w-full rounded-xl border border-marigold-200 bg-marigold-50 p-4">
          <label className="block text-sm font-medium text-bark-900">
            {REASON[reasonFor]}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              required
              className="mt-2 w-full rounded-xl border border-bark-200 bg-paper px-3 py-2.5 focus:border-marigold-400 focus:outline-none focus:ring-4 focus:ring-marigold-400/25"
            />
          </label>
          <p className="mt-2 text-sm text-bark-600">{CONFIRM[reasonFor]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={pending || reason.trim().length < 3}
              onClick={() => run(reasonFor, reason)}
            >
              Confirm {reasonFor.toLowerCase()}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => setReasonFor(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
