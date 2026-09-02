/**
 * Endpoint, security and load checks against a running server.
 *
 *   npm run build && npm start      # in one terminal
 *   npm run test:api                # in another
 *
 * Point it elsewhere with BASE_URL. Everything here is read-only or is a write
 * that the server is expected to refuse, so it is safe against a live instance.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

type Result = {
  group: string;
  name: string;
  pass: boolean;
  detail: string;
};

const results: Result[] = [];

function record(group: string, name: string, pass: boolean, detail = "") {
  results.push({ group, name, pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${group} — ${name}${detail ? `  (${detail})` : ""}`);
}

async function check(
  group: string,
  name: string,
  fn: () => Promise<{ pass: boolean; detail?: string }>,
) {
  try {
    const { pass, detail } = await fn();
    record(group, name, pass, detail ?? "");
  } catch (error) {
    record(group, name, false, `threw: ${(error as Error).message}`);
  }
}

const json = { "content-type": "application/json" };

// ---------------------------------------------------------------- endpoints

async function endpointTests() {
  const group = "Endpoints";

  await check(group, "GET /api/health reports every dependency", async () => {
    const res = await fetch(`${BASE}/api/health`);
    const body = await res.json();
    return {
      pass: res.status === 200 && body.database === "ok" && body.redis === "ok",
      detail: JSON.stringify(body),
    };
  });

  await check(group, "GET /api/products returns the catalogue", async () => {
    const res = await fetch(`${BASE}/api/products`);
    const body = await res.json();
    return {
      pass: res.status === 200 && Array.isArray(body.products) && body.products.length > 0,
      detail: `${body.products?.length ?? 0} rows`,
    };
  });

  await check(group, "GET /api/products honours filters", async () => {
    const res = await fetch(`${BASE}/api/products?limit=3&search=milk`);
    const body = await res.json();
    return { pass: res.status === 200 && body.products.length <= 3, detail: `${body.products.length} rows` };
  });

  await check(group, "GET /api/products rejects a bad sort", async () => {
    const res = await fetch(`${BASE}/api/products?sort=DROP%20TABLE`);
    return { pass: res.status === 400, detail: `status ${res.status}` };
  });

  await check(group, "GET /api/products rejects an oversized limit", async () => {
    const res = await fetch(`${BASE}/api/products?limit=100000`);
    return { pass: res.status === 400, detail: `status ${res.status}` };
  });

  await check(group, "GET /sitemap.xml is served", async () => {
    const res = await fetch(`${BASE}/sitemap.xml`);
    const text = await res.text();
    return { pass: res.status === 200 && text.includes("<urlset"), detail: `${text.length} bytes` };
  });

  await check(group, "GET /robots.txt is served", async () => {
    const res = await fetch(`${BASE}/robots.txt`);
    const text = await res.text();
    return { pass: res.status === 200 && text.includes("Sitemap"), detail: text.split("\n")[0] };
  });

  await check(group, "Unknown route returns 404", async () => {
    const res = await fetch(`${BASE}/en/this-page-does-not-exist`);
    return { pass: res.status === 404, detail: `status ${res.status}` };
  });
}

// ---------------------------------------------------------------- security

async function securityTests() {
  const group = "Security";

  await check(group, "signed-out /api/products omits priceCents", async () => {
    const res = await fetch(`${BASE}/api/products?limit=5`);
    const body = await res.json();
    const leaked = body.products.filter((p: Record<string, unknown>) => "priceCents" in p);
    return { pass: leaked.length === 0, detail: `${leaked.length} rows carried a price` };
  });

  await check(group, "signed-out /api/products never exposes a seller phone", async () => {
    const res = await fetch(`${BASE}/api/products?limit=60`);
    const text = await res.text();
    return { pass: !/"phone"\s*:/.test(text), detail: `${text.length} bytes scanned` };
  });

  await check(group, "price sorting is neutralised for signed-out callers", async () => {
    const asc = await (await fetch(`${BASE}/api/products?sort=price-asc&limit=8`)).json();
    const desc = await (await fetch(`${BASE}/api/products?sort=price-desc&limit=8`)).json();
    const a = asc.products.map((p: { slug: string }) => p.slug).join(",");
    const b = desc.products.map((p: { slug: string }) => p.slug).join(",");
    return { pass: a === b, detail: a === b ? "both fall back to name order" : "orders differ" };
  });

  await check(group, "POST /api/contact refuses a cross-origin write", async () => {
    const res = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { ...json, origin: "https://evil.example" },
      body: JSON.stringify({ role: "BUYER", name: "x", email: "a@b.test", message: "hello there" }),
    });
    return { pass: res.status === 403, detail: `status ${res.status}` };
  });

  await check(group, "POST /api/farmers refuses a cross-origin write", async () => {
    const res = await fetch(`${BASE}/api/farmers`, {
      method: "POST",
      headers: { ...json, origin: "https://evil.example" },
      body: JSON.stringify({ farmName: "x" }),
    });
    return { pass: res.status === 403, detail: `status ${res.status}` };
  });

  await check(group, "POST /api/stores refuses a cross-origin write", async () => {
    const res = await fetch(`${BASE}/api/stores`, {
      method: "POST",
      headers: { ...json, origin: "https://evil.example" },
      body: JSON.stringify({ storeName: "x" }),
    });
    return { pass: res.status === 403, detail: `status ${res.status}` };
  });

  await check(group, "POST /api/enquiries requires a session", async () => {
    const res = await fetch(`${BASE}/api/enquiries`, {
      method: "POST",
      headers: { ...json, origin: BASE },
      body: JSON.stringify({ recipientType: "FARMER", recipientId: "x", subject: "a", message: "b" }),
    });
    return { pass: res.status === 401 || res.status === 403, detail: `status ${res.status}` };
  });

  await check(group, "Razorpay webhook refuses an unsigned body", async () => {
    const res = await fetch(`${BASE}/api/billing/razorpay/webhook`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ event: "subscription.charged" }),
    });
    return { pass: res.status >= 400, detail: `status ${res.status}` };
  });

  await check(group, "malformed JSON is rejected, not crashed on", async () => {
    const res = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { ...json, origin: BASE },
      body: "{not json",
    });
    return { pass: res.status === 400, detail: `status ${res.status}` };
  });

  await check(group, "an oversized body is refused", async () => {
    const res = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { ...json, origin: BASE },
      body: JSON.stringify({ role: "BUYER", name: "x", email: "a@b.test", message: "z".repeat(2_000_000) }),
    });
    return { pass: res.status === 400 || res.status === 413, detail: `status ${res.status}` };
  });

  await check(group, "staff area is not reachable without a session", async () => {
    const res = await fetch(`${BASE}/tj/overview`, { redirect: "manual" });
    return { pass: res.status === 404 || res.status === 307 || res.status === 302, detail: `status ${res.status}` };
  });

  await check(group, "farmer portal is not reachable without a session", async () => {
    const res = await fetch(`${BASE}/pannai`, { redirect: "manual" });
    return { pass: res.status === 307 || res.status === 302 || res.status === 404, detail: `status ${res.status}` };
  });

  await check(group, "path traversal in a filter is ignored", async () => {
    const res = await fetch(`${BASE}/en/farmers?near=../../etc/passwd`);
    return { pass: res.status === 200, detail: `status ${res.status}` };
  });

  await check(group, "security headers are present", async () => {
    const res = await fetch(`${BASE}/en`);
    const wanted = [
      "content-security-policy",
      "x-content-type-options",
      "referrer-policy",
      "x-frame-options",
    ];
    const missing = wanted.filter((h) => !res.headers.get(h));
    return { pass: missing.length === 0, detail: missing.length ? `missing ${missing.join(", ")}` : "all present" };
  });
}

// ---------------------------------------------------------------- rate limits

async function rateLimitTests() {
  const group = "Rate limits";

  // Concurrent on purpose. Sent one at a time these requests take long enough
  // that the burst outlives the window and the bucket resets mid-test.
  await check(group, "GET /api/products limits a burst (60/min)", async () => {
    const codes = await Promise.all(
      Array.from({ length: 80 }, () =>
        fetch(`${BASE}/api/products?limit=1`).then((r) => r.status).catch(() => 0),
      ),
    );
    const ok = codes.filter((c) => c === 200).length;
    const limited = codes.filter((c) => c === 429).length;
    return { pass: limited > 0 && ok <= 60, detail: `${ok} allowed, ${limited} refused` };
  });

  await check(group, "a refusal carries Retry-After", async () => {
    const responses = await Promise.all(
      Array.from({ length: 40 }, () => fetch(`${BASE}/api/products?limit=1`).catch(() => null)),
    );
    const refused = responses.find((r) => r?.status === 429);
    const header = refused?.headers.get("retry-after") ?? null;
    return { pass: header !== null, detail: header ? `Retry-After: ${header}` : "no 429 seen" };
  });
}

// ---------------------------------------------------------------- load

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

type LoadResult = {
  path: string;
  requests: number;
  concurrency: number;
  ok: number;
  failed: number;
  rateLimited: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  rps: number;
};

async function loadTest(path: string, requests: number, concurrency: number): Promise<LoadResult> {
  const timings: number[] = [];
  let ok = 0;
  let failed = 0;
  let rateLimited = 0;
  let issued = 0;

  const started = Date.now();

  async function worker() {
    while (issued < requests) {
      issued++;
      const t0 = Date.now();
      try {
        const res = await fetch(`${BASE}${path}`);
        const elapsed = Date.now() - t0;
        // A refusal is the rate limiter working, not a failure, but it is far
        // too fast to belong in the latency figures.
        if (res.status === 429) {
          rateLimited++;
        } else if (res.ok) {
          ok++;
          timings.push(elapsed);
        } else {
          failed++;
        }
        await res.arrayBuffer();
      } catch {
        failed++;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const seconds = (Date.now() - started) / 1000;
  const sorted = timings.sort((a, b) => a - b);

  return {
    path,
    requests,
    concurrency,
    ok,
    failed,
    rateLimited,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted.at(-1) ?? 0,
    rps: Number((ok / seconds).toFixed(1)),
  };
}

async function loadTests(): Promise<LoadResult[]> {
  console.log("\n--- Load ---");
  const plans: [string, number, number][] = [
    ["/en", 60, 10],
    ["/en/products", 60, 10],
    ["/en/farmers", 40, 10],
    ["/en/products/a2-whole-milk", 40, 10],
    ["/api/health", 100, 20],
  ];

  const out: LoadResult[] = [];
  for (const [path, requests, concurrency] of plans) {
    // Let the per-minute limiter drain so the previous section does not skew this one.
    await new Promise((r) => setTimeout(r, 1000));
    const result = await loadTest(path, requests, concurrency);
    out.push(result);
    console.log(
      `${path.padEnd(30)} n=${result.requests} c=${result.concurrency} ` +
        `ok=${result.ok} fail=${result.failed} 429=${result.rateLimited} ` +
        `p50=${result.p50}ms p95=${result.p95}ms p99=${result.p99}ms rps=${result.rps}`,
    );
  }
  return out;
}

// ---------------------------------------------------------------- run

async function main() {
  console.log(`Target: ${BASE}\n--- Endpoints ---`);
  await endpointTests();
  console.log("\n--- Security ---");
  await securityTests();
  console.log("\n--- Rate limits ---");
  await rateLimitTests();
  const load = await loadTests();

  const failures = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failures.length}/${results.length} checks passed.`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ${f.group} — ${f.name}: ${f.detail}`);
  }

  // Machine-readable, so the summary in test_result.md is transcribed rather
  // than remembered.
  console.log("\n<<<JSON>>>");
  console.log(JSON.stringify({ results, load }, null, 2));

  process.exitCode = failures.length ? 1 : 0;
}

await main();
