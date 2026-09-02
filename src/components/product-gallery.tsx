"use client";

import Image from "next/image";
import { useState } from "react";

import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/config";

type Shot = { id: string; url: string; alt: string | null };

const frame =
  "specimen relative block aspect-[3/2] overflow-hidden rounded-[1.5rem] border border-bark-200";

export function ProductGallery({
  images,
  name,
  emptyLabel,
}: {
  images: Shot[];
  name: string;
  emptyLabel: string;
}) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className={frame}>
        <span aria-hidden className="specimen__plate" />
        <span className="absolute inset-0 z-3 flex items-center justify-center">
          <span className="rule-label text-bark-600">{emptyLabel}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="group min-w-0">
      <div className={frame}>
        {images.map((shot, index) => (
          <span
            key={shot.id}
            className={`specimen__art block transition-opacity duration-500 ease-tint ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={shot.url}
              // The stored alt is English-only, so the localised name wins here.
              alt={format(t.gallery.view, { name, index: index + 1 })}
              fill
              priority={index === 0}
              sizes="(max-width: 640px) 100vw, 55vw"
              // Every frame stays mounted and cross-fades, so switching never
              // flashes an empty box while the next file loads.
              className="object-cover"
            />
          </span>
        ))}

        {images.length > 1 ? (
          <span className="rule-label absolute right-4 top-4 z-5 rounded-full bg-paper/90 px-2.5 py-1 text-bark-600">
            {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div
          role="tablist"
          aria-label={format(t.gallery.images, { name })}
          className="no-scrollbar mt-3 flex gap-2 overflow-x-auto"
        >
          {images.map((shot, index) => (
            <button
              key={shot.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={format(t.gallery.show, { index: index + 1, total: images.length })}
              onClick={() => setActive(index)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition-colors duration-200 ease-tint ${
                index === active
                  ? "border-bark-900"
                  : "border-bark-200 opacity-65 hover:opacity-100"
              }`}
            >
              <Image src={shot.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {format(t.gallery.view, { name, index: active + 1 })}
      </p>
    </div>
  );
}
