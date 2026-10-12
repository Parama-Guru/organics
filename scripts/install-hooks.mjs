import { spawnSync } from "node:child_process";
import { chmodSync } from "node:fs";

if (!process.env.CI && !process.env.OSSIL_SKIP_HOOK_INSTALL) {
  const inside = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  if (inside.status === 0) {
    const existing = spawnSync("git", ["config", "--get", "core.hooksPath"], { encoding: "utf8" });
    if (existing.stdout.trim() && existing.stdout.trim() !== ".githooks") {
      console.error("Existing core.hooksPath retained. Integrate .githooks/pre-push before pushing.");
      process.exitCode = 1;
    } else {
      chmodSync(".githooks/pre-push", 0o755);
      const installed = spawnSync("git", ["config", "--local", "core.hooksPath", ".githooks"], { stdio: "inherit" });
      process.exitCode = installed.status ?? 1;
      if (!process.exitCode) console.log("Installed repository-local pre-push build gate.");
    }
  }
}