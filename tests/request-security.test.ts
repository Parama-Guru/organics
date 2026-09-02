import assert from "node:assert/strict";
import test from "node:test";

import type { NextRequest } from "next/server";

import { readBoundedJson } from "../src/lib/request-body";
import { isSameOrigin } from "../src/lib/same-origin";

function request(body: string, headers: Record<string, string> = {}): NextRequest {
  return new Request("https://ossil.in/api/test", {
    method: "POST",
    headers,
    body,
  }) as NextRequest;
}

test("bounded JSON accepts a small object", async () => {
  assert.deepEqual(await readBoundedJson(request('{"ok":true}'), 100), {
    ok: true,
    value: { ok: true },
  });
});

test("bounded JSON rejects malformed, declared-large and streamed-large bodies", async () => {
  assert.deepEqual(await readBoundedJson(request("{"), 100), { ok: false, tooLarge: false });
  assert.deepEqual(
    await readBoundedJson(request("{}", { "content-length": "1000" }), 100),
    { ok: false, tooLarge: true },
  );
  assert.deepEqual(await readBoundedJson(request('"123456"'), 4), {
    ok: false,
    tooLarge: true,
  });
});

test("same-origin writes accept local or absent origins and reject mismatches", () => {
  assert.equal(isSameOrigin(request("{}", { host: "ossil.in" })), true);
  assert.equal(
    isSameOrigin(request("{}", { host: "ossil.in", origin: "https://ossil.in" })),
    true,
  );
  assert.equal(
    isSameOrigin(request("{}", { host: "ossil.in", origin: "https://attacker.example" })),
    false,
  );
  assert.equal(isSameOrigin(request("{}", { host: "ossil.in", origin: "not a url" })), false);
});
