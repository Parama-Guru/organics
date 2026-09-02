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
        name: z.string().min(1).default("OSSIL"),
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
        // Shown on the contact page. Empty hides the line rather than printing a
        // number nobody answers.
        contact_phone: z.string().default(""),
        contact_address: z.string().default(""),
        contact_hours: z.string().default(""),
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
    // The accounts are being opened as the site launches. Each is rendered as a
    // real link once its URL is set and as a dimmed, unclickable icon until
    // then — a footer that quietly loses its Instagram icon on the day the
    // account is created is harder to spot than one that shows it greyed out.
    social: z
      .object({
        instagram: z.string().default(""),
        facebook: z.string().default(""),
        linkedin: z.string().default(""),
        youtube: z.string().default(""),
        whatsapp: z.string().default(""),
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
    auth: z
      .object({
        google: z
          .object({
            // Both are required for the server-side authorization-code flow.
            // No token or profile photograph is stored after sign-in.
            client_id: z.string().default(""),
            client_secret: z.string().default(""),
            // Local-only downloaded JSON. Ignored by Git and Docker; hosted
            // deployments always use the two environment variables above.
            client_secret_file: z.string().default(""),
          })
          .prefault({}),
      })
      .prefault({}),
    billing: z
      .object({
        // False means everyone signed in has access. It stays false until a
        // real checkout and webhook can both be exercised end to end.
        enabled: envBool(false),
        trial_days: envInt(14, 1, 90),
        monthly_paise: envInt(4_900, 100, 1_000_000),
        annual_paise: envInt(49_900, 100, 10_000_000),
        razorpay_key_id: z.string().default(""),
        razorpay_key_secret: z.string().default(""),
        razorpay_webhook_secret: z
          .string()
          .refine((value) => !value || value.length >= 32, "must be empty or at least 32 characters")
          .default(""),
        razorpay_previous_webhook_secret: z
          .string()
          .refine((value) => !value || value.length >= 32, "must be empty or at least 32 characters")
          .default(""),
        razorpay_monthly_plan_id: z.string().default(""),
        razorpay_annual_plan_id: z.string().default(""),
      })
      .prefault({}),
    mail: z
      .object({
        // Shared transactional transport for password/email verification,
        // enquiry relay, and operational notices. Empty disables delivery.
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
        message:
          "required when accounts.enabled is true and app.env is prod. On Render this comes " +
          "from the organics-kv Key Value instance via fromService, so an empty value usually " +
          "means the blueprint has not been applied since that service was added — sync it, or " +
          "set ACCOUNTS_ENABLED=false to run the directory without buyer accounts",
      });
    }

    if (ctx.value.billing.enabled) {
      for (const key of [
        "razorpay_key_id",
        "razorpay_key_secret",
        "razorpay_webhook_secret",
        "razorpay_monthly_plan_id",
        "razorpay_annual_plan_id",
      ] as const) {
        if (!ctx.value.billing[key]) {
          ctx.issues.push({
            code: "custom",
            input: ctx.value.billing[key],
            path: ["billing", key],
            message: "required when billing.enabled is true",
          });
        }
      }
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

    // A malformed hash is NOT fatal. An empty one already means "admin area
    // off, public site up", so letting a typo in the same variable take the
    // whole directory down instead is the severity ladder upside down: buyers
    // and farmers would lose the site over a staff-only credential. It is
    // blanked below, with a loud warning, so the outcome matches the empty case.
  });

const ADMIN_HASH = /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/;

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

  // Degrade rather than die. `admin.password_hash` arrives from an environment
  // variable that has to be pasted by hand, and a trailing newline or a
  // truncated copy is the likeliest mistake in the whole deployment. Treated as
  // "no hash", which 404s /tj and leaves the public directory serving.
  if (parsed.data.admin.password_hash && !ADMIN_HASH.test(parsed.data.admin.password_hash)) {
    console.error(
      "[config] ADMIN_PASSWORD_HASH is not a valid scrypt hash, so the admin area is disabled. " +
        "It must match scrypt:<32 hex>:<128 hex> — 168 characters, one line, lower case. " +
        "Regenerate with `npm run admin:hash` and paste it without quotes or a trailing newline.",
    );
    parsed.data.admin.password_hash = "";
  }

  cached = parsed.data;
  return cached;
}
