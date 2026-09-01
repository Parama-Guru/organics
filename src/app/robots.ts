import type { MetadataRoute } from "next";

import { loadConfig } from "@conf/config";

// Read per request, not baked at build. The Dockerfile defaults
// NEXT_PUBLIC_SITE_URL to localhost, so a build without that arg would freeze
// `Sitemap: http://localhost:3000/...` into the image for the life of the tag.
export const dynamic = "force-dynamic";

/**
 * Generated rather than a static file so the Sitemap line follows
 * `app.site_url` instead of drifting from it.
 *
 * The staff and farmer areas are deliberately not listed. Naming a private path
 * in robots.txt publishes it to anyone who reads the file, which is the
 * opposite of what an unguessable path is for. Both trees send noindex in their
 * own metadata and 404 without a session, so a crawler has nothing to index.
 */
export default function robots(): MetadataRoute.Robots {
  const base = loadConfig().app.site_url.replace(/\/$/, "");

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
