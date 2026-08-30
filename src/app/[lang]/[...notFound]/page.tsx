import { notFound } from "next/navigation";

/**
 * A path that matches no route at all renders Next's bare built-in 404, outside
 * this locale's layout — no header, no footer, no language. This catch-all is
 * the standard way to pull unmatched paths back inside the layout so
 * `[lang]/not-found.tsx` is what the visitor actually sees. More specific
 * segments always win over a catch-all, so it shadows nothing.
 */
export default function CatchAllNotFound(): never {
  notFound();
}
