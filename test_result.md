# Test results

How OSSIL was exercised, and what the numbers were. Reproduce with:

```bash
npm test                       # unit tests, no server needed
npm run verify:boundary        # seller ownership, hits the database
npm run build && npm start     # in one terminal
npm run test:api               # in another: endpoints, security, limits, load
```

Run on 2 September 2026 against a **production build** (`next start`), not the
dev server. Dev numbers are two to four times worse and are not a fair measure
of anything.

- App: Windows laptop, Node 22, single process
- Database: Supabase Postgres, `aws-0-ap-northeast-1` — **Tokyo**
- Redis: managed instance, used for sessions and one-time tokens

---

## 1. Unit tests — 37 passed, 0 failed

`npm test`, 12.5s.

| Area | Covers |
| --- | --- |
| credentials | admin passphrase round trip, corrupted hash records, normalisation |
| passwords | customer and seller hashing, verification |
| schemas | store applications, FSSAI, publication rules, sign-up strength, reserved handles |
| geo | distance, symmetry, nearest district, ordering with unplaced districts, rounding |
| sponsorship-ranking | priority order, stable organic order |
| request-security | bounded JSON, same-origin writes |
| i18n | dictionary parity |
| india-date | timezone independence |
| database-boundaries | a seller can only read and write their own listings |

## 2. Ownership boundary — all passed

`npm run verify:boundary`. Creates two farmers and proves A cannot read, edit,
hide or delete B's listing, and that each can manage their own.

## 3. Endpoints — 8/8 passed

| Check | Result |
| --- | --- |
| `GET /api/health` | 200, `database: ok`, `redis: ok` |
| `GET /api/products` | 200, 31 rows |
| `GET /api/products?limit=3&search=milk` | 200, filter honoured |
| `GET /api/products?sort=DROP TABLE` | 400 |
| `GET /api/products?limit=100000` | 400 |
| `GET /sitemap.xml` | 200, 15,470 bytes |
| `GET /robots.txt` | 200 |
| Unknown route | 404 |

## 4. Security — 14/14 passed

| Check | Result |
| --- | --- |
| Signed-out `/api/products` omits `priceCents` | 0 rows carried a price |
| Signed-out `/api/products` exposes no seller phone | 22,634 bytes scanned, none found |
| Price sorting neutralised when prices are hidden | `price-asc` and `price-desc` both fall back to name order |
| `POST /api/contact` cross-origin | 403 |
| `POST /api/farmers` cross-origin | 403 |
| `POST /api/stores` cross-origin | 403 |
| `POST /api/enquiries` without a session | 401 |
| Razorpay webhook, unsigned body | rejected |
| Malformed JSON | 400, no crash |
| 2MB body | 413 |
| `/tj/overview` without a session | 307 away |
| `/pannai` without a session | 307 away |
| `?near=../../etc/passwd` | 200 with the normal listing; the value never reaches a query |
| Security headers | CSP, X-Content-Type-Options, Referrer-Policy, X-Frame-Options all present |

## 5. Rate limiting — 2/2 passed

80 concurrent requests to `/api/products`: **52 allowed, 28 refused** with 429
and a `Retry-After` header.

> Worth recording: an earlier version of this test sent the same 80 requests
> one at a time and saw **zero** refusals. That was not a broken limiter — the
> endpoint is slow enough that a sequential burst outlives the 60-second window
> and the bucket resets underneath it. The test was wrong, not the app. It is
> also a reminder that a slow endpoint is a weaker one: a patient attacker stays
> under the limit without trying.

## 6. Load

60–100 requests per path at 10–20 concurrent, production build, cold cache at
the start of each run.

| Path | n | conc | ok | fail | p50 | p95 | p99 | req/s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/en` | 60 | 10 | 60 | 0 | **949ms** | 1179ms | 1215ms | 9.2 |
| `/en/products` | 60 | 10 | 60 | 0 | 1985ms | 2242ms | 2330ms | 4.7 |
| `/en/farmers` | 40 | 10 | 40 | 0 | 1664ms | 2014ms | 2061ms | 5.4 |
| `/en/products/a2-whole-milk` | 40 | 10 | 40 | 0 | 3663ms | 4786ms | 5788ms | 2.4 |
| `/api/health` | 100 | 20 | 100 | 0 | 776ms | 1094ms | 1360ms | 23.0 |

Zero failed requests anywhere. Throughput, not correctness, is the problem.

## 7. Browser matrix

27 paths × 5 widths (320/375/768/1280/1920) × light and dark × English and
Tamil.

- 270 page loads: every one HTTP 200, **zero horizontal overflow**
- 108 axe runs at 375 and 1280: **zero WCAG 2 A/AA violations**
- **Zero** console errors and zero hydration warnings

---

## Why pages are slow

The cause is not the code. It is the distance to the database.

```
SELECT 1  →  min 597ms   median 644ms   max 717ms
```

That is the simplest query Postgres can answer, and it costs **644ms**. Nothing
is being computed in that time; it is the round trip to Tokyo. Every query a
page makes pays it again:

| Measurement | Time |
| --- | --- |
| `SELECT 1` | 644ms |
| Product list with joins | 2028ms |
| Three counts in parallel | 1578ms |
| The same three sequentially | 1978ms |

So a page making three or four queries cannot be faster than about two seconds,
however well it is written. `/api/health` — which only pings Postgres and Redis
— has a p50 of 776ms for exactly this reason.

### What was done about it

Cached the public catalogue reads the home page makes (`getFeaturedProducts`,
`getRegisteredCounts`), since they return identical rows for every visitor.

| | before | after |
| --- | --- | --- |
| `/en` p50 | 2732ms | **949ms** |
| `/en` p99 | 4476ms | 1215ms |
| `/en` throughput | 3.3 req/s | **9.2 req/s** |

A 65% cut without touching the database.

That change also **introduced and then fixed a bug worth recording**:
`unstable_cache` serialises through JSON, so `Date` fields came back as strings
and every cached listing threw `RangeError: Invalid time value`. The home page
returned 500 on all 60 load requests until `checkedOn` was taught to accept the
string form. Caching is not free; it changes the types crossing the boundary.

### What has not been done

The remaining pages are still uncached and still pay full latency. Moving the
database to `ap-south-1` (Mumbai) would take the 644ms round trip to roughly
30–50ms and would improve **every** page at once, far more than any further
caching. A Supabase project's region cannot be changed after creation, so that
means a new project and a migration.
