// Loads conf/config.example.yaml exactly as a fresh deployment does, and fails
// if any setting the schema knows about is missing from it.
//
// This exists because the example file is the only config a hosted deploy has:
// `${VAR}` substitution always produces strings, so a field typed as a boolean
// or a number silently passed locally (where conf/config.yaml holds real types)
// and threw on Render and in CI. Nothing else exercises that path.
//
// Run: npm run config:check
process.env.CONFIG_PATH = "conf/config.example.yaml";

import { readFileSync } from "node:fs";
import { parse } from "yaml";

import { loadConfig } from "../conf/config";

function flatten(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix.slice(0, -1)];
  return Object.entries(value).flatMap(([key, child]) => flatten(child, `${prefix}${key}.`));
}

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error(`config.example.yaml does not load:\n  ${(error as Error).message}`);
  process.exit(1);
}

const example = parse(readFileSync("conf/config.example.yaml", "utf8")) ?? {};
const documented = new Set(flatten(example));
const missing = flatten(config).filter((key) => !documented.has(key));

if (missing.length > 0) {
  console.error(`Settings the schema accepts but config.example.yaml never mentions:`);
  for (const key of missing) console.error(`  ${key}`);
  console.error(`\nAdd them to conf/config.example.yaml, or a deployment cannot set them.`);
  process.exit(1);
}

// The substitution helper returns strings; prove the coercions survive that.
for (const [name, value] of [
  ["accounts.enabled", config.accounts.enabled],
  ["app.show_farmer_phone", config.app.show_farmer_phone],
] as const) {
  if (typeof value !== "boolean") {
    console.error(`${name} parsed as ${typeof value}, expected boolean`);
    process.exit(1);
  }
}

console.log(`config.example.yaml loads, ${documented.size} settings documented.`);
