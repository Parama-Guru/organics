import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { cleanEnvironment, outgoingCommits, verifySnapshot } from "../scripts/preflight.mjs";

test("preflight excludes secrets and does not inherit development build mode", () => {
  const environment = cleanEnvironment({ Path: "tools", NODE_ENV: "development", DATABASE_URL: "secret", CLOUDINARY_API_SECRET: "secret", RAILWAY_TOKEN: "secret", CONFIG_PATH: "private.yaml" });
  assert.equal(environment.Path, "tools");
  assert.equal(environment.NODE_ENV, "production");
  assert.equal(environment.CONFIG_PATH, "conf/config.example.yaml");
  assert.equal(environment.DATABASE_URL, "");
  assert.equal(environment.CLOUDINARY_API_SECRET, undefined);
  assert.equal(environment.RAILWAY_TOKEN, undefined);
});

test("pre-push verifies unique outgoing branch revisions, not deletions or tags", () => {
  const revision = "a".repeat(40);
  const zero = "0".repeat(40);
  assert.deepEqual(outgoingCommits(`refs/heads/main ${revision} refs/heads/main ${zero}\nrefs/heads/test ${revision} refs/heads/test ${zero}\nrefs/heads/deleted ${zero} refs/heads/deleted ${revision}\nrefs/tags/v1 ${revision} refs/tags/v1 ${zero}\n`), [revision]);
  assert.deepEqual(outgoingCommits(""), []);
  assert.throws(() => outgoingCommits("refs/heads/main invalid refs/heads/main invalid"));
});

test("gate builds the committed snapshot and blocks an unsuccessful working-tree build", { timeout: 120000 }, () => {
  const repository = mkdtempSync(path.join(tmpdir(), "ossil-gate-test-"));
  const git = (args) => {
    const result = spawnSync("git", args, { cwd: repository, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  try {
    const fixture = {
      name: "gate-fixture", version: "1.0.0", private: true,
      scripts: Object.fromEntries(["db:generate", "config:check", "lint", "test", "typecheck", "build"].map(name => [name, 'node -e "process.exit(0)"'])),
    };
    writeFileSync(path.join(repository, "package.json"), JSON.stringify(fixture));
    writeFileSync(path.join(repository, "package-lock.json"), JSON.stringify({
      name: fixture.name, version: fixture.version, lockfileVersion: 3, requires: true,
      packages: { "": { name: fixture.name, version: fixture.version } },
    }));
    git(["init", "-q"]);
    mkdirSync(path.join(repository, ".githooks"));
    mkdirSync(path.join(repository, "scripts"));
    copyFileSync(new URL("../.githooks/pre-push", import.meta.url), path.join(repository, ".githooks/pre-push"));
    copyFileSync(new URL("../scripts/preflight.mjs", import.meta.url), path.join(repository, "scripts/preflight.mjs"));
    chmodSync(path.join(repository, ".githooks/pre-push"), 0o755);
    git(["config", "core.hooksPath", ".githooks"]);
    git(["add", "."]);
    git(["-c", "core.hooksPath=/dev/null", "-c", "user.name=Gate Test", "-c", "user.email=gate@example.test", "commit", "-qm", "Fixture"]);
    const revision = git(["rev-parse", "HEAD"]);
    fixture.scripts.build = 'node -e "process.exit(23)"';
    writeFileSync(path.join(repository, "package.json"), JSON.stringify(fixture));
    assert.doesNotThrow(() => verifySnapshot(repository, revision));
    assert.throws(() => verifySnapshot(repository), /push is blocked/);
    const hookInput = path.join(repository, "hook-input.txt");
    writeFileSync(hookInput, "refs/heads/main invalid refs/heads/main invalid\n");
    const blocked = spawnSync("git", ["hook", "run", `--to-stdin=${hookInput}`, "pre-push"], { cwd: repository, encoding: "utf8" });
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /Invalid outgoing revision/);
    writeFileSync(path.join(repository, ".env.production.local"), "PRIVATE_FIXTURE=true");
    assert.throws(() => verifySnapshot(repository), /Private file included/);
  } finally {
    rmSync(repository, { recursive: true, force: true, maxRetries: 3 });
  }
});