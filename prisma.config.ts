import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

import { loadConfig } from "./conf/config";

// `prisma migrate` / `prisma studio` only read the environment, so the CLI gets
// the same datasource the app uses. An explicit env var still wins.
const postgres = loadConfig().database.postgres;
process.env.DATABASE_URL ||= postgres.url;
process.env.DIRECT_URL ||= postgres.direct_url || postgres.url;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
