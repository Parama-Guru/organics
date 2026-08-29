// Generates the two values conf/config.yaml needs for the admin area.
// Run: npm run admin:hash
// The passphrase is read from stdin with echo off, so it never lands in your
// shell history and never appears in this process's argv.
import { createInterface } from "node:readline";
import { randomBytes } from "node:crypto";

import { hashPassphrase } from "../src/lib/admin-hash";

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  return new Promise((resolve) => {
    // @ts-expect-error _writeToOutput is internal but is the only way to mute echo.
    rl._writeToOutput = () => {};
    process.stdout.write(question);
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const passphrase = await prompt("New admin passphrase (input hidden): ");

if (passphrase.length < 12) {
  console.error("\nRefusing: use at least 12 characters.");
  process.exit(1);
}

console.log("\nPaste this into conf/config.yaml:\n");
console.log("admin:");
console.log(`  password_hash: "${hashPassphrase(passphrase)}"`);
console.log(`  session_secret: "${randomBytes(32).toString("hex")}"`);
console.log("  session_ttl_minutes: 480");
console.log("\nOn Render, set ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET instead.\n");
