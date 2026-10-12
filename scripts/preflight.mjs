import { spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function cleanEnvironment(source = process.env) {
  const environment = {};
  for (const [key, value] of Object.entries(source)) {
    if (/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|TMPDIR|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|PROGRAMFILES|PROGRAMFILES\(X86\)|PROCESSOR_ARCHITECTURE|NUMBER_OF_PROCESSORS)$/i.test(key)) {
      environment[key] = value;
    }
  }
  return {
    ...environment,
    CI: "true", HUSKY: "0", OSSIL_SKIP_HOOK_INSTALL: "1",
    NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1",
    CONFIG_PATH: "conf/config.example.yaml", APP_ENV: "dev",
    DATABASE_URL: "", DIRECT_URL: "", REDIS_URL: "",
    ACCOUNTS_ENABLED: "false", BILLING_ENABLED: "false",
    NEXT_PUBLIC_SITE_URL: "https://www.ossil.in",
  };
}

function command(program, args, options = {}) {
  const result = spawnSync(program, args, { stdio: "inherit", ...options });
  if (result.error || result.status !== 0) {
    throw new Error(`${program} ${args[0] ?? ""} failed; push is blocked`);
  }
  return result.stdout;
}

export function verifySnapshot(repository, revision) {
  const temporary = mkdtempSync(path.join(tmpdir(), "ossil-preflight-"));
  const snapshot = path.join(temporary, "source");
  mkdirSync(snapshot);
  try {
    if (revision) {
      const archive = path.join(temporary, "source.tar");
      command("git", ["archive", "--format=tar", `--output=${archive}`, revision], { cwd: repository });
      command("tar", ["-xf", archive, "-C", snapshot]);
    } else {
      const files = command("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
        cwd: repository, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8",
      }).split("\0").filter(Boolean);
      for (const file of new Set(files)) {
        const source = path.join(repository, file);
        if (!existsSync(source)) continue;
        if (lstatSync(source).isSymbolicLink()) throw new Error("Preflight does not accept symlinks");
        const target = path.join(snapshot, file);
        mkdirSync(path.dirname(target), { recursive: true });
        cpSync(source, target);
      }
    }
    for (const file of readdirSync(snapshot, { recursive: true })) {
      const name = path.basename(file);
      if ((name === ".env" || name.startsWith(".env.")) && name !== ".env.example" ||
          /^client_secret.*\.json$/i.test(name) || file.replaceAll("\\", "/") === "conf/config.yaml") {
        throw new Error(`Private file included: ${file}`);
      }
    }
    const environment = cleanEnvironment();
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const run = (args, build = false) => command(npm, args, {
      cwd: snapshot,
      env: build ? {
        ...environment,
        DATABASE_URL: "postgresql://preflight:preflight@127.0.0.1:1/preflight",
        DIRECT_URL: "postgresql://preflight:preflight@127.0.0.1:1/preflight",
      } : environment,
      shell: process.platform === "win32",
    });
    console.log(`Verifying ${revision ?? "working tree"} in an isolated directory`);
    console.log("Database integration tests run separately in CI against disposable PostgreSQL.");
    run(["ci", "--include=dev", "--no-audit", "--no-fund"]);
    run(["run", "db:generate"], true);
    for (const script of ["config:check", "lint", "test", "typecheck", "build"]) {
      run(["run", script], script === "build");
    }
    console.log(`PASS: ${revision ?? "working tree"} production build and checks`);
  } finally {
    rmSync(temporary, { recursive: true, force: true, maxRetries: 3 });
  }
}

export function outgoingCommits(input) {
  return [...new Set(input.trim().split(/\r?\n/).filter(Boolean).flatMap((line) => {
    const [reference, revision] = line.split(/\s+/);
    if (!reference.startsWith("refs/heads/") || /^0+$/.test(revision ?? "")) return [];
    if (!/^[a-f0-9]{40,64}$/.test(revision ?? "")) throw new Error("Invalid outgoing revision");
    return [revision];
  }))];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const repository = command("git", ["rev-parse", "--show-toplevel"], {
      stdio: ["ignore", "pipe", "inherit"], encoding: "utf8",
    }).trim();
    if (process.argv.includes("--pre-push")) {
      for (const revision of outgoingCommits(readFileSync(0, "utf8"))) verifySnapshot(repository, revision);
    } else {
      verifySnapshot(repository);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}