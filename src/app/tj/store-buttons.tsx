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
  const [reasonFor, setReasonFor] = useState<Status | null>(null);
  const [reason, setReason] = useState("");

  function run(status: Status, note?: string) {
    const question = CONFIRM[status];
    if (question && !REASON[status] && !window.confirm(question)) return;

    const form = new FormData();
    form.set("storeId", storeId);
    if (note) form.set("note", note.trim().slice(0, 500));

    startTransition(async () => {
      setError(null);
      const result: ActionResult = await decideStore(status, form);
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
              className="mt-2 w-full rounded-xl border border-bark-200 bg-white px-3 py-2.5 focus:border-marigold-400 focus:outline-none focus:ring-4 focus:ring-marigold-400/25"
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

export function DeleteStoreButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  function run() {
    if (typed.trim().toLowerCase() !== storeName.trim().toLowerCase()) {
      setMismatch(true);
      return;
    }
    setMismatch(false);

    const form = new FormData();
    form.set("storeId", storeId);

    startTransition(async () => {
      setError(null);
      const result: ActionResult = await deleteStore(form);
      if (!result.ok) setError(result.message);
      else setConfirming(false);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() => setConfirming(true)}
      >
        Delete
      </Button>
      {confirming ? (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4">
          <label className="block text-sm font-medium text-bark-900">
            Type <strong>{storeName}</strong> to permanently delete this shop and its application.
            <input
              value={typed}
              onChange={(event) => {
                setTyped(event.target.value);
                setMismatch(false);
              }}
              className="mt-2 min-h-11 w-full rounded-xl border border-bark-200 bg-white px-3"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="danger" disabled={pending || !typed} onClick={run}>
              Delete permanently
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {mismatch ? (
        <p role="alert" className="text-sm text-red-700">
          That did not match the shop name. Nothing was deleted.
        </p>
      ) : null}
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
