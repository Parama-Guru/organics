import type { NextConfig } from "next";

import { loadConfig } from "./conf/config";

const appConfig = loadConfig();
const isDev = process.env.NODE_ENV === "development";

// Next injects inline bootstrap scripts, so 'unsafe-inline' is required without a
// nonce middleware. 'unsafe-eval' is dev-only (Turbopack HMR needs it).
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Every image is a local asset, so no third-party origin is allowed at all.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `next dev` and `next build` otherwise share .next, and leftover production
  // assets get served in dev with no error — a stale stylesheet looks like the
  // edit simply did nothing. Separate directories make that impossible.
  distDir: isDev ? ".next-dev" : ".next",
  // Only the Docker image needs the standalone bundle; Vercel builds without it.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  // The browser cannot read conf/config.yaml, so the public values it needs are
  // inlined here at build time. Never put a secret in this block — `env` entries
  // always end up in the client bundle.
  env: {
    NEXT_PUBLIC_CURRENCY: appConfig.app.currency,
    NEXT_PUBLIC_LOCALE: appConfig.app.locale,
  },
  // readFileSync on a computed path is invisible to the tracer, so the config
  // files have to be listed explicitly or standalone/serverless bundles omit them.
  outputFileTracingIncludes: {
    "/**": ["./conf/*.yaml"],
  },
  async headers() {
    const privateWorkspaceHeaders = [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "Pragma", value: "no-cache" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/pannai/:path*", headers: privateWorkspaceHeaders },
      { source: "/kadai/:path*", headers: privateWorkspaceHeaders },
      { source: "/tj/:path*", headers: privateWorkspaceHeaders },
    ];
  },
};

export default nextConfig;
