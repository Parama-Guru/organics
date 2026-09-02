"use client";

import { useState, useTransition } from "react";

import {
  createSponsoredPlacement,
  setSponsoredPlacementStatus,
  type ActionResult,
} from "@/app/tj/actions";
import { Button } from "@/components/ui/button";

export function PromotionForm({
  farmers,
  stores,
  defaultStart,
  defaultEnd,
}: {
  farmers: { id: string; name: string }[];
  stores: { id: string; name: string }[];
  defaultStart: string;
  defaultEnd: string;
}) {
  const [targetType, setTargetType] = useState<"FARMER" | "STORE">("FARMER");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const options = targetType === "FARMER" ? farmers : stores;

  function submit(formData: FormData) {
    startTransition(async () => {
      setMessage(null);
      const result = await createSponsoredPlacement(formData);
      setMessage(result.ok ? "Promotion created." : result.message);
    });
  }

  return (
    <form action={submit} className="mt-5 grid gap-3 rounded-2xl border border-bark-200 bg-paper p-5 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Type
        <select
          name="targetType"
          value={targetType}
          onChange={(event) => setTargetType(event.target.value as "FARMER" | "STORE")}
          className="min-h-11 rounded-xl border border-bark-200 bg-paper px-3"
        >
          <option value="FARMER">Farmer</option>
          <option value="STORE">Organic store</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Verified target
        <select name="targetId" required className="min-h-11 rounded-xl border border-bark-200 bg-paper px-3">
          <option value="">Choose…</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Starts
        <input name="startsAt" type="date" required defaultValue={defaultStart} className="min-h-11 rounded-xl border border-bark-200 px-3" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Ends
        <input name="endsAt" type="date" required defaultValue={defaultEnd} className="min-h-11 rounded-xl border border-bark-200 px-3" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Priority (0–100)
        <input name="priority" type="number" min="0" max="100" defaultValue="10" required className="min-h-11 rounded-xl border border-bark-200 px-3" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Internal note
        <input name="note" maxLength={500} className="min-h-11 rounded-xl border border-bark-200 px-3" />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create promotion"}</Button>
        {message ? <p role="status" className="text-sm text-bark-600">{message}</p> : null}
      </div>
    </form>
  );
}

export function PromotionStatusButtons({ id, status }: { id: string; status: "ACTIVE" | "PAUSED" | "ENDED" }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(next: "ACTIVE" | "PAUSED" | "ENDED") {
    const form = new FormData();
    form.set("placementId", id);
    startTransition(async () => {
      const result: ActionResult = await setSponsoredPlacementStatus(next, form);
      setError(result.ok ? null : result.message);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PAUSED" ? <Button type="button" size="sm" disabled={pending} onClick={() => run("ACTIVE")}>Resume</Button> : null}
      {status === "ACTIVE" ? <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => run("PAUSED")}>Pause</Button> : null}
      {status !== "ENDED" ? <Button type="button" size="sm" variant="danger" disabled={pending} onClick={() => run("ENDED")}>End</Button> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
