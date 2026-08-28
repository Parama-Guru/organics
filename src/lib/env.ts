import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DELIVERY_FEE_CENTS: z.coerce.number().int().min(0).default(499),
  FREE_DELIVERY_THRESHOLD_CENTS: z.coerce.number().int().min(0).default(5000),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

// Validated lazily rather than at import time so a missing value fails the
// request instead of breaking `next build` (Docker images build without a DB).
export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = Object.keys(z.flattenError(parsed.error).fieldErrors).join(", ");
    throw new Error(`Invalid server environment configuration: ${fields}`);
  }

  cached = parsed.data;
  return cached;
}
