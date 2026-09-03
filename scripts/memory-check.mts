/**
 * Resident memory of the running server, and what it does under load.
 * The Render free plan gives 512MB, so this is the number that decides whether
 * the service stays up or is killed.
 *
 *   npm start            # in one terminal
 *   npx tsx scripts/memory-check.mts
 */
import { execSync } from "node:child_process";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const LIMIT_MB = 512;

function serverProcesses(): { pid: number; mb: number; cmd: string }[] {
  if (process.platform !== "win32") {
    const raw = execSync("ps -eo pid,rss,args | grep -i node | grep -v grep").toString();
    return raw
      .trim()
      .split("\n")
      .map((line) => {
        const [pid, rss, ...rest] = line.trim().split(/\s+/);
        return { pid: Number(pid), mb: Number(rss) / 1024, cmd: rest.join(" ").slice(0, 60) };
      });
  }

  const raw = execSync(
    'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'node.exe\'\\" | Select-Object ProcessId,WorkingSetSize,CommandLine | ConvertTo-Json -Compress"',
  ).toString();
  const parsed = JSON.parse(raw || "[]");
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return rows.map((row) => ({
    pid: row.ProcessId,
    mb: row.WorkingSetSize / 1048576,
    cmd: String(row.CommandLine ?? "").slice(0, 70),
  }));
}

function report(label: string) {
  const procs = serverProcesses().sort((a, b) => b.mb - a.mb);
  console.log(`\n${label}`);
  for (const p of procs) {
    console.log(`  pid ${String(p.pid).padStart(6)}  ${p.mb.toFixed(1).padStart(7)} MB  ${p.cmd}`);
  }
  const largest = procs[0];
  if (largest) {
    const share = ((largest.mb / LIMIT_MB) * 100).toFixed(0);
    console.log(`  largest single process: ${largest.mb.toFixed(1)} MB of ${LIMIT_MB} MB (${share}%)`);
  }
  return largest?.mb ?? 0;
}

const paths = ["/en", "/ta", "/en/products", "/en/farmers", "/en/stores", "/en/products/a2-whole-milk"];

const idle = report("Idle");

console.log("\nDriving traffic…");
for (let round = 0; round < 6; round++) {
  await Promise.all(
    paths.map((p) =>
      fetch(`${BASE}${p}`)
        .then((r) => r.arrayBuffer())
        .catch(() => undefined),
    ),
  );
}

const loaded = report("After load");

console.log(
  `\nGrowth under load: ${(loaded - idle).toFixed(1)} MB.` +
    (loaded > LIMIT_MB * 0.8
      ? `  WARNING: over 80% of the ${LIMIT_MB} MB free-plan limit.`
      : `  Headroom: ${(LIMIT_MB - loaded).toFixed(0)} MB.`),
);
