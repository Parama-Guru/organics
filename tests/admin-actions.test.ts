import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { loadConfig } from "../conf/config";
import { issueSession } from "../src/lib/admin-auth";
import { prisma } from "../src/lib/prisma";
import { setProductActive } from "../src/app/tj/actions";

const require = createRequire(import.meta.url);
const nextHeaders = require("next/headers");
const nextCache = require("next/cache");

test("admin product changes require a session and refresh both languages after a successful write", async (context) => {
  const config = loadConfig();
  const original = { ...config.admin };
  config.admin.password_hash = "test-only-configured-hash";
  config.admin.session_secret = "test-only-admin-session-secret-0123456789";
  context.after(() => { Object.assign(config.admin, original); });
  let signedIn = false;
  const { token } = issueSession();
  context.mock.method(nextHeaders, "cookies", async () => ({ get: () => signedIn ? { value: token } : undefined }));
  const paths: string[] = [];
  const tags: string[] = [];
  context.mock.method(nextCache, "revalidatePath", (value: string) => { paths.push(value); });
  context.mock.method(nextCache, "updateTag", (value: string) => { tags.push(value); });
  let writes = 0;
  const originalWrite = prisma.product.updateMany;
  Object.assign(prisma.product, { updateMany: async () => { writes += 1; return { count: 1 }; } });
  context.after(() => { Object.assign(prisma.product, { updateMany: originalWrite }); });
  const form = new FormData();
  form.set("productId", "test-product");
  assert.equal((await setProductActive(false, form)).ok, false);
  assert.equal(writes, 0);
  signedIn = true;
  assert.equal((await setProductActive(false, new FormData())).ok, false);
  assert.equal(writes, 0);
  assert.deepEqual(await setProductActive(false, form), { ok: true });
  assert.equal(writes, 1);
  assert.deepEqual(tags, ["catalog"]);
  for (const expected of ["/en", "/ta", "/en/products", "/ta/products", "/en/farmers", "/ta/farmers", "/tj/listings", "/tj/overview"]) {
    assert.ok(paths.includes(expected), `${expected} must refresh`);
  }
});