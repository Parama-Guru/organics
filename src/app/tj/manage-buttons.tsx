"use client";

import { useState, useTransition } from "react";

import {
  deleteCustomer,
  deleteFarmer,
  deleteProduct,
  setCustomerStatus,
  setProductActive,
  type ActionResult,
} from "@/app/tj/actions";
import { Button } from "@/components/ui/button";

function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(work: () => Promise<ActionResult>) {
    startTransition(async () => {
      setError(null);
      const result = await work();
      if (!result.ok) setError(result.message);
    });
  }

  const message = error ? (
    <p role="alert" className="mt-1 text-sm text-red-700">
      {error}
    </p>
  ) : null;

  return { pending, run, message };
}

function idForm(field: string, value: string): FormData {
  const data = new FormData();
  data.set(field, value);
  return data;
}

export function ProductControls({
  productId,
  name,
  isActive,
}: {
  productId: string;
  name: string;
  isActive: boolean;
}) {
  const { pending, run, message } = useAction();

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => setProductActive(!isActive, idForm("productId", productId)))}
        >
          {isActive ? "Hide" : "Show"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={() => {
            // Naming the listing in the prompt is the difference between a
            // confirmed delete and a reflexive one.
            if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
            run(() => deleteProduct(idForm("productId", productId)));
          }}
        >
          Delete
        </Button>
      </div>
      {message}
    </div>
  );
}

export function DeleteFarmButton({
  farmerId,
  farmName,
  productCount,
}: {
  farmerId: string;
  farmName: string;
  productCount: number;
}) {
  const { pending, run, message } = useAction();
  const [typo, setTypo] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() => setConfirming(true)}
      >
        Delete farm
      </Button>
      {confirming ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-paper p-4">
          <label className="block text-sm font-medium text-bark-900">
            Type <strong>{farmName}</strong> to permanently delete this farm
            {productCount > 0
              ? ` and its ${productCount} listing${productCount === 1 ? "" : "s"}`
              : ""}.
            <input
              value={typed}
              onChange={(event) => {
                setTyped(event.target.value);
                setTypo(false);
              }}
              className="mt-2 min-h-11 w-full rounded-xl border border-bark-200 bg-paper px-3"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={pending || !typed}
              onClick={() => {
                if (typed.trim().toLowerCase() !== farmName.trim().toLowerCase()) {
                  setTypo(true);
                  return;
                }
                setTypo(false);
                run(() => deleteFarmer(idForm("farmerId", farmerId)));
              }}
            >
              Delete permanently
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {typo ? (
        <p role="alert" className="mt-1 text-sm text-red-700">
          That did not match the farm name. Nothing was deleted.
        </p>
      ) : null}
      {message}
    </div>
  );
}

export function CustomerControls({
  customerId,
  email,
  status,
}: {
  customerId: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED";
}) {
  const { pending, run, message } = useAction();

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run(() =>
              setCustomerStatus(
                status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                idForm("customerId", customerId),
              ),
            )
          }
        >
          {status === "ACTIVE" ? "Suspend" : "Restore"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(`Delete ${email} and their saved list? This cannot be undone.`)) {
              return;
            }
            run(() => deleteCustomer(idForm("customerId", customerId)));
          }}
        >
          Delete
        </Button>
      </div>
      {message}
    </div>
  );
}
