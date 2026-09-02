// Scans the uncommitted diff for credential shapes before anything is staged.
// Run with: node scripts/secret-scan.mjs
import { execSync } from "node:child_process";

const patterns = [
  ["openai key", /sk-[A-Za-z0-9]{20,}/],
  ["google api key", /AIza[0-9A-Za-z_-]{30,}/],
  ["private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["razorpay key", /rzp_(live|test)_[A-Za-z0-9]{10,}/],
  ["database url with password", /postgres(ql)?:\/\/[^\s"']*:[^\s"']*@/],
  ["google client secret", /GOCSPX-[A-Za-z0-9_-]{10,}/],
  ["aws access key", /AKIA[0-9A-Z]{16}/],
  ["slack token", /xox[baprs]-[A-Za-z0-9-]{10,}/],
];

const diff = execSync("git diff", { maxBuffer: 1e8 }).toString();
const hits = patterns.filter(([, pattern]) => pattern.test(diff)).map(([name]) => name);

if (hits.length > 0) {
  console.error(`SECRET SUSPECT: ${hits.join(", ")}`);
  process.exit(1);
}

console.log("secret scan clean");
