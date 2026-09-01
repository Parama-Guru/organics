import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";

/**
 * `${VAR}` substitution always yields a string, so a hosted deployment sends
 * "false" and "587" where the schema wants a boolean and a number. Plain
 * `z.coerce.boolean()` is not usable here: it follows JS truthiness, so the
 * string "false" would come out `true`.
 */
const envBool = (fallback: boolean) =>
  z
    .preprocess((value) => {
      if (typeof value !== "string") return value;
      const text = value.trim().toLowerCase();
      if (text === "") return undefined;
      if (["true", "1", "yes", "on"].includes(text)) return true;
      if (["false", "0", "no", "off"].includes(text)) return false;
      return value;
    }, z.boolean())
    .default(fallback);

const envInt = (fallback: number, min: number, max: number) =>
  z
    .preprocess((value) => {
      if (typeof value !== "string") return value;
      const text = value.trim();
      return text === "" ? undefined : Number(text);
    }, z.number().int().min(min).max(max))
    .default(fallback);

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
        // Shown in the footer and the privacy page. Left empty the contact line is
        // hidden entirely, rather than shipping a placeholder address.
        contact_email: z.string().default(""),
        contact_place: z.string().default(""),
        // Publishing the farm's number is the whole point of the directory, but
        // it stays off until the farms have agreed to it. While false, every
        // call and WhatsApp button becomes a "details coming soon" note.
        show_farmer_phone: envBool(false),
        // How many proxies of ours sit in front of the app. Rate limiting reads
        // the client address this many entries in from the right of
        // X-Forwarded-For; everything further left is client-supplied and
        // forgeable. Render and Vercel both put exactly one hop in front. Set 0
        // when the app is exposed directly, and the header is then ignored.
        trusted_proxy_hops: envInt(1, 0, 5),
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
      })
      .prefault({}),
    redis: z
      .object({
        // Holds buyer sessions and the login rate limiter. Both need to be shared
        // across instances, which process memory cannot do.
        url: z.string().default(""),
        // Prefixed so one Redis instance can serve several environments.
        key_prefix: z.string().default("organics:"),
      })
      .prefault({}),
    accounts: z
      .object({
        // Buyer accounts: saved produce and saved farms. Off by default, so a
        // deployment does not start collecting personal data unasked.
        enabled: envBool(false),
        // Signs the session cookie. Rotating it signs everyone out.
        session_secret: z.string().default(""),
        session_ttl_days: envInt(30, 1, 90),
      })
      .prefault({}),
    mail: z
      .object({
        // Password reset is the only thing that sends mail. With no host the
        // reset link is not offered at all rather than half-working.
        host: z.string().default(""),
        port: envInt(587, 1, 65535),
        user: z.string().default(""),
        password: z.string().default(""),
        from: z.string().default(""),
      })
      .prefault({}),
    admin: z
      .object({
        // scrypt hash of the admin passphrase, as `scrypt:<salt-hex>:<key-hex>`.
        // Empty disables the admin area entirely, so a fresh deploy is never open.
        password_hash: z.string().default(""),
        // Signs the admin session cookie. Rotating it logs everyone out.
        session_secret: z.string().default(""),
        session_ttl_minutes: envInt(480, 5, 10_080),
      })
      .prefault({}),
  })
  .check((ctx) => {
    // A signing secret with no store, or a store with no secret, is a
    // half-configured login. Refuse both rather than start and fail per request.
    if (ctx.value.accounts.enabled && ctx.value.accounts.session_secret.length < 32) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.accounts.session_secret,
        path: ["accounts", "session_secret"],
        message: "must be at least 32 characters when accounts.enabled is true",
      });
    }

    // In-process session storage works for one container and silently signs
    // people out as soon as a second one starts. Allowed in dev, never in prod.
    if (ctx.value.accounts.enabled && ctx.value.app.env === "prod" && !ctx.value.redis.url) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.redis.url,
        path: ["redis", "url"],
        message: "required when accounts.enabled is true and app.env is prod",
      });
    }

    // The trust page invites people to report a bad listing and the privacy
    // page offers a copy of their data — both render the address from here, and
    // both silently drop the offer when it is blank. A directory that asks the
    // public to trust its verification, with no way to reach it, is worse than
    // one that never made the claim. Required before going live.
    if (ctx.value.app.env === "prod" && !ctx.value.app.contact_email) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.app.contact_email,
        path: ["app", "contact_email"],
        message:
          "required when app.env is prod — the trust and privacy pages promise a contact address",
      });
    }

    // A hash with no signing secret would mean unsigned session cookies, i.e.
    // anyone could forge one. Refuse to start half-configured.
    if (ctx.value.admin.password_hash && ctx.value.admin.session_secret.length < 32) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.admin.session_secret,
        path: ["admin", "session_secret"],
        message: "must be at least 32 characters when admin.password_hash is set",
      });
    }

    if (
      ctx.value.admin.password_hash &&
      !/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/.test(ctx.value.admin.password_hash)
    ) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.admin.password_hash,
        path: ["admin", "password_hash"],
        message: "must be a scrypt hash — generate it with `npm run admin:hash`",
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
