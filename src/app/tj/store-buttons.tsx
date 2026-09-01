"use client";

import { useState, useTransition } from "react";

import { decideStore, deleteStore, retryEnquiryDelivery, setEnquiryHandled, setMessageHandled, type ActionResult } from "@/app/tj/actions";
import { Button } from "@/components/ui/button";

type Status = "VERIFIED" | "REJECTED" | "SUSPENDED" | "PENDING";

const CONFIRM: Partial<Record<Status, string>> = {
  VERIFIED: "Approve this shop? Its name, address and phone go public straight away.",
  REJECTED: "Reject this application? The shop stays hidden from the public site.",
  SUSPENDED: "Suspend this shop? It disappears from the public directory immediately.",
};

// A decision without a recorded reason is one nobody can defend later.
const REASON: Partial<Record<Status, string>> = {
  REJECTED: "Why is this being rejected? Kept internally.",
  SUSPENDED: "Why is this being suspended? Kept internally.",
};

export function StoreDecisionButtons({
  storeId,
  actions,
}: {
  storeId: string;
  actions: {
    status: Status;
    label: string;
    variant?: "primary" | "secondary" | "dark" | "danger";
  }[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(status: Status) {
    const question = CONFIRM[status];
    if (question && !window.confirm(question)) return;

    const form = new FormData();
    form.set("storeId", storeId);

    const asks = REASON[status];
    if (asks) {
      const note = window.prompt(asks);
      // Cancel means cancel the decision, not "decide without a reason".
      if (note === null) return;
      if (note.trim()) form.set("note", note.trim().slice(0, 500));
    }

    startTransition(async () => {
      setError(null);
      const result: ActionResult = await decideStore(status, form);
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

export function DeleteStoreButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (
      !window.confirm(
        `Delete ${storeName}? This erases the shop and its application. It cannot be undone.`,
      )
    ) {
      return;
    }

    const form = new FormData();
    form.set("storeId", storeId);

    startTransition(async () => {
      setError(null);
      const result: ActionResult = await deleteStore(form);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="danger" disabled={pending} onClick={run}>
        Delete
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function MessageHandledButton({
  messageId,
  handled,
}: {
  messageId: string;
  handled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    const form = new FormData();
    form.set("messageId", messageId);

    startTransition(async () => {
      setError(null);
      const result: ActionResult = await setMessageHandled(!handled, form);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={handled ? "ghost" : "primary"}
        className={handled ? "border-bark-200" : ""}
        disabled={pending}
        onClick={run}
      >
        {handled ? "Reopen" : "Mark answered"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function EnquiryHandledButton({
  enquiryId,
  handled,
}: {
  enquiryId: string;
  handled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    const form = new FormData();
    form.set("enquiryId", enquiryId);
    startTransition(async () => {
      setError(null);
      const result = await setEnquiryHandled(!handled, form);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={handled ? "ghost" : "primary"}
        className={handled ? "border-bark-200" : ""}
        disabled={pending}
        onClick={run}
      >
        {handled ? "Reopen" : "Mark resolved"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function RetryEnquiryButton({ enquiryId }: { enquiryId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    const form = new FormData();
    form.set("enquiryId", enquiryId);
    startTransition(async () => {
      setMessage(null);
      const result = await retryEnquiryDelivery(form);
      setMessage(result.ok ? "Delivery sent." : result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={run}>
        {pending ? "Retrying…" : "Retry delivery"}
      </Button>
      {message ? <p role="status" className="text-sm text-bark-600">{message}</p> : null}
    </div>
  );
}
