// Prisma resolves its datasource from DATABASE_URL, so the value from
// conf/config.yaml is exported here — once, before any route module loads.
// A real environment variable always wins, which is how Render/Vercel inject theirs.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { loadConfig } = await import("@conf/config");
  const { url, direct_url } = loadConfig().database.postgres;

  if (url && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url;
  }

  // Prisma still reads directUrl at runtime even though only migrations use it.
  const direct = direct_url || url;
  if (direct && !process.env.DIRECT_URL) {
    process.env.DIRECT_URL = direct;
  }
}
