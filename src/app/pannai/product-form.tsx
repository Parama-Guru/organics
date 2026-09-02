"use client";

import { useActionState } from "react";

import {
  createProductAction,
  updateProductAction,
  type PortalState,
} from "@/app/pannai/actions";

type Category = { id: string; name: string; nameTa: string | null };
type Region = { id: string; name: string; nameTa: string | null };

type Existing = {
  id: string;
  name: string;
  nameTa: string | null;
  description: string;
  descriptionTa: string | null;
  priceCents: number;
  unit: string;
  stock: number;
  isActive: boolean;
  categoryId: string;
  regionId: string | null;
};

const control =
  "mt-2 w-full rounded-2xl border border-bark-200 bg-paper px-4 py-3 " +
  "focus:border-leaf-500 focus:outline-none focus:ring-4 focus:ring-leaf-400/20";

function Field({
  label,
  hint,
  name,
  bad,
  error,
  children,
}: {
  label: string;
  hint?: string;
  name: string;
  bad: Set<string>;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-bark-900">{label}</span>
        {hint ? <span className="text-sm text-bark-600">{hint}</span> : null}
      </span>
      {children}
      {bad.has(name) && error ? (
        <span className="mt-1 block text-sm font-medium text-red-700">{error}</span>
      ) : null}
    </label>
  );
}

const ERRORS: Record<string, string> = {
  nameTa: "பெயர் மிகக் குறைவு.",
  descriptionTa: "ஒரு வாக்கியத்தில் விவரியுங்கள்.",
  price: "149 அல்லது 149.50 போல விலையைக் கொடுங்கள்.",
  unit: "அளவைக் கொடுங்கள் — 1 கிலோ, 500 கிராம்.",
  stock: "எண்ணாக மட்டும் கொடுங்கள்.",
  categoryId: "ஒரு வகையைத் தேர்ந்தெடுங்கள்.",
};

export function ProductForm({
  categories,
  regions,
  existing,
}: {
  categories: Category[];
  regions: Region[];
  existing?: Existing;
}) {
  const action = existing
    ? updateProductAction.bind(null, existing.id)
    : createProductAction;
  const [state, formAction, pending] = useActionState<PortalState, FormData>(action, {});
  const bad = new Set(state.fields ?? []);
  const kept = state.values ?? {};

  const price = existing ? (existing.priceCents / 100).toFixed(2).replace(/\.00$/, "") : "";

  return (
    <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="பொருளின் பெயர்" name="nameTa" bad={bad} error={ERRORS.nameTa}>
        <input
          name="nameTa"
          defaultValue={kept.nameTa ?? existing?.nameTa ?? ""}
          required
          minLength={2}
          maxLength={120}
          className={control}
        />
      </Field>

      <Field label="ஆங்கிலப் பெயர்" hint="விருப்பம்" name="name" bad={bad}>
        <input
          name="name"
          defaultValue={kept.name ?? existing?.name ?? ""}
          maxLength={120}
          className={control}
        />
      </Field>

      <Field
        label="விவரம்"
        name="descriptionTa"
        bad={bad}
        error={ERRORS.descriptionTa}
      >
        <textarea
          name="descriptionTa"
          defaultValue={kept.descriptionTa ?? existing?.descriptionTa ?? ""}
          required
          minLength={10}
          maxLength={600}
          rows={3}
          className={`${control} resize-y`}
        />
      </Field>

      <Field label="ஆங்கில விவரம்" hint="விருப்பம்" name="description" bad={bad}>
        <textarea
          name="description"
          defaultValue={kept.description ?? existing?.description ?? ""}
          maxLength={600}
          rows={3}
          className={`${control} resize-y`}
        />
      </Field>

      <Field label="விலை (₹)" name="price" bad={bad} error={ERRORS.price}>
        <input
          name="price"
          inputMode="decimal"
          defaultValue={kept.price ?? price}
          required
          placeholder="149"
          className={control}
        />
      </Field>

      <Field
        label="அளவு"
        hint="1 கிலோ, 500 கிராம், 1 லிட்டர்"
        name="unit"
        bad={bad}
        error={ERRORS.unit}
      >
        <input
          name="unit"
          defaultValue={kept.unit ?? existing?.unit ?? ""}
          required
          maxLength={40}
          placeholder="1 கிலோ"
          className={control}
        />
      </Field>

      <Field label="வகை" name="categoryId" bad={bad} error={ERRORS.categoryId}>
        <select
          name="categoryId"
          defaultValue={kept.categoryId ?? existing?.categoryId ?? ""}
          required
          className={control}
        >
          <option value="">—</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nameTa ?? category.name}
            </option>
          ))}
        </select>
      </Field>

      {/* A list, not a text box: a typed district used to create a duplicate
          browsing filter, and a Tamil one crashed the save outright. */}
      <Field label="மாவட்டம்" hint="விருப்பம்" name="regionId" bad={bad}>
        <select
          name="regionId"
          defaultValue={kept.regionId ?? existing?.regionId ?? ""}
          className={control}
        >
          <option value="">—</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.nameTa ?? region.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Without this the listing saved with zero stock and the public page
          said "not available now" while the portal said it was in the shop. */}
      <Field
        label="இருப்பு"
        hint="எத்தனை அளவு தயார்"
        name="stock"
        bad={bad}
        error={ERRORS.stock}
      >
        <input
          name="stock"
          inputMode="numeric"
          defaultValue={kept.stock ?? (existing ? String(existing.stock) : "10")}
          required
          placeholder="10"
          className={control}
        />
      </Field>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-bark-200 bg-white px-3.5 py-3 sm:col-span-2">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={existing ? existing.isActive : true}
          className="h-5 w-5 shrink-0 rounded border-bark-200"
        />
        <span className="text-sm text-ink">கடையில் காட்டவும்</span>
      </label>

      {state.error === "notYours" ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
          அந்தப் பொருள் உங்கள் பண்ணையுடையது அல்ல.
        </p>
      ) : state.error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
          குறியிட்ட பகுதிகளைச் சரிபார்க்கவும்.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 justify-self-start rounded-full bg-marigold-500 px-6 font-medium text-bark-900 disabled:opacity-55 sm:col-span-2"
      >
        {pending ? "சேமிக்கிறோம்…" : existing ? "மாற்றங்களைச் சேமிக்க" : "பொருளைச் சேர்க்க"}
      </button>
    </form>
  );
}
