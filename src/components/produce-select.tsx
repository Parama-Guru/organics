"use client";

import { useId, useState } from "react";
import { PRODUCE_ITEMS, PRODUCE_TYPES, findProduceItem } from "@/lib/produce-taxonomy";

export function ProduceSelect({
  tamil = false, required = true, initialItem = "", initialType = "",
  typeName = "produceType", itemName = "produceItemId",
}: {
  tamil?: boolean; required?: boolean; initialItem?: string; initialType?: string;
  typeName?: string; itemName?: string;
}) {
  const id = useId();
  const [type, setType] = useState(initialType || findProduceItem(initialItem)?.categorySlug || "");
  const [item, setItem] = useState(initialItem);
  const control = "focus-ring mt-2 min-h-12 w-full min-w-0 rounded-lg border border-bark-200 bg-paper px-3 py-2 text-base text-ink";
  return (
    <div className="grid min-w-0 gap-4 sm:col-span-2 sm:grid-cols-2">
      <label htmlFor={`${id}-type`} className="min-w-0 text-sm font-medium text-ink">
        {tamil ? "வகை" : "Produce type"}
        <select id={`${id}-type`} name={typeName} required={required} value={type} className={control}
          onChange={(event) => { setType(event.target.value); setItem(""); }}>
          <option value="">{tamil ? "வகையைத் தேர்ந்தெடுக்கவும்" : "Choose a type"}</option>
          {PRODUCE_TYPES.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.nameTa}</option>)}
        </select>
      </label>
      <label htmlFor={`${id}-item`} className="min-w-0 text-sm font-medium text-ink">
        {tamil ? "பொருள்" : "Produce item"}
        <select id={`${id}-item`} name={itemName} required={required} value={item} disabled={!type} className={control}
          onChange={(event) => setItem(event.target.value)}>
          <option value="">{tamil ? "பொருளைத் தேர்ந்தெடுக்கவும்" : "Choose an item"}</option>
          {PRODUCE_ITEMS.filter((entry) => entry.categorySlug === type).map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.nameTa}</option>
          ))}
        </select>
      </label>
    </div>
  );
}