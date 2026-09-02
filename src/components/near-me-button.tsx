"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { MapPinIcon } from "@/components/ui/icons";
import { nearestRegion, type LocatedRegion } from "@/lib/geo";

type Status = "idle" | "asking" | "denied" | "unavailable" | "nowhere";

/**
 * Asks the browser for a position, works out which district it falls nearest to,
 * and puts that district in the URL.
 *
 * The coordinates never leave this function: they are not sent to the server,
 * not written to storage and not kept in state after the district is chosen.
 * What travels is a district slug, which is exactly what the region filter
 * already puts in the URL.
 */
export function NearMeButton({
  regions,
  labels,
}: {
  regions: LocatedRegion[];
  labels: {
    action: string;
    asking: string;
    denied: string;
    unavailable: string;
    nowhere: string;
    privacy: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");

  const locate = () => {
    // Browsers only expose geolocation over HTTPS or on localhost.
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = nearestRegion(
          { latitude: position.coords.latitude, longitude: position.coords.longitude },
          regions,
        );

        if (!nearest) {
          setStatus("nowhere");
          return;
        }

        const next = new URLSearchParams(searchParams.toString());
        next.set("near", nearest.slug);
        setStatus("idle");
        router.push(`?${next.toString()}`, { scroll: false });
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const message =
    status === "denied"
      ? labels.denied
      : status === "unavailable"
        ? labels.unavailable
        : status === "nowhere"
          ? labels.nowhere
          : null;

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={locate}
        disabled={status === "asking"}
        className="inline-flex min-h-12 items-center gap-2 rounded-full border border-bark-200 bg-paper px-5 font-medium text-bark-900 transition-colors hover:border-marigold-400 hover:bg-canvas-2 disabled:opacity-60"
      >
        <MapPinIcon className="text-leaf-700" />
        {status === "asking" ? labels.asking : labels.action}
      </button>

      <p className="mt-2 max-w-sm text-xs leading-relaxed text-bark-600">
        {message ?? labels.privacy}
      </p>
    </div>
  );
}
