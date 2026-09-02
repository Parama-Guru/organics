"use client";

import { useState, useTransition } from "react";

import {
  setFarmerFlag,
  setStoreFlag,
  updateFarmerEvidence,
  updateStoreEvidence,
  type ActionResult,
} from "@/app/tj/actions";
import { Button } from "@/components/ui/button";

const field =
  "mt-1.5 min-h-11 w-full rounded-xl border border-bark-200 bg-white px-3.5 " +
  "focus:border-marigold-400 focus:outline-none focus:ring-4 focus:ring-marigold-400/25";

export function SellerFlagButton({
  kind,
  sellerId,
  flagged,
}: {
  kind: "farmer" | "store";
  sellerId: string;
  flagged: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");

  function run(nextReason?: string) {
    const form = new FormData();
    form.set(kind === "farmer" ? "farmerId" : "storeId", sellerId);
    if (!flagged) {
      if (!nextReason) {
        setEditing(true);
        return;
      }
      form.set("reason", nextReason.trim().slice(0, 500));
    } else if (!window.confirm("Clear this review flag? The status will not change.")) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = kind === "farmer"
        ? await setFarmerFlag(!flagged, form)
        : await setStoreFlag(!flagged, form);
      if (!result.ok) setError(result.message);
      else {
        setEditing(false);
        setReason("");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={flagged ? "secondary" : "danger"}
        disabled={pending}
        onClick={() => run()}
      >
        {flagged ? "Clear review flag" : "Flag for review"}
      </Button>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {editing ? (
        <div className="w-full rounded-xl border border-marigold-200 bg-marigold-50 p-4">
          <label className="block text-sm font-medium text-bark-900">
            Why does this record need review? Kept internally.
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              className="mt-2 w-full rounded-xl border border-bark-200 bg-white px-3 py-2.5 focus:border-marigold-400 focus:outline-none focus:ring-4 focus:ring-marigold-400/25"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={pending || reason.trim().length < 3}
              onClick={() => run(reason)}
            >
              Add review flag
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Result({ result }: { result: ActionResult | null }) {
  return result ? (
    <p role={result.ok ? "status" : "alert"} className={result.ok ? "text-sm text-leaf-800" : "text-sm text-red-700"}>
      {result.ok ? "Verification record saved." : result.message}
    </p>
  ) : null;
}

export function FarmerEvidenceForm({
  farmerId,
  initial,
}: {
  farmerId: string;
  initial: {
    govtIdLast4: string;
    certifier: string;
    certificateNo: string;
    certifiedUntil: string;
    certificateUrl: string;
    note: string;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function submit(formData: FormData) {
    formData.set("farmerId", farmerId);
    startTransition(async () => setResult(await updateFarmerEvidence(formData)));
  }

  return (
    <form action={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-bark-900">
        Aadhaar last 4
        <input name="govtIdLast4" inputMode="numeric" required pattern="[0-9]{4}" maxLength={4} defaultValue={initial.govtIdLast4} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900">
        Valid until
        <input name="certifiedUntil" type="date" required defaultValue={initial.certifiedUntil} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900 sm:col-span-2">
        Certification scheme and body
        <input name="certifier" required minLength={3} maxLength={160} defaultValue={initial.certifier} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900">
        Certificate number
        <input name="certificateNo" required minLength={3} maxLength={80} defaultValue={initial.certificateNo} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900">
        Certificate URL
        <input name="certificateUrl" type="url" maxLength={500} defaultValue={initial.certificateUrl} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900 sm:col-span-2">
        Internal review note
        <textarea name="note" rows={3} maxLength={500} defaultValue={initial.note} className={`${field} py-2.5`} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save verification record"}</Button>
        <Result result={result} />
      </div>
    </form>
  );
}

export function StoreEvidenceForm({
  storeId,
  initial,
}: {
  storeId: string;
  initial: {
    govtIdLast4: string;
    fssaiNumber: string;
    certifier: string;
    certificateNo: string;
    certifiedUntil: string;
    certificateUrl: string;
    note: string;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function submit(formData: FormData) {
    formData.set("storeId", storeId);
    startTransition(async () => setResult(await updateStoreEvidence(formData)));
  }

  return (
    <form action={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-bark-900">
        Aadhaar last 4
        <input name="govtIdLast4" inputMode="numeric" required pattern="[0-9]{4}" maxLength={4} defaultValue={initial.govtIdLast4} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900">
        FSSAI licence number
        <input name="fssaiNumber" inputMode="numeric" required pattern="[0-9 ]{14,20}" maxLength={20} defaultValue={initial.fssaiNumber} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900 sm:col-span-2">
        Optional certification scheme and body
        <input name="certifier" maxLength={160} defaultValue={initial.certifier} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900">
        Optional certificate number
        <input name="certificateNo" maxLength={80} defaultValue={initial.certificateNo} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900">
        Optional valid-until date
        <input name="certifiedUntil" type="date" defaultValue={initial.certifiedUntil} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900 sm:col-span-2">
        Optional certificate URL
        <input name="certificateUrl" type="url" maxLength={500} defaultValue={initial.certificateUrl} className={field} />
      </label>
      <label className="text-sm font-medium text-bark-900 sm:col-span-2">
        Internal review note
        <textarea name="note" rows={3} maxLength={500} defaultValue={initial.note} className={`${field} py-2.5`} />
      </label>
      <p className="text-sm text-bark-600 sm:col-span-2">
        If any organic certificate field is used, scheme, number and a future expiry are all required. Leave all four blank when the shop relies on suppliers&apos; certificates.
      </p>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save verification record"}</Button>
        <Result result={result} />
      </div>
    </form>
  );
}
