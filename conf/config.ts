import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";

const configSchema = z
  .object({
    app: z
      .object({
        name: z.string().min(1).default("Organics"),
        env: z.enum(["dev", "prod"]).default("dev"),
        site_url: z.url().default("http://localhost:3000"),
        currency: z
          .string()
          .regex(/^[A-Z]{3}$/, "must be a 3-letter ISO 4217 code")
          .default("INR"),
        // Drives digit grouping: en-IN gives 12,34,567 where en-US gives 1,234,567.
        locale: z.string().min(2).default("en-IN"),
      })
      .prefault({}),
    database: z
      .object({
        // Deliberately not required: `next build` and `docker build` run without a
        // database. Prisma raises its own error if this is still empty at runtime.
        postgres: z
          .object({
            url: z.string().default(""),
            // Session-mode connection. Prisma Migrate cannot run through a
            // transaction-mode pooler; falls back to `url` when unset.
            direct_url: z.string().default(""),
          })
          .prefault({}),
        mongodb: z
          .object({
            uri: z.string().default(""),
            database: z.string().min(1).default("organics"),
          })
          .prefault({}),
      })
      .prefault({}),
    redis: z
      .object({
        enabled: z.boolean().default(false),
        url: z.string().default(""),
      })
      .prefault({}),
    supabase: z
      .object({
        url: z.string().default(""),
        // Safe to ship to the browser; RLS still applies.
        publishable_key: z.string().default(""),
        // Bypasses Row Level Security. Server-only, never inlined into a bundle.
        secret_key: z.string().default(""),
        jwks_url: z.string().default(""),
      })
      .prefault({}),
    commerce: z
      .object({
        // Coerced: a "${VAR}" expansion always arrives as a string.
        delivery_fee_cents: z.coerce.number().int().min(0).default(4900),
        free_delivery_threshold_cents: z.coerce.number().int().min(0).default(49900),
      })
      .prefault({}),
  })
  .check((ctx) => {
    if (ctx.value.redis.enabled && !ctx.value.redis.url) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.redis.url,
        path: ["redis", "url"],
        message: "required when redis.enabled is true",
      });
    }

    // This value is inlined into the client bundle, so pasting the secret key
    // here would publish it to every visitor.
    if (ctx.value.supabase.publishable_key.startsWith("sb_secret_")) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.supabase.publishable_key,
        path: ["supabase", "publishable_key"],
        message: "looks like a secret key — use the sb_publishable_ key here",
      });
    }
  });

export type AppConfig = z.infer<typeof configSchema>;

const ENV_REF = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}/g;

// "${VAR}" / "${VAR:-fallback}" so a tracked, secret-free file can still drive
// hosted deployments that only hand us environment variables.
function expandEnvRefs(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(ENV_REF, (_match, name: string, fallback?: string) => {
      const fromEnv = process.env[name];
      return fromEnv !== undefined && fromEnv !== "" ? fromEnv : (fallback ?? "");
    });
  }
  if (Array.isArray(value)) return value.map(expandEnvRefs);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        expandEnvRefs(item),
      ]),
    );
  }
  return value;
}

// The `turbopackIgnore` comments stop the build tracer from seeing a computed
// path and defensively bundling every file in the repo (public/ included) into
// the server output. next.config.ts declares conf/*.yaml explicitly instead.
function resolveConfigPath(): string {
  const override = process.env.CONFIG_PATH;
  if (override) {
    const resolved = path.resolve(override);
    if (!existsSync(/*turbopackIgnore: true*/ resolved)) {
      throw new Error(`CONFIG_PATH points at a file that does not exist: ${resolved}`);
    }
    return resolved;
  }

  const confDir = path.join(process.cwd(), "conf");
  for (const candidate of ["config.yaml", "config.example.yaml"]) {
    const resolved = path.join(confDir, candidate);
    if (existsSync(/*turbopackIgnore: true*/ resolved)) return resolved;
  }

  throw new Error("No configuration found. Copy conf/config.example.yaml to conf/config.yaml.");
}

let cached: AppConfig | null = null;

// Read lazily rather than at import time: a bad or missing config should fail
// the request, not `next build` (Docker images are built without a database).
export function loadConfig(): AppConfig {
  if (cached) return cached;

  if (typeof window !== "undefined") {
    throw new Error("loadConfig() is server-only — importing it from a client component would leak secrets into the browser bundle.");
  }

  const file = resolveConfigPath();
  const raw = readFileSync(/*turbopackIgnore: true*/ file, "utf8");
  const parsed = configSchema.safeParse(expandEnvRefs(parse(raw) ?? {}));

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid configuration in ${path.relative(process.cwd(), file)} — ${details}`);
  }

  cached = parsed.data;
  return cached;
}
