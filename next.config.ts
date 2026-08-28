import type { NextConfig } from "next";

import { loadConfig } from "./conf/config";

const appConfig = loadConfig();
const isDev = process.env.NODE_ENV === "development";
const supabaseHost = appConfig.supabase.url ? new URL(appConfig.supabase.url).hostname : "";

// Next injects inline bootstrap scripts, so 'unsafe-inline' is required without a
// nonce middleware. 'unsafe-eval' is dev-only (Turbopack HMR needs it).
const supabaseOrigin = appConfig.supabase.url ? new URL(appConfig.supabase.url).origin : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Supabase Storage serves product images; without it they are blocked outright.
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Supabase auth/storage/realtime calls from the browser.
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseOrigin.replace("https://", "wss://")}` : ""}`,
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
  // Only the Docker image needs the standalone bundle; Vercel builds without it.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  // The browser cannot read conf/config.yaml, so the public values it needs are
  // inlined here at build time. Never put a secret in this block — `env` entries
  // always end up in the client bundle. supabase.secret_key must never appear here.
  env: {
    NEXT_PUBLIC_CURRENCY: appConfig.app.currency,
    NEXT_PUBLIC_LOCALE: appConfig.app.locale,
    NEXT_PUBLIC_SUPABASE_URL: appConfig.supabase.url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: appConfig.supabase.publishable_key,
  },
  // readFileSync on a computed path is invisible to the tracer, so the config
  // files have to be listed explicitly or standalone/serverless bundles omit them.
  outputFileTracingIncludes: {
    "/**": ["./conf/*.yaml"],
  },
  // Scoped to this project's public Storage bucket so the optimizer cannot be
  // pointed at arbitrary hosts.
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https" as const,
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
