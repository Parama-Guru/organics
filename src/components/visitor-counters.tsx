"use client";

import { useEffect, useState } from "react";

let pending: Promise<{ today: number; total: number } | null> | undefined;
let pendingDay = "";

export function VisitorCounters({ tamil }: { tamil: boolean }) {
  const [counts, setCounts] = useState<{ today: number; total: number } | null>(null);
  useEffect(() => {
    let active = true;
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    if (pendingDay !== day) { pending = undefined; pendingDay = day; }
    pending ??= fetch("/api/visitors", {
      method: "POST", headers: { "x-ossil-visit": "1" }, credentials: "same-origin",
    }).then(async (response) => response.status === 200 ? response.json() : null).catch(() => null);
    void pending.then((result) => { if (active) setCounts(result); });
    return () => { active = false; };
  }, []);
  const number = new Intl.NumberFormat(tamil ? "ta-IN" : "en-IN");
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-bark-600">
      <div><dt>{tamil ? "இன்றைய பார்வையாளர்கள்" : "Visitors today"}</dt>
        <dd className="font-mono tabular-nums text-bark-900">{counts ? number.format(counts.today) : "—"}</dd></div>
      <div><dt>{tamil ? "மொத்த பார்வையாளர்கள்" : "Total visitors"}</dt>
        <dd className="font-mono tabular-nums text-bark-900">{counts ? number.format(counts.total) : "—"}</dd></div>
    </dl>
  );
}