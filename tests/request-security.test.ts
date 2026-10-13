import assert from "node:assert/strict";
import test from "node:test";

import type { NextRequest } from "next/server";

import { readBoundedJson } from "../src/lib/request-body";
import { hasCanonicalHost, isSameOrigin } from "../src/lib/same-origin";

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

test("same-origin checks tolerate TLS termination without trusting forwarded host headers", () => {
  const proxied = new Request("http://0.0.0.0:3000/api/visitors", {
    method: "POST",
    headers: { host: "organics-production.up.railway.app", origin: "https://organics-production.up.railway.app" },
  }) as NextRequest;
  assert.equal(isSameOrigin(proxied), true);
  proxied.headers.set("origin", "https://attacker.example");
  proxied.headers.set("x-forwarded-host", "attacker.example");
  assert.equal(isSameOrigin(proxied), false);
});

test("canonical host checks tolerate TLS termination without trusting forwarded hosts", () => {
  const canonical = "https://www.ossil.in";
  const proxied = new Request("http://0.0.0.0:3000/api/auth/google", {
    headers: { host: "www.ossil.in" },
  }) as NextRequest;
  assert.equal(hasCanonicalHost(proxied, canonical), true);
  assert.equal(hasCanonicalHost(request("{}", { host: "www.ossil.in" }), canonical), true);
  proxied.headers.set("host", "ossil.in");
  assert.equal(hasCanonicalHost(proxied, canonical), false);
  proxied.headers.set("host", "attacker.example");
  proxied.headers.set("x-forwarded-host", "www.ossil.in");
  assert.equal(hasCanonicalHost(proxied, canonical), false);
  proxied.headers.delete("host");
  assert.equal(hasCanonicalHost(proxied, canonical), false);
  proxied.headers.set("host", "localhost:3000");
  assert.equal(hasCanonicalHost(proxied, "http://localhost:3000"), true);
  assert.equal(hasCanonicalHost(proxied, "http://localhost:3001"), false);
});

test("Google callback errors use the configured public origin behind a proxy", async () => {
  const { NextRequest } = await import("next/server");
  const { loadConfig } = await import("../conf/config");
  const { GET } = await import("../src/app/api/auth/google/callback/route");
  const canonical = new URL(loadConfig().app.site_url);

  for (const query of ["", "?state=invalid"]) {
    const response = await GET(new NextRequest(`http://0.0.0.0:3000/api/auth/google/callback${query}`, {
      headers: { host: canonical.host },
    }));
    assert.equal(response.status, 303);
    const target = new URL(response.headers.get("location")!);
    assert.equal(target.origin, canonical.origin);
    assert.match(target.pathname, /^\/(ta|en)\/account\/sign-in$/);
    assert.equal(target.searchParams.get("oauth"), "invalid");
  }
});
